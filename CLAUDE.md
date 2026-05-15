# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint (flat config, ESLint 9+)
```

No test suite is configured.

## Architecture

**React 19 + Vite 7 + Tailwind CSS v4** single-page app. The entire application lives in `src/App.jsx` (~760 lines) — all step components, business logic, and UI primitives are defined there. There is no routing library; navigation is handled by a `step` integer state.

### Step flow

1. Welcome banner (CTA button)
2. Name + WhatsApp form — validated with React Hook Form
3. Age range selection (radio)
4. Emoji satisfaction rating
5. Optional text feedback
6. Scratch-card game → prize reveal → Google Sheets submission

### Data persistence

Customer data is POSTed to a Google Apps Script webhook. The call uses `mode: 'no-cors'`, so there is no response body — failures are silently swallowed. Payload: `{ name, whatsapp, generation, rating, feedback, reward, timestamp }`.

### Scratch card (ScratchCard component)

HTML5 Canvas with `destination-out` composite operation to erase the overlay. Scales for device pixel ratio. Tracks transparent pixel percentage (sampled every 50px) to fire an `onComplete` callback when ≥ 60% is revealed. Supports both mouse and touch events.

### Reward system

`REWARDS` array in `App.jsx` defines 6 prizes plus a no-prize option. Each entry has a `probability` weight; selection uses cumulative weighted random draw. Current weights: 4% each for prizes, 80% no-prize.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed). Primary palette: yellow `#ffcc00` accent, near-black `#010006`. Mobile-first layout with `max-w-md` container. Confetti animation defined as a CSS keyframe in `index.css`.

### React Compiler

`@babel/plugin-react-compiler` is active via `vite.config.js`. Avoid manual `useMemo`/`useCallback` — the compiler handles memoization automatically.
