import { notFound } from 'next/navigation';
import ShopPage from '@/app/shop/page';
import { SITE_URL } from '@/lib/site';
import { getCategoryByPathSegments, getCategoryCanonicalPath } from '@/lib/categories';
import { Metadata } from 'next';

export const revalidate = 300;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Frank Hausgeräte";

  if (!slug || slug.length === 0) {
    return { title: `Kategorie nicht gefunden - ${storeName}` };
  }

  const category = await getCategoryByPathSegments(slug);
  if (!category) {
    return { title: `Kategorie nicht gefunden - ${storeName}` };
  }

  const canonicalPath = await getCategoryCanonicalPath(category);

  return {
    title: category.metaTitle ? category.metaTitle : `${category.name} online kaufen | ${storeName}`,
    description: category.metaDescription || `Entdecken Sie erstklassige Produkte der Kategorie ${category.name} bei Frank Hausgeräte zu attraktiven Preisen und mit schneller Lieferung.`,
    keywords: category.metaKeywords || undefined,
    alternates: {
      canonical: `${SITE_URL}${canonicalPath}`,
    },
    openGraph: {
      title: category.metaTitle || `${category.name} | ${storeName}`,
      description: category.metaDescription || `Entdecken Sie ${category.name} bei Frank Hausgeräte mit 2 Jahren Garantie und schnellem Versand.`,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: storeName,
      type: 'website',
    }
  };
}

export default async function ProduktKategoriePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    notFound();
  }

  const category = await getCategoryByPathSegments(slug);
  if (!category) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const activeCategory = resolvedSearchParams.category !== undefined
    ? resolvedSearchParams.category
    : (category.slug || category.id);

  const newSearchParams = Promise.resolve({
    ...resolvedSearchParams,
    category: activeCategory
  });

  return <ShopPage searchParams={newSearchParams} />;
}
