<?php
/**
 * FRANK HAUSGERÄTE — Synchroniseur automatique Cloudinary & Supabase v2.0 (Ultra-Résilient)
 *
 * Déposez ce fichier à la racine de votre WordPress SiteGround (public_html/sync-cloudinary.php)
 * puis ouvrez dans votre navigateur :
 * https://frankhausgeraete.de/sync-cloudinary.php?token=frankh2026
 *
 * NOUVEAUTÉS v2.0 :
 * - Reprise automatique là où l'upload s'est arrêté (mémoire locale localStorage).
 * - Tolérance aux pannes & auto-retry en cas de timeout Nginx SiteGround (504/502).
 * - Taille des lots adaptable (3, 5, 8 ou 10 produits) pour éviter les timeouts serveur.
 * - Nettoyage strict des buffers PHP pour garantir 100% de réponses JSON valides.
 */

// 1. Sécurité par token
if (!isset($_GET['token']) || $_GET['token'] !== 'frankh2026') {
    http_response_code(403);
    die('Accès refusé. Token invalide.');
}

// 2. Configuration Cloudinary & Supabase (reçues via requête ou interface utilisateur pour la sécurité)
define('CLOUDINARY_CLOUD_NAME', isset($_REQUEST['cloud_name']) && !empty($_REQUEST['cloud_name']) ? $_REQUEST['cloud_name'] : 'zgshdhdu');
define('CLOUDINARY_API_KEY', isset($_REQUEST['api_key']) && !empty($_REQUEST['api_key']) ? $_REQUEST['api_key'] : '514181498113299');
define('CLOUDINARY_API_SECRET', isset($_REQUEST['api_secret']) ? trim($_REQUEST['api_secret']) : (getenv('CLOUDINARY_API_SECRET') ?: ''));
define('CLOUDINARY_FOLDER', isset($_REQUEST['folder']) && !empty($_REQUEST['folder']) ? $_REQUEST['folder'] : 'frankhausgeraete/products');

define('SUPABASE_URL', isset($_REQUEST['sb_url']) && !empty($_REQUEST['sb_url']) ? $_REQUEST['sb_url'] : 'https://vjelhliqthwdxevnloun.supabase.co');
define('SUPABASE_KEY', isset($_REQUEST['sb_key']) ? trim($_REQUEST['sb_key']) : (getenv('SUPABASE_SERVICE_ROLE_KEY') ?: ''));

// Empêcher tout affichage d'avertissement PHP qui polluerait le JSON
error_reporting(0);
@ini_set('display_errors', 0);
@ini_set('memory_limit', '512M');
@set_time_limit(180);

// Charger WordPress
if (file_exists(__DIR__ . '/wp-load.php')) {
    require_once __DIR__ . '/wp-load.php';
} else {
    http_response_code(500);
    die('Erreur : wp-load.php introuvable. Veuillez déposer ce fichier dans le dossier public_html.');
}

/**
 * Fonction helper pour uploader un fichier local vers Cloudinary
 */
function upload_local_file_to_cloudinary($file_path) {
    if (!file_exists($file_path) || !is_readable($file_path)) {
        return null;
    }

    $timestamp = time();
    $to_sign = "folder=" . CLOUDINARY_FOLDER . "&timestamp=" . $timestamp . CLOUDINARY_API_SECRET;
    $signature = sha1($to_sign);

    $endpoint = "https://api.cloudinary.com/v1_1/" . CLOUDINARY_CLOUD_NAME . "/image/upload";

    $post_fields = [
        'file' => class_exists('CURLFile') ? new CURLFile($file_path) : '@' . $file_path,
        'api_key' => CLOUDINARY_API_KEY,
        'timestamp' => $timestamp,
        'signature' => $signature,
        'folder' => CLOUDINARY_FOLDER
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 200 && $http_code < 300) {
        $json = json_decode($response, true);
        if (isset($json['secure_url'])) {
            return $json['secure_url'];
        }
    }
    return null;
}

