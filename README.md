# Slamly — A Personal Digital Slam Book Platform

> **Tagline:** *Every friend. Every memory. One little book.*

Slamly brings the nostalgic school and college slam book tradition into a warm, modern, multi-user digital platform. Every user can create personal slam books from ready-made templates or from scratch, customise questions and pastel scrapbook themes, and preserve memories forever.

---

## Current Status: Milestone 5 (Response Management)

- **Milestone 1 (Complete):** Multi-page React + Vite + React Router v6 foundation, nostalgic scrapbook UI system, WCAG 2.1 AA accessibility, and responsive layouts.
- **Milestone 2 (Complete):** Real **Firebase Authentication (Email/Password)** with `AuthContext`, `ProtectedRoute`, `PublicOnlyRoute`, Signup, Login, Password Reset, and Logout.
- **Milestone 3 (Complete):** Real **Cloud Firestore (`books/{bookId}`)** integration with `src/firebase/firestore.js`, `src/services/bookService.js`, template & blank book creation, editing saved books (`/books/:bookId/edit`), deleting books with confirmation, and version-controlled `firestore.rules`.
- **Milestone 4 (Complete):** **Public Sharing & Friend Responses** at `/s/:bookId` with single-document public reads (`getPublicBookById`), `"draft"` / `"published"` / `"closed"` book lifecycle controls, copyable share links, friend response submissions (`books/{bookId}/responses/{responseId}` via `src/services/responseService.js`), batched response cleanup on book deletion, and updated `firestore.rules`.
- **Milestone 5 (Complete):** **Owner Response Management** at `/books/:bookId/responses` (`src/pages/BookResponses.jsx`) with paginated newest-first responses (`getBookResponses`), server response counts (`getResponseCount`), client-side search, inline response editing (`updateResponse` preserving `createdAt`), single-response deletion (`deleteResponse`), and lazy-loaded dashboard response counts.

---

## Routes

| Route | Access | Page Component | Description |
| :--- | :--- | :--- | :--- |
| `/` | Public | `src/pages/Home.jsx` | Landing page with interactive 2-page scrapbook mockup, 3-step How It Works, 6 Features, and Closing CTA |
| `/s/:bookId` | Public (Minimal) | `src/pages/PublicBook.jsx` | Public share link page (`getDoc` only, `noindex`, no login required) for friends to fill out and submit a keepsake response |
| `/login` | Public-only | `src/pages/Login.jsx` | Firebase Email/Password login (redirects logged-in users to `/dashboard`) |
| `/signup` | Public-only | `src/pages/Signup.jsx` | Firebase Email/Password signup + `displayName` profile update |
| `/forgot-password` | Public-only | `src/pages/ForgotPassword.jsx` | Firebase password reset email page (`/forgot-password`) |
| `/dashboard` | Protected | `src/pages/Dashboard.jsx` | Personal slam book shelf displaying the user's real Firestore books (`getUserBooks`), lazy-loaded response counts, status controls, Copy Share Link, View Responses, Edit, and Delete |
| `/create` | Protected | `src/pages/CreateBook.jsx` | Choose from 5 templates (`Friendship`, `College memories`, `School farewell`, `Birthday`, `Get to know me`) or start from scratch |
| `/create/template/:id` | Protected | `src/pages/TemplateBuilderPreview.jsx` | Template question customiser saving new books to Cloud Firestore (`createBook`) |
| `/create/blank` | Protected | `src/pages/BlankBuilderPreview.jsx` | Blank slam book builder studio saving new books to Cloud Firestore (`createBook`) |
| `/books/:bookId/edit` | Protected | `src/pages/EditBook.jsx` | Edit an existing saved slam book (`getBookById` + `updateBook`), manage status, copy share link, and link to responses |
| `/books/:bookId/responses` | Protected | `src/pages/BookResponses.jsx` | View, search, paginate (25/page), edit, and delete friend responses for a slam book (`getBookResponses`, `getResponseCount`, `updateResponse`, `deleteResponse`) |
| `*` | Public | `src/pages/NotFound.jsx` | Friendly scrapbook-themed 404 page |

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
