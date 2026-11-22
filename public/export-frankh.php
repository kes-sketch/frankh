<?php
/**
 * FRANK HAUSGERÄTE - Exportateur complet WordPress & WooCommerce
 * Déposez ce fichier à la racine de votre site (public_html/export-frankh.php)
 * puis ouvrez dans votre navigateur : https://frankhausgeraete.de/export-frankh.php?token=frankh2026
 */

if (!isset($_GET['token']) || $_GET['token'] !== 'frankh2026') {
    http_response_code(403);
    die('Accès refusé. Token invalide.');
}

// Charger le moteur WordPress
if (file_exists(__DIR__ . '/wp-load.php')) {
    require_once __DIR__ . '/wp-load.php';
} else {
    http_response_code(500);
    die('Erreur : wp-load.php introuvable. Veuillez placer ce script dans le dossier racine de WordPress (public_html).');
}

// Augmenter limites mémoire et temps
@ini_set('memory_limit', '512M');
@set_time_limit(300);

header('Content-Type: application/json; charset=utf-8');
header('Content-Disposition: attachment; filename="frankhausgeraete-export-' . date('Y-m-d') . '.json"');

$data = [
    'exported_at' => date('c'),
    'site_url' => get_site_url(),
    'products' => [],
    'reviews' => [],
    'orders' => [],
    'pages' => [],
    'articles' => [],
    'shipping' => []
];

// 1. PRODUITS
$product_posts = get_posts([
    'post_type' => ['product'],
    'post_status' => ['publish', 'draft'],
    'numberposts' => -1,
]);

foreach ($product_posts as $post) {
    $wc_prod = function_exists('wc_get_product') ? wc_get_product($post->ID) : null;
    if (!$wc_prod) continue;

    $categories = [];
    $terms = get_the_terms($post->ID, 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $t) {
            $categories[] = [
                'id' => $t->term_id,
                'name' => $t->name,
                'slug' => $t->slug,
                'parent' => $t->parent
            ];
        }
    }

    $image_urls = [];
    $thumb_id = $wc_prod->get_image_id();
    if ($thumb_id) {
        $src = wp_get_attachment_image_url($thumb_id, 'full');
        if ($src) $image_urls[] = $src;
    }
    if (method_exists($wc_prod, 'get_gallery_image_ids')) {
        foreach ($wc_prod->get_gallery_image_ids() as $gal_id) {
            $src = wp_get_attachment_image_url($gal_id, 'full');
            if ($src) $image_urls[] = $src;
        }
    }

    // SEO RankMath & Yoast
    $meta_title = get_post_meta($post->ID, 'rank_math_title', true) ?: get_post_meta($post->ID, '_yoast_wpseo_title', true);
    $meta_desc = get_post_meta($post->ID, 'rank_math_description', true) ?: get_post_meta($post->ID, '_yoast_wpseo_metadesc', true);
    $gtin = get_post_meta($post->ID, '_gtin', true) ?: (get_post_meta($post->ID, 'gtin', true) ?: get_post_meta($post->ID, 'hwp_product_gtin', true));

    // Variations
    $variations = [];
    if ($wc_prod->is_type('variable')) {
        foreach ($wc_prod->get_children() as $var_id) {
            $var_obj = wc_get_product($var_id);
            if ($var_obj) {
                $var_img = '';
                $v_thumb = $var_obj->get_image_id();
                if ($v_thumb) $var_img = wp_get_attachment_image_url($v_thumb, 'full');

                $variations[] = [
                    'id' => $var_id,
                    'price' => (float)$var_obj->get_price(),
                    'regular_price' => (float)$var_obj->get_regular_price(),
                    'sale_price' => (float)$var_obj->get_sale_price(),
                    'stock' => $var_obj->get_stock_quantity(),
                    'attributes' => $var_obj->get_attributes(),
                    'image' => $var_img
                ];
            }
        }
    }

    $data['products'][] = [
        'id' => $post->ID,
        'name' => $wc_prod->get_name(),
        'slug' => $post->post_name,
        'type' => $wc_prod->get_type(),
        'description' => $wc_prod->get_description(),
        'short_description' => $wc_prod->get_short_description(),
        'price' => (float)$wc_prod->get_price(),
        'regular_price' => (float)$wc_prod->get_regular_price(),
        'sale_price' => (float)$wc_prod->get_sale_price(),
        'stock' => $wc_prod->get_stock_quantity() ?? 100,
        'images' => $image_urls,
        'categories' => $categories,
        'meta_title' => $meta_title,
        'meta_description' => $meta_desc,
        'gtin' => $gtin,
        'attributes' => $wc_prod->get_attributes(),
        'variations' => $variations
    ];
}

