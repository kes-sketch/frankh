'use client';

import { useState } from 'react';
import { submitContactMessage } from '@/actions/contact';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus('loading');
    setFeedback('');

    const formData = new FormData(form);
    const res = await submitContactMessage(formData);

    if (res.error) {
      setStatus('error');
      setFeedback(res.error);
    } else if (res.success) {
      setStatus('success');
      setFeedback(res.message || 'Ihre Nachricht wurde erfolgreich gesendet!');
      form.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === 'success' && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-semibold">Vielen Dank für Ihre Nachricht!</p>
            <p className="text-emerald-700 mt-0.5">{feedback}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p>{feedback}</p>
        </div>
      )}

      {/* Field 1: Name */}
      <div>
        <label htmlFor="contact-name" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
          Ihr vollständiger Name <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          name="name"
          required
          autoComplete="name"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
        />
      </div>

      {/* Field 2: Email */}
      <div>
        <label htmlFor="contact-email" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
          Ihre E-Mail-Adresse <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
        />
      </div>

      {/* Field 3: Subject */}
      <div>
        <label htmlFor="contact-subject" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
          Betreff der Nachricht <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          name="subject"
          required
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
        />
      </div>

      {/* Field 4: Message */}
      <div>
        <label htmlFor="contact-message" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5">
          Ihre Nachricht <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition resize-y"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-[#18181b] hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase py-3.5 px-8 rounded transition duration-200 disabled:opacity-60 cursor-pointer"
        >
          {status === 'loading' ? 'WIRD GESENDET...' : 'NACHRICHT SENDEN'}
        </button>
      </div>
    </form>
  );
}
