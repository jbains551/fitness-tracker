import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import App from './App.jsx';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Root() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-2">Sign-in not configured</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Install <span className="font-medium">Clerk</span> from the Vercel Marketplace and connect it to this project, then redeploy. The env var <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">CLERK_PUBLISHABLE_KEY</code> is needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: { colorPrimary: '#059669' },
      }}
    >
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <div className="min-h-full flex items-center justify-center p-4">
          <SignIn
            routing="hash"
            appearance={{
              elements: { rootBox: 'mx-auto', card: 'shadow-lg' },
            }}
          />
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
