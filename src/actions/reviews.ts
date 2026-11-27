'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, updateTag } from 'next/cache';
import { requireAuth, requireAdmin } from '@/lib/auth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// --- Client Actions ---

export async function submitReview(productId: string, rating: number, comment: string) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return { error: "You must be logged in to leave a review." };
  }

  if (!productId || !UUID_REGEX.test(productId)) {
    return { error: "Identifiant de produit invalide." };
  }

  const intRating = Number(rating);
  if (!Number.isInteger(intRating) || intRating < 1 || intRating > 5) {
    return { error: "La note doit être un entier entre 1 et 5." };
  }

  const cleanComment = String(comment || '').trim();
  if (cleanComment.length < 3 || cleanComment.length > 2000) {
    return { error: "A sua avaliação deve conter entre 3 e 2000 carateres." };
  }

  // Check product existence
  const product = await prisma.product.findUnique({
    where: { id: productId, isDeleted: false },
    select: { id: true, slug: true },
  });
  if (!product) {
    return { error: "Artigo não encontrado." };
  }

  // Prevent spamming multiple reviews on the same product within 1 hour
  const recentReview = await prisma.review.findFirst({
    where: {
      productId,
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 3600_000) },
    },
  });
  if (recentReview) {
    return { error: "Já submeteu uma avaliação recente para este artigo." };
  }

  try {
    const reviewerName = user.email ? user.email.split('@')[0] : 'Cliente';

    await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        reviewerName,
        rating: intRating,
        comment: cleanComment,
        isApproved: false // Requires admin moderation by default
      }
    });

    revalidatePath(`/admin/reviews`);
    revalidatePath(`/produkt/[slug]`, 'page');
    revalidatePath(`/product/[slug]`, 'page');
    revalidatePath(`/account/reviews`);
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar avaliação:", error);
    return { error: "Ocorreu um erro ao registar a sua avaliação." };
  }
}

// --- Admin Actions ---

export async function toggleReviewApproval(reviewId: string, isApproved: boolean) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return { error: "ID invalide." };

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: Boolean(isApproved) },
    select: {
      id: true,
      isApproved: true,
      product: { select: { slug: true } }
    }
  });

  updateTag('products');
  if (review?.product?.slug) {
    updateTag(`product-${review.product.slug.toLowerCase()}`);
    revalidatePath(`/produkt/${review.product.slug}`, 'page');
    revalidatePath(`/product/${review.product.slug}`, 'page');
  }
  revalidatePath('/admin/reviews');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/product/[slug]`, 'page');

  return { success: true, isApproved: review.isApproved };
}

export async function updateReview(reviewId: string, rating: number, comment: string, createdAtStr: string) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return { error: "ID invalide." };

  const intRating = Math.min(Math.max(1, Math.round(Number(rating) || 5)), 5);

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { 
      rating: intRating, 
      comment: String(comment || '').trim().slice(0, 5000),
      createdAt: new Date(createdAtStr)
    },
    select: {
      id: true,
      product: { select: { slug: true } }
    }
  });

  updateTag('products');
  if (review?.product?.slug) {
    updateTag(`product-${review.product.slug.toLowerCase()}`);
    revalidatePath(`/produkt/${review.product.slug}`, 'page');
    revalidatePath(`/product/${review.product.slug}`, 'page');
  }
  revalidatePath('/admin/reviews');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/product/[slug]`, 'page');

  return { success: true };
}

export async function deleteReview(reviewId: string) {
  await requireAdmin();
  if (!reviewId || !UUID_REGEX.test(reviewId)) return { error: "ID invalide." };

  const review = await prisma.review.delete({
    where: { id: reviewId },
    select: {
      id: true,
      product: { select: { slug: true } }
    }
  });

  updateTag('products');
  if (review?.product?.slug) {
    updateTag(`product-${review.product.slug.toLowerCase()}`);
    revalidatePath(`/produkt/${review.product.slug}`, 'page');
    revalidatePath(`/product/${review.product.slug}`, 'page');
  }
  revalidatePath('/admin/reviews');
  revalidatePath(`/produkt/[slug]`, 'page');
  revalidatePath(`/product/[slug]`, 'page');

  return { success: true };
}
