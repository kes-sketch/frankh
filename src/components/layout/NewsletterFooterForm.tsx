'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitNewsletter } from '@/actions/contact';

interface Props {
  placeholder?: string;
}

export default function NewsletterFooterForm({ placeholder = 'E-Mail-Adresse' }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('email', email);

    startTransition(async () => {
      const res = await submitNewsletter(formData);
      if (res.error) {
        setError(res.error);
      } else {
        router.push('/thank-you');
      }
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          disabled={isPending}
          className="flex-grow min-w-0 px-3.5 py-2.5 rounded-md bg-white border border-gray-200 text-gray-900 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:opacity-60 transition"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#18181b] hover:bg-black text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-md transition whitespace-nowrap disabled:opacity-60 cursor-pointer shrink-0"
        >
          {isPending ? '...' : 'Abonnieren'}
        </button>
      </form>
      {error && (
        <p className="text-red-600 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
