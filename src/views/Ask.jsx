import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const STORAGE_KEY = 'ft_ask_messages_v1';

const SUGGESTIONS = [
  'Best foods to break a long Zone 2 plateau?',
  'How much protein per meal for muscle protein synthesis?',
  'Is creatine still effective if I skip a day?',
  'Sleep tips for someone who lifts late at night?',
];

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

export default function Ask() {
  const [input, setInput] = useState('');
  const [initial] = useState(loadMessages);

  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ask' }),
    messages: initial,
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  const submit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || status === 'streaming' || status === 'submitted') return;
    sendMessage({ text });
    setInput('');
  };

  const sendSuggestion = (text) => {
    if (status === 'streaming' || status === 'submitted') return;
    sendMessage({ text });
  };

  const clear = () => {
    setMessages([]);
    saveMessages([]);
  };

  const isBusy = status === 'streaming' || status === 'submitted';

  return (
    <div className="space-y-3">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Ask</h2>
          {messages.length > 0 && (
            <button
              onClick={clear}
              className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-rose-500 transition"
            >
              Clear chat
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Powered by Claude. Not medical advice — consult a professional for personal health decisions.
        </p>
      </section>

      {messages.length === 0 && (
        <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Try asking
          </p>
          <ul className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  onClick={() => sendSuggestion(s)}
                  disabled={isBusy}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {messages.length > 0 && (
        <section className="space-y-3">
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
          {isBusy && messages[messages.length - 1]?.role === 'user' && (
            <Bubble
              message={{
                id: 'pending',
                role: 'assistant',
                parts: [{ type: 'text', text: '…' }],
              }}
            />
          )}
          <div ref={scrollRef} />
        </section>
      )}

      {error && (
        <section className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300">
          <p className="font-medium">Couldn't reach the model.</p>
          <p className="text-xs mt-1 opacity-80">{String(error.message || error)}</p>
          <p className="text-xs mt-2">
            If this mentions AI Gateway or auth, enable AI Gateway in your Vercel project settings, then try again.
          </p>
        </section>
      )}

      <form onSubmit={submit} className="sticky bottom-0">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask anything about health, nutrition, training…"
            className="flex-1 resize-none bg-transparent outline-none text-sm px-2 py-2 max-h-32 min-h-[2.5rem]"
            style={{ fieldSizing: 'content' }}
          />
          {isBusy ? (
            <button
              type="button"
              onClick={stop}
              className="shrink-0 size-10 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center active:scale-95 transition"
              aria-label="Stop"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect width="14" height="14" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="shrink-0 size-10 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l14-7-7 14-2-5-5-2z" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Bubble({ message }) {
  const isUser = message.role === 'user';
  const text = (message.parts || [])
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join('');

  return (
    <div className={'flex ' + (isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ' +
          (isUser
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-sm')
        }
      >
        {text || (isUser ? '' : <span className="text-neutral-400">…</span>)}
      </div>
    </div>
  );
}