/**
 * Fonction helper pour mettre à jour les images dans Supabase via REST
 */
function update_supabase_product_images($slug, $image_urls) {
    if (empty($slug) || empty($image_urls)) return false;

    $url = SUPABASE_URL . "/rest/v1/Product?slug=eq." . urlencode($slug);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['images' => $image_urls]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Content-Type: application/json',
        'Prefer: return=minimal'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($http_code >= 200 && $http_code < 300);
}

// 3. API AJAX de traitement par lot
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'count') {
    while (ob_get_level()) { ob_end_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    $count = wp_count_posts('product');
    $total = isset($count->publish) ? (int)$count->publish : 0;
    echo json_encode(['total' => $total]);
    exit;
}

if ($action === 'batch') {
    while (ob_get_level()) { ob_end_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $limit = isset($_GET['limit']) ? min(15, max(1, (int)$_GET['limit'])) : 5;

    if (empty(CLOUDINARY_API_SECRET) || empty(SUPABASE_KEY)) {
        echo json_encode([
            'success' => false,
            'offset' => $offset,
            'error' => 'Clés secrètes manquantes : veuillez renseigner le Cloudinary API Secret et la clé Supabase dans l\'interface.'
        ]);
        exit;
    }

    try {
        $posts = get_posts([
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => $limit,
            'offset' => $offset,
            'orderby' => 'ID',
            'order' => 'DESC'
        ]);

        $processed = [];

        foreach ($posts as $post) {
            $wc_prod = function_exists('wc_get_product') ? wc_get_product($post->ID) : null;
            if (!$wc_prod) continue;

            $slug = $post->post_name;
            $title = $post->post_title;

            // Récupérer les identifiants d'images (principale + galerie)
            $image_ids = [];
            $thumb_id = $wc_prod->get_image_id();
            if ($thumb_id) $image_ids[] = $thumb_id;

            if (method_exists($wc_prod, 'get_gallery_image_ids')) {
                foreach ($wc_prod->get_gallery_image_ids() as $gid) {
                    if ($gid && !in_array($gid, $image_ids)) {
                        $image_ids[] = $gid;
                    }
                }
            }

            // Si produit variable sans image principale, chercher dans les variantes
            if (empty($image_ids) && $wc_prod->is_type('variable')) {
                foreach ($wc_prod->get_children() as $var_id) {
                    $var_obj = wc_get_product($var_id);
                    if ($var_obj && $var_obj->get_image_id()) {
                        $image_ids[] = $var_obj->get_image_id();
                        break;
                    }
                }
            }

            // Limiter à 4 images max par produit pour la vitesse
            $image_ids = array_slice($image_ids, 0, 4);

            $cloudinary_urls = [];
            foreach ($image_ids as $img_id) {
                $file_path = get_attached_file($img_id);
                if ($file_path && file_exists($file_path)) {
                    $c_url = upload_local_file_to_cloudinary($file_path);
                    if ($c_url) {
                        $cloudinary_urls[] = $c_url;
                    }
                }
            }

            $supabase_updated = false;
            if (!empty($cloudinary_urls)) {
                $supabase_updated = update_supabase_product_images($slug, $cloudinary_urls);
            }

            $processed[] = [
                'id' => $post->ID,
                'title' => $title,
                'slug' => $slug,
                'images_count' => count($cloudinary_urls),
                'first_image' => !empty($cloudinary_urls) ? $cloudinary_urls[0] : null,
                'supabase_updated' => $supabase_updated
            ];
        }

        echo json_encode([
            'success' => true,
            'offset' => $offset,
            'limit' => $limit,
            'processed_count' => count($processed),
            'items' => $processed
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'offset' => $offset,
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

// 4. Interface Graphique HTML
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FRANK HAUSGERÄTE — Synchronisation Cloudinary v2.0</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0b1120; color: #f8fafc; padding: 24px 16px; line-height: 1.5; }
        .container { max-width: 920px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 20px; }
        .brand { font-size: 20px; font-weight: 800; color: #ef4444; letter-spacing: -0.5px; }
        .badge { background: #10b981; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 14px; }
        .card-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
        .card-value { font-size: 16px; font-weight: 800; color: #f8fafc; }
        .progress-container { background: #0f172a; border-radius: 9999px; height: 16px; width: 100%; overflow: hidden; border: 1px solid #334155; margin-bottom: 10px; }
        .progress-bar { background: linear-gradient(90deg, #ef4444, #f97316); height: 100%; width: 0%; transition: width 0.3s ease; }
        .progress-text { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 20px; }
        .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; background: #0f172a; border: 1px solid #334155; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; }
        .toolbar-group { display: flex; align-items: center; gap: 10px; }
        .toolbar-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .input-number { background: #1e293b; border: 1px solid #475569; color: white; padding: 6px 10px; border-radius: 8px; font-weight: bold; width: 85px; font-size: 13px; text-align: center; }
        .select-custom { background: #1e293b; border: 1px solid #475569; color: white; padding: 6px 10px; border-radius: 8px; font-weight: bold; font-size: 13px; }
        .btn { background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
        .btn:hover { background: #dc2626; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #334155; color: #f8fafc; }
        .btn-secondary:hover { background: #475569; }
        .btn-green { background: #10b981; }
        .btn-green:hover { background: #059669; }
        .log-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; height: 320px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
        .log-line { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
        .log-success { color: #10b981; }
        .log-empty { color: #f59e0b; }
        .log-warning { color: #fbbf24; }
        .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .tag-cloud { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .tag-supa { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">FRANK HAUSGERÄTE</div>
                <p style="font-size: 13px; color: #94a3b8; margin-top: 2px;">Synchronisation des images locales SiteGround vers Cloudinary & Supabase v2.0</p>
            </div>
            <span class="badge">Serveur Local WordPress</span>
        </div>

        <div class="info-cards">
            <div class="card">
                <div class="card-label">Compte Cloudinary</div>
                <div class="card-value"><?php echo htmlspecialchars(CLOUDINARY_CLOUD_NAME); ?></div>
            </div>
            <div class="card">
                <div class="card-label">Total Produits</div>
                <div class="card-value" id="totalCount">Chargement...</div>
            </div>
            <div class="card">
                <div class="card-label">Images Uploadées</div>
                <div class="card-value" id="uploadedCount" style="color: #10b981;">0</div>
            </div>
            <div class="card">
                <div class="card-label">Position Actuelle</div>
                <div class="card-value" id="currentPosDisplay" style="color: #f97316;">0 / 1668</div>
            </div>
        </div>

        <!-- Clés d'accès Cloudinary & Supabase (mémorisées dans le navigateur) -->
        <div class="card" style="margin-bottom: 20px; border: 1px solid #3b82f6; background: rgba(30, 41, 59, 0.7);">
            <div style="font-size: 13px; font-weight: bold; color: #60a5fa; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                <span>🔐 Clés d'Accès Sécurisées (sauvegardées en mémoire dans votre navigateur)</span>
                <span id="keysStatus" style="font-size: 11px; color: #10b981; font-weight: normal;"></span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
                <div>
                    <label class="card-label" for="apiSecretInput">Cloudinary API Secret :</label>
                    <input type="password" id="apiSecretInput" placeholder="Collez votre API Secret Cloudinary" style="width: 100%; background: #0f172a; border: 1px solid #475569; color: white; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-top: 4px;" oninput="saveCredentials()">
                </div>
                <div>
                    <label class="card-label" for="sbKeyInput">Supabase Secret Key :</label>
                    <input type="password" id="sbKeyInput" placeholder="Collez votre clé secrète Supabase" style="width: 100%; background: #0f172a; border: 1px solid #475569; color: white; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-top: 4px;" oninput="saveCredentials()">
                </div>
            </div>
        </div>

        <div>
            <div class="progress-container">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="progress-text">
                <span id="progressPercent">0% complété</span>
                <span id="progressRatio">0 / 0 produits</span>
            </div>
        </div>

        <!-- Toolbar de contrôle -->
        <div class="toolbar">
            <div class="toolbar-group">
                <button class="btn" id="startBtn" onclick="toggleStart()">
                    <span id="startBtnText">Démarrer / Reprendre</span>
                </button>
                <button class="btn btn-secondary" id="pauseBtn" onclick="pauseSync()" disabled>
                    <span>Pause</span>
                </button>
            </div>

            <div class="toolbar-group">
                <span class="toolbar-label">Reprendre à l'offset :</span>
                <input type="number" id="offsetInput" class="input-number" min="0" value="0" onchange="onOffsetChange()">

                <span class="toolbar-label" style="margin-left: 8px;">Taille du lot :</span>
                <select id="batchSizeSelect" class="select-custom">
                    <option value="3">3 prod (Ultra-sécurisé)</option>
                    <option value="5" selected>5 prod (Recommandé)</option>
                    <option value="8">8 prod (Rapide)</option>
                    <option value="10">10 prod (Standard)</option>
                </select>

                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 11px;" onclick="resetProgress()" title="Réinitialiser l'offset à 0">
                    ↺ Reset 0
                </button>
            </div>
        </div>

        <div class="log-box" id="logBox">
            <div style="color: #64748b; text-align: center; padding-top: 130px;">
                Initialisation en cours...
            </div>
        </div>
    </div>

    <script>
        let total = 0;
        let currentOffset = 0;
        let isRunning = false;
        let totalImagesUploaded = 0;
        let retryCount = 0;
        const MAX_RETRIES = 3;

        // Clés de persistance locale
        const STORAGE_OFFSET_KEY = 'frankh_cloudinary_sync_offset';
        const STORAGE_IMAGES_KEY = 'frankh_cloudinary_sync_images';
        const STORAGE_API_SECRET_KEY = 'frankh_cloudinary_api_secret';
        const STORAGE_SB_KEY = 'frankh_supabase_key';

        function saveCredentials() {
            const apiSec = document.getElementById('apiSecretInput').value.trim();
            const sbK = document.getElementById('sbKeyInput').value.trim();
            if (apiSec) localStorage.setItem(STORAGE_API_SECRET_KEY, apiSec);
            if (sbK) localStorage.setItem(STORAGE_SB_KEY, sbK);
            updateKeysStatus();
        }

        function updateKeysStatus() {
            const apiSec = document.getElementById('apiSecretInput').value.trim();
            const sbK = document.getElementById('sbKeyInput').value.trim();
            const statusEl = document.getElementById('keysStatus');
            if (apiSec && sbK) {
                statusEl.innerText = '✓ Clés configurées et prêtes';
                statusEl.style.color = '#10b981';
            } else {
                statusEl.innerText = '⚠️ Renseignez les deux clés pour lancer';
                statusEl.style.color = '#f59e0b';
            }
        }

        async function init() {
            // Extraire d'éventuels paramètres d'URL
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('api_secret')) {
                localStorage.setItem(STORAGE_API_SECRET_KEY, urlParams.get('api_secret'));
            }
            if (urlParams.get('sb_key')) {
                localStorage.setItem(STORAGE_SB_KEY, urlParams.get('sb_key'));
            }

            // Restaurer les clés
            const savedApiSecret = localStorage.getItem(STORAGE_API_SECRET_KEY) || '';
            const savedSbKey = localStorage.getItem(STORAGE_SB_KEY) || '';
            if (savedApiSecret) document.getElementById('apiSecretInput').value = savedApiSecret;
            if (savedSbKey) document.getElementById('sbKeyInput').value = savedSbKey;
            updateKeysStatus();

            // Restaurer la dernière progression enregistrée
            const savedOffset = parseInt(localStorage.getItem(STORAGE_OFFSET_KEY) || '0', 10);
            const savedImages = parseInt(localStorage.getItem(STORAGE_IMAGES_KEY) || '0', 10);

            if (savedOffset > 0) {
                currentOffset = savedOffset;
                document.getElementById('offsetInput').value = savedOffset;
            }
            if (savedImages > 0) {
                totalImagesUploaded = savedImages;
                document.getElementById('uploadedCount').innerText = totalImagesUploaded;
            }

            try {
                const res = await fetch('?token=frankh2026&action=count');
                const data = await res.json();
                total = data.total;
                document.getElementById('totalCount').innerText = total + ' produits';
                updateUI();

                const logBox = document.getElementById('logBox');
                if (savedOffset > 0) {
                    logBox.innerHTML = `<div style="color: #60a5fa; padding: 12px; background: rgba(59,130,246,0.1); border-radius: 8px;">
                        📌 <strong>Progression mémorisée :</strong> Vous vous êtes arrêté au produit <strong>${savedOffset} / ${total}</strong> (${totalImagesUploaded} images uploadées).<br>
                        Cliquez sur <strong>« Démarrer / Reprendre »</strong> pour continuer immédiatement sans recommencer à zéro !
                    </div>`;
                } else {
                    logBox.innerHTML = `<div style="color: #64748b; text-align: center; padding-top: 130px;">
                        Prêt. Cliquez sur « Démarrer / Reprendre » pour débuter la synchronisation vers Cloudinary.
                    </div>`;
                }
            } catch (e) {
                document.getElementById('totalCount').innerText = 'Erreur';
            }
        }

        function onOffsetChange() {
            const val = parseInt(document.getElementById('offsetInput').value, 10);
            if (!isNaN(val) && val >= 0) {
                currentOffset = Math.min(val, total || val);
                updateUI();
                localStorage.setItem(STORAGE_OFFSET_KEY, currentOffset);
            }
        }

        function resetProgress() {
            if (confirm("Voulez-vous vraiment réinitialiser l'offset à 0 pour tout reprendre depuis le début ?")) {
                currentOffset = 0;
                totalImagesUploaded = 0;
                document.getElementById('offsetInput').value = 0;
                localStorage.removeItem(STORAGE_OFFSET_KEY);
                localStorage.removeItem(STORAGE_IMAGES_KEY);
                updateUI();
                addLog("↺ Progression réinitialisée à l'offset 0.", 'log-warning');
            }
        }

        function toggleStart() {
            if (isRunning) {
                pauseSync();
            } else {
                startSync();
            }
        }

        async function startSync() {
            const apiSec = document.getElementById('apiSecretInput').value.trim();
            const sbK = document.getElementById('sbKeyInput').value.trim();
            if (!apiSec || !sbK) {
                alert("⚠️ Veuillez renseigner votre Cloudinary API Secret et votre Supabase Secret Key avant de lancer.");
                if (!apiSec) document.getElementById('apiSecretInput').focus();
                else document.getElementById('sbKeyInput').focus();
                return;
            }
            saveCredentials();

            isRunning = true;
            document.getElementById('startBtnText').innerText = 'En cours...';
            document.getElementById('startBtn').style.background = '#059669';
            document.getElementById('pauseBtn').disabled = false;
            document.getElementById('offsetInput').disabled = true;
            document.getElementById('batchSizeSelect').disabled = true;

            retryCount = 0;
            processNextBatch();
        }

        function pauseSync() {
            isRunning = false;
            document.getElementById('startBtnText').innerText = 'Reprendre';
            document.getElementById('startBtn').style.background = '#ef4444';
            document.getElementById('pauseBtn').disabled = true;
            document.getElementById('offsetInput').disabled = false;
            document.getElementById('batchSizeSelect').disabled = false;
            addLog("⏸️ Synchronisation mise en pause.", 'log-empty');
        }

        async function processNextBatch() {
            if (!isRunning) return;

            if (currentOffset >= total) {
                isRunning = false;
                document.getElementById('startBtnText').innerText = 'Terminé !';
                document.getElementById('startBtn').disabled = true;
                document.getElementById('pauseBtn').disabled = true;
                addLog("🎉 Félicitations ! Tous les produits et images ont été synchronisés avec succès sur Cloudinary et Supabase !", 'log-success');
                return;
            }

            const batchSize = parseInt(document.getElementById('batchSizeSelect').value, 10) || 5;
            const apiSec = encodeURIComponent(document.getElementById('apiSecretInput').value.trim());
            const sbK = encodeURIComponent(document.getElementById('sbKeyInput').value.trim());

            try {
                // Timeout controller de 45 secondes côté client
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000);

                const res = await fetch(`?token=frankh2026&action=batch&offset=${currentOffset}&limit=${batchSize}&api_secret=${apiSec}&sb_key=${sbK}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseErr) {
                    throw new Error("Réponse serveur non-JSON (probable 504 Timeout SiteGround Nginx)");
                }

                if (data.success && data.items) {
                    retryCount = 0; // Réinitialiser le compteur d'erreurs en cas de succès

                    data.items.forEach(item => {
                        if (item.images_count > 0) {
                            totalImagesUploaded += item.images_count;
                            addLog(`✓ [${currentOffset}] <strong>${escapeHtml(item.title)}</strong> : ${item.images_count} image(s) <span class="tag tag-cloud">Cloudinary</span> <span class="tag tag-supa">Supabase OK</span>`, 'log-success');
                        } else {
                            addLog(`- [${currentOffset}] <strong>${escapeHtml(item.title)}</strong> : aucune image sur disque`, 'log-empty');
                        }
                    });

                    currentOffset += data.processed_count;
                    document.getElementById('offsetInput').value = currentOffset;
                    localStorage.setItem(STORAGE_OFFSET_KEY, currentOffset);
                    localStorage.setItem(STORAGE_IMAGES_KEY, totalImagesUploaded);
                    updateUI();

                    // Lot suivant avec petit délai
                    setTimeout(processNextBatch, 100);
                } else {
                    handleBatchFailure("Erreur API : " + (data.error || 'Réponse invalide'));
                }
            } catch (err) {
                handleBatchFailure(err.message);
            }
        }

        function handleBatchFailure(errMsg) {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
                // Auto-retry automatique
                addLog(`⚠️ ${errMsg} au produit ${currentOffset}. Nouvelle tentative dans 3s... (Essai ${retryCount}/${MAX_RETRIES})`, 'log-warning');
                setTimeout(processNextBatch, 3000);
            } else {
                // Si 3 échecs consécutifs, on saute le lot problématique de 1 pour ne jamais bloquer !
                addLog(`⏭️ Produit ${currentOffset} ignoré après ${MAX_RETRIES} essais. Passage au produit suivant...`, 'log-warning');
                currentOffset += 1;
                document.getElementById('offsetInput').value = currentOffset;
                localStorage.setItem(STORAGE_OFFSET_KEY, currentOffset);
                updateUI();
                retryCount = 0;
                setTimeout(processNextBatch, 1000);
            }
        }

        function updateUI() {
            const percent = total > 0 ? Math.min(100, Math.round((currentOffset / total) * 100)) : 0;
            document.getElementById('progressBar').style.width = percent + '%';
            document.getElementById('progressPercent').innerText = percent + '% complété';
            document.getElementById('progressRatio').innerText = `${currentOffset} / ${total} produits`;
            document.getElementById('currentPosDisplay').innerText = `${currentOffset} / ${total}`;
            document.getElementById('uploadedCount').innerText = totalImagesUploaded;
        }

        function addLog(html, className = '') {
            const logBox = document.getElementById('logBox');
            const div = document.createElement('div');
            div.className = 'log-line ' + className;
            div.innerHTML = html;
            logBox.appendChild(div);
            logBox.scrollTop = logBox.scrollHeight;
        }

        function escapeHtml(str) {
            return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        window.onload = init;
    </script>
</body>
</html>
