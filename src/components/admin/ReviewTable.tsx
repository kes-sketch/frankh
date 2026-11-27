'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toggleReviewApproval, deleteReview, updateReview } from '@/actions/reviews';
import { useTranslations, useLocale } from 'next-intl';

type Review = {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  product: { title: string; slug: string };
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  user?: { email: string } | null;
};

export default function ReviewTable({ reviews }: { reviews: Review[] }) {
  const t = useTranslations('AdminReviews');
  const locale = useLocale();
  const router = useRouter();

  const [reviewsList, setReviewsList] = useState<Review[]>(reviews);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '', createdAtStr: '' });

  useEffect(() => {
    setReviewsList(reviews);
  }, [reviews]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setReviewsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isApproved: nextStatus } : r))
    );

    try {
      const res = await toggleReviewApproval(id, nextStatus);
      if (res && 'error' in res) {
        alert(res.error);
        // Rollback
        setReviewsList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: currentStatus } : r))
        );
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setReviewsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: currentStatus } : r))
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;

    setLoadingId(id);
    const previousReviews = [...reviewsList];
    setReviewsList((prev) => prev.filter((r) => r.id !== id));

    try {
      const res = await deleteReview(id);
      if (res && 'error' in res) {
        alert(res.error);
        setReviewsList(previousReviews);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setReviewsList(previousReviews);
    } finally {
      setLoadingId(null);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({
      rating: review.rating,
      comment: review.comment,
      createdAtStr: new Date(review.createdAt).toISOString().slice(0, 16),
    });
  };

  const handleSave = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await updateReview(id, editForm.rating, editForm.comment, editForm.createdAtStr);
      if (res && 'error' in res) {
        alert(res.error);
      } else {
        setReviewsList((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  rating: editForm.rating,
                  comment: editForm.comment,
                  createdAt: new Date(editForm.createdAtStr),
                }
              : r
          )
        );
        setEditingId(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 font-semibold">{t('col_product')}</th>
            <th className="px-6 py-3 font-semibold">{t('col_customer')}</th>
            <th className="px-6 py-3 font-semibold">{t('col_rating_comment')}</th>
            <th className="px-6 py-3 font-semibold">{t('col_date')}</th>
            <th className="px-6 py-3 font-semibold">{t('col_status')}</th>
            <th className="px-6 py-3 font-semibold text-right">{t('col_actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reviewsList.map((review) => {
            const isLoading = loadingId === review.id;
            const isEditing = editingId === review.id;

            return (
              <tr key={review.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                {/* 1. PRODUKT */}
                <td className="px-6 py-4 font-medium text-gray-900 max-w-[220px]">
                  <a
                    href={`/produkt/${review.product.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-gray-900 hover:text-orange-600 transition group"
                    title={review.product.title}
                  >
                    <span className="truncate max-w-[190px]">{review.product.title}</span>
                    <svg
                      className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-600 flex-shrink-0 transition"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </td>

                {/* 2. KUNDE */}
                <td className="px-6 py-4 text-gray-600">
                  <div className="max-w-[200px] truncate" title={review.reviewerEmail || review.user?.email || review.reviewerName || 'Anonyme'}>
                    {review.reviewerEmail || review.user?.email || review.reviewerName || 'Anonyme'}
                  </div>
                </td>

                {/* 3. BEWERTUNG UND KOMMENTAR */}
                <td className="px-6 py-4 min-w-[280px]">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={editForm.rating}
                          onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-orange-600 flex items-center gap-1 mb-1">
                        <span>{review.rating}</span>
                        <svg className="w-4 h-4 fill-orange-500 text-orange-500" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="text-gray-700 line-clamp-2 leading-relaxed">{review.comment}</div>
                    </div>
                  )}
                </td>

                {/* 4. DATUM */}
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editForm.createdAtStr}
                      onChange={(e) => setEditForm({ ...editForm, createdAtStr: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                    />
                  ) : (
                    new Date(review.createdAt).toLocaleDateString(locale)
                  )}
                </td>

                {/* 5. STATUS */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggle(review.id, review.isApproved)}
                    disabled={isLoading}
                    title={review.isApproved ? t('unapprove') : t('approve')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      review.isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        review.isApproved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                    {review.isApproved ? t('approved') : t('pending')}
                  </button>
                </td>

                {/* 6. AKTIONEN */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        {/* Enregistrer (Check icon) */}
                        <button
                          type="button"
                          onClick={() => handleSave(review.id)}
                          disabled={isLoading}
                          title={t('save')}
                          aria-label={t('save')}
                          className="p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-50"
                        >
                          {isLoading ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Annuler (Cross icon) */}
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={isLoading}
                          title={t('cancel')}
                          aria-label={t('cancel')}
                          className="p-2 rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Approuver / Publier (ou retirer l'approbation) */}
                        <button
                          type="button"
                          onClick={() => handleToggle(review.id, review.isApproved)}
                          disabled={isLoading}
                          title={review.isApproved ? t('unapprove') : t('approve')}
                          aria-label={review.isApproved ? t('unapprove') : t('approve')}
                          className={`p-2 rounded-lg border transition disabled:opacity-50 ${
                            review.isApproved
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-amber-50 hover:text-amber-700 border-emerald-200 hover:border-amber-200'
                              : 'text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-sm'
                          }`}
                        >
                          {isLoading ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Modifier (Pencil icon) */}
                        <button
                          type="button"
                          onClick={() => startEdit(review)}
                          disabled={isLoading}
                          title={t('edit')}
                          aria-label={t('edit')}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>

                        {/* Supprimer (Trash icon) */}
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          disabled={isLoading}
                          title={t('delete')}
                          aria-label={t('delete')}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {reviewsList.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{t('no_reviews')}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
