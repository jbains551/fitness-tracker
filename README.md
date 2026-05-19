# Fitness Tracker

A mobile-first fitness and nutrition tracking web app. All data is stored locally in your browser — no backend, no account.

## Features
- **Daily Dashboard** with day-of-week-aware macro targets (training / rest / optional days) and live progress bars
- **Food Logger** with quick-add common meals, custom entries, and per-meal grouping
- **Supplement Checklist** that resets at midnight and hides pre-workout supps on rest days
- **Workout Log** for type, duration, perceived effort, and notes — plus the last 7 days
- **Weekly Summary** with protein-hit / workout / supplement-completion at a glance and a protein streak counter
- **Dark mode**, bottom nav, one-handed mobile layout

## Stack
- Vite + React 19
- Tailwind CSS v4
- `localStorage` for persistence

## Develop
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Outputs to `dist/`. Serve it with any static host (nginx, Vercel, Netlify, S3+CloudFront, etc.).
