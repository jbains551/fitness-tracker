# Fitness Tracker

A mobile-first fitness and nutrition tracking web app. All data is stored locally in your browser — no backend, no account.

## Features
- **Daily Dashboard** with day-of-week-aware macro targets (training / rest / optional days) and live progress bars
- **Food Logger** with quick-add common meals, custom entries, and per-meal grouping
- **Workout Log** for type, duration, perceived effort, and notes — plus the last 7 days
- **Body Tracking** for weight / body fat / water / visceral fat from your Withings scale, with per-metric goals and a 30-day actual-vs-goal trend chart
- **Weekly Summary** with protein-hit / workout completion at a glance and a protein streak counter
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
