import { useEffect, useState } from 'react';
import { generateToken, isValidToken } from '../lib/sync.js';

export default function SettingsSheet({ open, onClose, sync }) {
  const [pasteValue, setPasteValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!open) {
      setPasteValue('');
      setCopied(false);
      setEditing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  if (!open) return null;

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(sync.token);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = sync.token;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); } catch {}
      document.body.removeChild(ta);
    }
  };

  const applyPaste = () => {
    const next = pasteValue.trim();
    if (!isValidToken(next)) return;
    sync.setToken(next);
    setPasteValue('');
    setEditing(false);
  };

  const newToken = () => {
    sync.setToken(generateToken());
    setEditing(false);
  };

  const disconnect = () => {
    if (!confirm('Disconnect sync? Your data stays on this device but stops syncing.')) return;
    sync.setToken('');
    setEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl border-t sm:border border-neutral-200 dark:border-neutral-800"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="font-semibold">Sync</h2>
          <button
            onClick={onClose}
            className="size-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-4 pb-2">
          <SyncBadge sync={sync} />
        </div>

        {sync.token ? (
          <div className="px-4 py-3 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">Your sync token</p>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={sync.token}
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs select-all"
                />
                <button
                  onClick={copyToken}
                  className="px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium active:scale-95 transition"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5">
                Paste this on another device's Settings → Sync to share your data. Anyone with this token can read and write your data.
              </p>
            </div>

            {editing ? (
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Replace with another token</p>
                <input
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="Paste token from another device"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={applyPaste}
                    disabled={!isValidToken(pasteValue.trim())}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition"
                  >
                    Use this token
                  </button>
                  <button
                    onClick={() => { setEditing(false); setPasteValue(''); }}
                    className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  This replaces all data on this device with the data attached to that token.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                  Use another token
                </button>
                <button onClick={newToken} className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                  Generate new
                </button>
                <button onClick={disconnect} className="text-xs px-3 py-1.5 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Sync isn't set up. Generate a new token here (and paste it into another device), or paste a token from another device to pull its data.
            </p>
            <button
              onClick={newToken}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition active:scale-[0.99]"
            >
              Generate sync token
            </button>
            <div className="text-center text-xs text-neutral-400 dark:text-neutral-500">or</div>
            <div className="space-y-2">
              <input
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="Paste token from another device"
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs"
              />
              <button
                onClick={applyPaste}
                disabled={!isValidToken(pasteValue.trim())}
                className="w-full py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 text-sm font-medium"
              >
                Use this token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SyncStatusDot({ status }) {
  const cls = {
    ok: 'bg-emerald-500',
    syncing: 'bg-amber-500 animate-pulse',
    error: 'bg-rose-500',
    idle: 'bg-neutral-300 dark:bg-neutral-600',
  }[status || 'idle'];
  return <span className={`size-2 rounded-full ${cls}`} />;
}

function SyncBadge({ sync }) {
  let label;
  if (!sync.token) label = 'Not set up';
  else if (sync.status === 'syncing') label = 'Syncing…';
  else if (sync.status === 'error') label = `Error: ${sync.error || 'unknown'}`;
  else if (sync.status === 'ok' && sync.lastSyncedAt)
    label = `Synced ${relativeTime(sync.lastSyncedAt)}`;
  else label = 'Waiting…';

  return (
    <div className="flex items-center gap-2 text-xs">
      <SyncStatusDot status={sync.status} />
      <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
    </div>
  );
}

function relativeTime(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
