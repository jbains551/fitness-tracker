import { useEffect, useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useStore, useTheme } from './lib/store.js';
import { useSync } from './lib/sync.js';
import Dashboard from './views/Dashboard.jsx';
import FoodLogger from './views/FoodLogger.jsx';
import Workout from './views/Workout.jsx';
import Weekly from './views/Weekly.jsx';
import Body from './views/Body.jsx';
import Ask from './views/Ask.jsx';

const TABS = [
  { id: 'dashboard', label: 'Today', icon: HomeIcon },
  { id: 'food', label: 'Food', icon: ForkIcon },
  { id: 'workout', label: 'Workout', icon: DumbbellIcon },
  { id: 'body', label: 'Body', icon: ScaleIcon },
  { id: 'week', label: 'Week', icon: CalendarIcon },
  { id: 'ask', label: 'Ask', icon: AskIcon },
];

export default function App() {
  const store = useStore();
  const { theme, toggle } = useTheme();
  const sync = useSync({ store });
  // Home-screen shortcuts deep-link via ?open=… (e.g. the "Log meal from photo"
  // shortcut opens the Food view with the Photo tab pre-selected).
  const [tab, setTab] = useState(() => (readOpenParam() === 'photo' ? 'food' : 'dashboard'));
  const [foodInitialTab, setFoodInitialTab] = useState(() =>
    readOpenParam() === 'photo' ? 'photo' : null
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Consume the deep-link once: strip the query param so a refresh or manual
  // navigation back to Food starts on the default tab, not Photo.
  useEffect(() => {
    if (foodInitialTab) {
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch {}
      setFoodInitialTab(null);
    }
  }, [foodInitialTab]);

  return (
    <div className="min-h-full flex flex-col max-w-xl mx-auto">
      <header className="sticky top-0 z-10 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Health Tracker</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncDot status={sync.status} />
            <button
              onClick={toggle}
              className="size-10 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { userButtonAvatarBox: 'size-8' },
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-32">
        {tab === 'dashboard' && <Dashboard store={store} now={now} />}
        {tab === 'food' && <FoodLogger store={store} now={now} initialTab={foodInitialTab} />}
        {tab === 'workout' && <Workout store={store} now={now} />}
        {tab === 'body' && <Body store={store} now={now} />}
        {tab === 'week' && <Weekly store={store} now={now} />}
        {tab === 'ask' && <Ask />}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-20 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-xl mx-auto grid grid-cols-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  'flex flex-col items-center justify-center gap-1 py-2.5 active:scale-95 transition ' +
                  (active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-500 dark:text-neutral-400')
                }
              >
                <Icon active={active} />
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function readOpenParam() {
  try {
    return new URLSearchParams(window.location.search).get('open');
  } catch {
    return null;
  }
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function ForkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v8a3 3 0 003 3v9" />
      <path d="M11 2v8" />
      <path d="M7 2v8" />
      <path d="M17 2c-2 0-3 2-3 5s1 5 3 5v9" />
    </svg>
  );
}
function DumbbellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7v10" />
      <path d="M3 9v6" />
      <path d="M18 7v10" />
      <path d="M21 9v6" />
      <path d="M6 12h12" />
    </svg>
  );
}
function ScaleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 8h8" />
      <circle cx="12" cy="14" r="3" />
      <path d="M12 12v2l1.5 1" />
    </svg>
  );
}
function AskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 11-3.5-6.6L21 4l-1 4 1 1-1.5 1.5A8 8 0 0121 12z" />
      <path d="M9 10a3 3 0 116 0c0 2-3 2-3 4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}
function SyncDot({ status }) {
  const map = {
    ok: 'bg-emerald-500',
    syncing: 'bg-amber-500 animate-pulse',
    error: 'bg-rose-500',
    idle: 'bg-neutral-300 dark:bg-neutral-600',
  };
  const label = status === 'syncing' ? 'Syncing' : status === 'error' ? 'Sync error' : status === 'ok' ? 'Synced' : 'Idle';
  return <span className={`size-2 rounded-full ${map[status || 'idle']}`} title={label} />;
}
function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  );
}
