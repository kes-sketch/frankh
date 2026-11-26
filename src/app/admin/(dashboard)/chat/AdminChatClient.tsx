'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  getAdminSessions,
  sendAdminMessage,
  closeSession,
  reopenSession,
  deleteSession,
  getAdminSessionMessages
} from '@/actions/chat';
import { ChatSender, ChatMessage } from '@prisma/client';
import { useTranslations, useLocale } from 'next-intl';

export default function AdminChatClient({ initialSessions }: { initialSessions: any[] }) {
  const t = useTranslations('AdminChat');
  const locale = useLocale();

  const [sessions, setSessions] = useState<any[]>(initialSessions || []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions && initialSessions.length > 0 ? initialSessions[0].id : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for sessions list (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const freshSessions = await getAdminSessions();
        setSessions(freshSessions);
      } catch (err) {
        console.error('Polling sessions failed', err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch and poll messages for the active session (every 3 seconds)
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const fetchMessages = async () => {
      try {
        const msgs = await getAdminSessionMessages(activeSessionId);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Failed to fetch session messages', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSessionId]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSessionId || isSending) return;

    const contentToSend = newMessage.trim();
    setIsSending(true);

    const tempMsg = {
      id: 'temp-' + Date.now(),
      sessionId: activeSessionId,
      sender: ChatSender.ADMIN,
      content: contentToSend,
      createdAt: new Date(),
    } as ChatMessage;

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');

    try {
      const savedMsg = await sendAdminMessage(activeSessionId, contentToSend);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? savedMsg : m)));
    } catch (err) {
      console.error('Failed to send admin message', err);
      // Remove temp message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      alert('Erreur lors de l\'envoi du message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!activeSessionId) return;
    if (confirm(t('confirm_close') || 'Möchten Sie diese Konversation wirklich schließen?')) {
      await closeSession(activeSessionId);
      const fresh = await getAdminSessions();
      setSessions(fresh);
    }
  };

  const handleReopen = async () => {
    if (!activeSessionId) return;
    await reopenSession(activeSessionId);
    const fresh = await getAdminSessions();
    setSessions(fresh);
  };

  const handleDelete = async () => {
    if (!activeSessionId) return;
    if (confirm('Möchten Sie diese Konversation und alle Nachrichten wirklich löschen?')) {
      await deleteSession(activeSessionId);
      const fresh = await getAdminSessions();
      setSessions(fresh);
      setActiveSessionId(fresh.length > 0 ? fresh[0].id : null);
    }
  };

  // Filter sessions by status and search query
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const name = (s.guestName || '').toLowerCase();
        const email = (s.guestEmail || '').toLowerCase();
        const lastMsg = (s.messages?.[0]?.content || '').toLowerCase();
        return name.includes(query) || email.includes(query) || lastMsg.includes(query);
      }
      return true;
    });
  }, [sessions, statusFilter, searchQuery]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const formatTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  };

  const counts = useMemo(() => {
    const open = sessions.filter((s) => s.status === 'OPEN').length;
    const closed = sessions.filter((s) => s.status === 'CLOSED').length;
    return { all: sessions.length, open, closed };
  }, [sessions]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex h-[calc(100vh-210px)] min-h-[620px]">
      {/* Sidebar: Sessions List */}
      <div className="w-80 sm:w-96 min-w-[280px] max-w-[360px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Header with Title and Search */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base">{t('active_conversations') || 'Konversationen'}</h2>
            <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-0.5 rounded-full">
              {counts.all}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 rounded-md font-medium transition ${statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Alle ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OPEN')}
              className={`flex-1 py-1 rounded-md font-medium transition flex items-center justify-center gap-1 ${statusFilter === 'OPEN' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Offen ({counts.open})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CLOSED')}
              className={`flex-1 py-1 rounded-md font-medium transition ${statusFilter === 'CLOSED' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Geschlossen ({counts.closed})
            </button>
          </div>
        </div>

        {/* Sessions Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredSessions.map((s) => {
            const isActive = activeSessionId === s.id;
            const displayName = s.guestName || `${t('guest') || 'Gast'} #${s.guestId?.substring(0, 6)}`;
            const lastMessage = s.messages?.[0]?.content;
            const lastTime = s.messages?.[0]?.createdAt || s.updatedAt;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-3.5 transition flex items-start gap-3 relative ${isActive
                    ? 'bg-orange-50/80 border-l-4 border-l-orange-600'
                    : 'hover:bg-gray-100/70 border-l-4 border-l-transparent bg-white'
                  }`}
              >
                {/* Guest Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isActive ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {lastTime ? formatTime(lastTime) : ''}
                    </span>
                  </div>

                  {s.guestEmail && (
                    <p className="text-xs text-orange-700 truncate mb-1">
                      {s.guestEmail}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {lastMessage || t('no_messages') || 'Keine Nachrichten'}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.status === 'OPEN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <svg className="w-10 h-10 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs font-medium">{t('no_conversations') || 'Keine Gespräche vorhanden.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {activeSession ? (
          <>
            {/* Chat Header Bar */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center flex-shrink-0">
                  {(activeSession.guestName || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base truncate">
                      {activeSession.guestName || `${t('guest') || 'Gast'} #${activeSession.guestId?.substring(0, 6)}`}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeSession.status === 'OPEN'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                      }`}>
                      {activeSession.status}
                    </span>
                  </div>
                  {activeSession.guestEmail && (
                    <a
                      href={`mailto:${activeSession.guestEmail}`}
                      className="text-xs text-orange-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {activeSession.guestEmail}
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {activeSession.status === 'OPEN' ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    {t('close_session') || 'Sitzung schließen'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReopen}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition"
                  >
                    Wiedereröffnen
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Konversation löschen"
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/70 flex flex-col gap-3">
              {messages.map((msg) => {
                const isAdmin = msg.sender === ChatSender.ADMIN;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-full`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-gray-400">
                      <span>{isAdmin ? 'Support' : (activeSession.guestName || t('guest') || 'Gast')}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm shadow-xs leading-relaxed break-words whitespace-pre-wrap ${isAdmin
                          ? 'bg-orange-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 bg-white border-t border-gray-200">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('write_reply') || 'Schreibe eine Antwort...'}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold transition shadow-xs"
                >
                  {t('send') || 'Senden'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{t('select_conversation') || 'Wählen Sie eine Konversation aus'}</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Wählen Sie links ein Gespräch aus, um mit dem Kunden zu interagieren und Nachrichten in Echtzeit zu beantworten.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