// 2. AVIS CLIENTS (REVIEWS)
$comments = get_comments([
    'post_type' => 'product',
    'status' => 'approve'
]);
foreach ($comments as $c) {
    $rating = get_comment_meta($c->comment_ID, 'rating', true);
    $data['reviews'][] = [
        'id' => $c->comment_ID,
        'product_id' => $c->comment_post_ID,
        'product_name' => get_the_title($c->comment_post_ID),
        'reviewer' => $c->comment_author,
        'reviewer_email' => $c->comment_author_email,
        'rating' => (int)($rating ?: 5),
        'comment' => $c->comment_content,
        'date' => $c->comment_date
    ];
}

// 3. COMMANDES (ORDERS)
if (function_exists('wc_get_orders')) {
    $orders = wc_get_orders(['limit' => -1]);
    foreach ($orders as $order) {
        $items = [];
        foreach ($order->get_items() as $item) {
            $items[] = [
                'product_name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'total' => (float)$item->get_total(),
                'price' => (float)$item->get_subtotal() / max(1, $item->get_quantity())
            ];
        }
        $data['orders'][] = [
            'id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'total' => (float)$order->get_total(),
            'currency' => $order->get_currency(),
            'created_at' => $order->get_date_created() ? $order->get_date_created()->date('c') : date('c'),
            'billing' => [
                'first_name' => $order->get_billing_first_name(),
                'last_name' => $order->get_billing_last_name(),
                'email' => $order->get_billing_email(),
                'phone' => $order->get_billing_phone(),
                'address_1' => $order->get_billing_address_1(),
                'city' => $order->get_billing_city(),
                'postcode' => $order->get_billing_postcode(),
                'country' => $order->get_billing_country()
            ],
            'items' => $items
        ];
    }
}

// 4. PAGES
$pages = get_posts([
    'post_type' => 'page',
    'post_status' => 'publish',
    'numberposts' => -1
]);
foreach ($pages as $p) {
    $data['pages'][] = [
        'title' => $p->post_title,
        'slug' => $p->post_name,
        'content' => $p->post_content,
        'excerpt' => $p->post_excerpt
    ];
}

// 5. ARTICLES DE BLOG (POSTS)
$posts = get_posts([
    'post_type' => 'post',
    'post_status' => 'publish',
    'numberposts' => -1
]);
foreach ($posts as $p) {
    $thumb = get_the_post_thumbnail_url($p->ID, 'full') ?: '';
    $data['articles'][] = [
        'title' => $p->post_title,
        'slug' => $p->post_name,
        'content' => $p->post_content,
        'excerpt' => $p->post_excerpt,
        'image' => $thumb,
        'date' => $p->post_date
    ];
}

// 6. LIVRAISON (SHIPPING ZONES)
if (class_exists('WC_Shipping_Zones')) {
    $zones = WC_Shipping_Zones::get_zones();
    foreach ($zones as $z) {
        $methods = [];
        foreach ($z['shipping_methods'] as $m) {
            $methods[] = [
                'id' => $m->id,
                'title' => $m->get_title(),
                'cost' => (float)($m->get_option('cost') ?: 0),
                'enabled' => $m->enabled === 'yes'
            ];
        }
        $data['shipping'][] = [
            'id' => $z['id'],
            'name' => $z['zone_name'],
            'methods' => $methods
        ];
    }
}

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
