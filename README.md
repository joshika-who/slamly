# Slamly — A Personal Digital Slam Book Platform

> **Tagline:** *Every friend. Every memory. One little book.*

Slamly brings the nostalgic school and college slam book tradition into a warm, modern, multi-user digital platform. Every user can create personal slam books from ready-made templates or from scratch, customise questions and pastel scrapbook themes, share a unique link with friends (no account required for friends to reply), and preserve memories forever.

---

## Milestone 1: Frontend Foundation

This repository currently implements **Milestone 1 (Frontend Foundation)**:
- Complete multi-page React + Vite + React Router v6 application.
- Nostalgic scrapbook UI system (washi tape accents, polaroid frames, paper-textured cards, custom SVG stickers, `Patrick Hand` + `DM Sans` typography).
- WCAG 2.1 AA accessible colour contrast, semantic HTML, keyboard focus indicators, 44×44px minimum touch targets, and `prefers-reduced-motion` support.
- Responsive across mobile (`375px`), tablet (`768px`), and desktop (`1280px+`).
- Configured with `vercel.json` for single-page application (SPA) routing on Vercel.

---

## Routes Included in Milestone 1

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `src/pages/Home.jsx` | Landing page with interactive 2-page scrapbook mockup, 3-step How It Works, 6 Features, and Closing CTA |
| `/login` | `src/pages/Login.jsx` | Login form with client-side validation, Remember me, Forgot password notice, and preview redirect |
| `/signup` | `src/pages/Signup.jsx` | Signup form with client-side validation and preview redirect to `/dashboard` |
| `/dashboard` | `src/pages/Dashboard.jsx` | Personal slam book shelf with `"Preview mode: no real account created"` banner, `BookCard` grid, empty state toggle, and sample memories modal |
| `/create` | `src/pages/CreateBook.jsx` | Choose from 5 templates (`Friendship`, `College memories`, `School farewell`, `Birthday`, `Get to know me`) or start from scratch |
| `/create/template/:id` | `src/pages/TemplateBuilderPreview.jsx` | Interactive template question customiser & live friend-view preview |
| `/create/blank` | `src/pages/BlankBuilderPreview.jsx` | Interactive blank slam book builder studio & live preview |
| `*` | `src/pages/NotFound.jsx` | Friendly scrapbook-themed 404 page |

---

## Getting Started Locally

```bash
# 1. Navigate into the project directory
cd slamly

# 2. Install dependencies
npm install

# 3. Start the local Vite development server
npm run dev

# 4. Build for production
npm run build
```

