# Slamly

> **Every friend. Every memory. One little book.**

**Slamly** is a nostalgic, scrapbook-themed personal digital slam book platform built with React, Vite, and Firebase (free Spark plan). It brings back the warmth of passing a physical slam book around school or college — letting you design custom question books, share a single link with friends (who can sign a page and attach a polaroid photo with no account required), manage responses privately, and save a print-ready memory book as a PDF.

---

## 1. Key Features

- **Nostalgic Scrapbook Design:** Warm cream paper backgrounds, washi tape accents, polaroid frames, handwritten headings (`Patrick Hand` + `DM Sans`), and WCAG 2.1 AA high-contrast colors.
- **Ready-Made Templates & Blank Studio:** Start in seconds with 5 curated templates (*Friendship*, *College Memories*, *School Farewell*, *Birthday*, *Get to Know Me*) or build a custom slam book from scratch with up to 50 questions (`short_answer`, `paragraph`, `date`, `multiple_choice`, `polaroid_prompt`).
- **Frictionless Public Sharing (`/s/:bookId`):** Share a link on WhatsApp, Instagram, or group chats. Friends can fill out their page right in their browser **without creating an account**.
- **Optional Polaroid Photos (Spark Plan Friendly):** Friends can attach one optional photo to their response. Photos are resized in the browser (max 650 px), stripped of EXIF location data via `<canvas>`, and compressed into a compact JPEG data URL (`<= 120 KB`) stored directly inside the response document — no Firebase Storage or paid Blaze plan required.
- **Private Response Management (`/books/:bookId/responses`):** Only the book owner can read, search, edit, or delete responses, remove an unwanted photo, or change a book's status between **Draft** (private), **Published** (open), and **Closed** (no longer accepting responses).
- **Two PDF Export Options:**
  - **Print-Ready Memory Book (`/books/:bookId/print`):** Uses the browser's native print/Save-as-PDF engine with a multilingual font stack so **emoji, Tamil, Hindi (Devanagari), Latin scripts, and polaroid photos** all render in full color.
  - **Quick Text-Only PDF (`jsPDF`):** Instant one-click A4 PDF download for Latin-text responses, with pre-export scanning and a clear warning dialog if non-Latin scripts or emoji are detected.
- **Security Hardening:**
  - **Sanitized Public Books (`publicBooks/{bookId}`):** Public share pages read from `publicBooks/{bookId}` rather than `books/{bookId}`, ensuring the owner's Firebase UID (`ownerId`) is never exposed publicly.
  - **Firebase App Check (reCAPTCHA v3):** Protects Cloud Firestore and Firebase Auth from automated script abuse.
  - **Strict Firestore Security Rules (`firestore.rules`):** Enforces ownership, field whitelists, character/size limits, and blocks public listing (`allow list: if false`) on `publicBooks`.
  - **Account & Full Data Deletion (`/account`):** Owners can re-enter their password, type `DELETE`, and permanently delete all of their slam books, public book copies, friend responses, and Firebase Auth account.

---

## 2. How the User Flow Works

1. **Book Owner Signs Up / Logs In:** Creates an account at `/signup` or signs in at `/login`.
2. **Creates a Slam Book:** Chooses a template at `/create` or builds a blank book at `/create/blank`, customizes the cover theme and questions, and saves it as **Published** (or **Draft**).
3. **Shares the Link:** Copies the public link (`/s/:bookId`) from `/dashboard` or `/books/:bookId/edit` and sends it to friends.
4. **Friends Sign a Page:** Friends open `/s/:bookId` (no login required), enter their name/nickname, answer the questions, optionally attach a photo, and submit.
5. **Owner Reads, Curates & Exports:** The owner opens `/books/:bookId/responses` to search, edit, or delete responses, and clicks **Download memory book** (`/books/:bookId/print`) to save a keepsake PDF.

---

## 3. Tech Stack

- **Frontend:** React 19, React Router v7, Vite 8, Vanilla CSS (Custom Properties, CSS Grid/Flexbox, `@media print` A4 rules)
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Google Cloud Firestore (Spark free plan)
- **Abuse Protection:** Firebase App Check with Google reCAPTCHA v3
- **PDF Generation:** Native Browser Print-to-PDF (`/books/:bookId/print`) + `jspdf` quick text export
- **Hosting:** Vercel (with SPA rewrite and HTTP security headers in `vercel.json`)

---

## 4. Local Setup (Step-by-Step for Beginners)

### Step 1: Prerequisites
Make sure you have installed:
- **Node.js** (v18 or newer recommended) — [https://nodejs.org](https://nodejs.org)
- **Git** — [https://git-scm.com](https://git-scm.com)

### Step 2: Install Dependencies
Open a terminal in the `slamly` folder and run:
```bash
npm install
```

### Step 3: Create a Firebase Project (Free Spark Plan)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Give your project a name (for example, `slamly-app`) and finish creating it ( stayed on the free **Spark** plan).
3. In Project Overview, click the **Web (`</>`)** icon to register a new web app. Copy the config values shown (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

### Step 4: Enable Email/Password Authentication
1. In the Firebase Console sidebar, go to **Build -> Authentication** and click **Get started**.
2. On the **Sign-in method** tab, click **Email/Password**, toggle **Enable** on (leave "Email link" off), and click **Save**.

### Step 5: Create the Cloud Firestore Database
1. In the Firebase Console sidebar, go to **Build -> Firestore Database** and click **Create database**.
2. Choose a location close to your users, start in **Production mode**, and click **Create**.

### Step 6: Set Up Google reCAPTCHA v3 & Firebase App Check (Optional Locally, Recommended in Production)
1. Open the [Google reCAPTCHA v3 Admin Console](https://www.google.com/recaptcha/admin/create) and register a **reCAPTCHA v3** key for your domain(s) (e.g., `localhost` and your `.vercel.app` domain).
2. You will receive a **Site Key** (public) and a **Secret Key** (private).
3. In the Firebase Console, go to **Build -> App Check -> Apps**, click your web app, choose **reCAPTCHA v3**, paste the **Secret Key** there, and save.

### Step 7: Create Your `.env.local` File
Copy `.env.example` to `.env.local` in the root of `slamly`:
```bash
cp .env.example .env.local
```
Fill in the environment variable names in `.env.local` with your own Firebase Web App values (never commit `.env.local` to Git):

| Environment Variable Name | Description |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web App API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain (`<project-id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Cloud Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket identifier |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_RECAPTCHA_SITE_KEY` | Public reCAPTCHA v3 **Site Key** (never put the Secret Key here) |

### Step 8: Run Locally & Build
- Start the local development server:
  ```bash
  npm run dev
  ```
- Build for production:
  ```bash
  npm run build
  ```
- Preview the production build locally:
  ```bash
  npm run preview
  ```

---

## 5. Deploying to Vercel

1. Push your repository to GitHub (confirm `.env.local` is not tracked).
2. Log in to [Vercel](https://vercel.com/) and click **Add New -> Project**, then import your GitHub repository.
3. In Vercel **Project Settings -> Environment Variables**, add the 7 `VITE_*` variables listed in the table above (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_RECAPTCHA_SITE_KEY`).
4. Click **Deploy**.
5. Once deployed, copy your Vercel domain (e.g. `your-app.vercel.app`) and add it to:
   - **Firebase Console -> Authentication -> Settings -> Authorized domains**
   - **Google reCAPTCHA Admin Console -> Settings -> Domains**
6. `vercel.json` automatically configures SPA routing and security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## 6. Firestore Data Model

Slamly uses three collections/subcollections in Cloud Firestore:

### 1. `books/{bookId}` (Private Owner Collection)
Only the authenticated owner (`request.auth.uid == resource.data.ownerId`) can read, create, update, or delete their own book documents.
- `ownerId` (`string`, immutable): Firebase Auth UID of the creator.
- `title` (`string`, 1–100 chars): Book title.
- `description` (`string`, 0–500 chars): Welcome note.
- `templateId` (`string | null`): Template identifier or `null` for blank books.
- `coverTheme` (`'pink' | 'lavender' | 'peach' | 'sage'`): Scrapbook pastel theme.
- `status` (`'draft' | 'published' | 'closed'`): Current book status.
- `questions` (`array`, 1–50 items): List of `{ id, text, type, order, required, options? }`.
- `createdAt` (`timestamp`, immutable): Server creation timestamp.
- `updatedAt` (`timestamp`): Server update timestamp.

### 2. `publicBooks/{bookId}` (Sanitized Public Mirror)
Synced atomically via `writeBatch` whenever a book is created, updated, published, closed, moved to draft, or deleted. Contains **only** the fields needed by `/s/:bookId` and **never** includes `ownerId`:
- `title` (`string`, 1–100 chars)
- `description` (`string`, 0–500 chars)
- `coverTheme` (`'pink' | 'lavender' | 'peach' | 'sage'`)
- `questions` (`array`, 1–50 items)
- `status` (`'published' | 'closed'` — draft books are deleted from `publicBooks`)
- `updatedAt` (`timestamp`)

### 3. `books/{bookId}/responses/{responseId}` (Friend Responses Subcollection)
Anyone with the link to a `published` book can `create` a response, but **only the book owner** can `read`, `update`, or `delete` responses.
- `respondentName` (`string`, 1–50 chars): Friend's name or nickname.
- `answers` (`array`, 1–50 items): List of `{ questionId, question, answer }` (`answer` up to 1000 chars).
- `createdAt` (`timestamp`, immutable): Server submission timestamp.
- `photo` (`string`, optional): Resized JPEG data URL (`data:image/jpeg;base64,...`, max `160,000` chars, stripped of EXIF metadata).

---

## 7. Security Model & Honest Limitations

### What Is Protected
- **Owner Privacy (`ownerId` Never Exposed):** Public visitors at `/s/:bookId` read `publicBooks/{bookId}` via a single `getDoc()` call. The private `books/{bookId}` document (which holds `ownerId`) is restricted strictly to the authenticated owner.
- **No Public Directory Listing:** `allow list: if false` on `publicBooks/{bookId}` prevents anyone from querying a list of all published books.
- **Private Responses:** Friends can only `create` a response when `publicBooks/{bookId}.status == 'published'`. They can never read, list, update, or delete any responses.
- **Photo Privacy & Size Enforcement:** Photos are redrawn on an HTML5 `<canvas>` in the browser before upload, which strips EXIF metadata (such as GPS coordinates), and Firestore rules enforce `data:image/jpeg;base64,` prefix and `photo.size() <= 160000`.
- **Bot & Abuse Mitigation:** Firebase App Check (reCAPTCHA v3), a hidden honeypot field, and local browser submission notices reduce automated spam.

### Honest Limitations (Spark Plan / No Custom Backend)
- **Anyone With the Link Can Submit:** Because friends do not need an account to sign a published slam book, anyone who has the `/s/:bookId` URL while the book is `published` can open it and submit responses. Owners can close a book (`status: 'closed'`) or delete unwanted responses at any time.
- **Client-Side Rate Limiting Only:** Without paid Cloud Functions, per-IP rate limiting is handled by Firebase App Check (reCAPTCHA v3) rather than a custom server rate limiter.
- **`robots.txt` Is Advisory Only:** `public/robots.txt` asks well-behaved search engine crawlers not to index `/s/`, `/dashboard`, `/account`, etc., but `robots.txt` is **not** a security boundary — actual access control is enforced by Firebase Auth and `firestore.rules`.

---

## 8. Publishing `firestore.rules`

Whenever you set up a new Firebase project or update [`firestore.rules`](firestore.rules):
1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Go to **Build -> Firestore Database -> Rules**.
3. Copy the entire contents of [`firestore.rules`](firestore.rules) from this repository, paste it into the Firebase Rules editor, and click **Publish**.

---

## 9. Project Structure

```text
slamly/
├── public/
│   ├── favicon.svg              # Scrapbook heart/book SVG icon
│   └── robots.txt               # Crawler directives for private & share routes
├── src/
│   ├── assets/
│   │   └── ScrapbookDoodles.jsx # Decorative SVG stickers, polaroid art & logo
│   ├── components/
│   │   ├── BookCard.jsx         # Dashboard slam book card with status & share controls
│   │   ├── Button.jsx           # Accessible button / router link component
│   │   ├── ErrorBoundary.jsx    # Top-level scrapbook error recovery boundary
│   │   ├── Footer.jsx           # Site footer with navigation & legal links
│   │   ├── Navbar.jsx           # Responsive header & mobile drawer
│   │   ├── ProtectedRoute.jsx   # Redirects unauthenticated users to /login
│   │   └── PublicOnlyRoute.jsx  # Redirects signed-in users from /login & /signup to /dashboard
│   ├── context/
│   │   └── AuthContext.jsx      # Firebase Auth state, signup, login, logout, password reset
│   ├── data/
│   │   └── mockBooks.js         # Starter BOOK_TEMPLATES definitions
│   ├── firebase/
│   │   ├── authErrors.js        # Beginner-friendly Firebase Auth error messages
│   │   ├── firebase.js          # Firebase app, Auth & App Check (reCAPTCHA v3) setup
│   │   └── firestore.js         # Cloud Firestore instance
│   ├── layouts/
│   │   └── MainLayout.jsx       # Skip link, Navbar, <main id="main-content">, Footer
│   ├── pages/
│   │   ├── Account.jsx          # Profile info & full account + data deletion (/account)
│   │   ├── BlankBuilderPreview.jsx     # Custom blank book builder (/create/blank)
│   │   ├── BookResponses.jsx    # Owner response viewer, search, edit, delete & export
│   │   ├── CreateBook.jsx       # Template picker & blank studio entry (/create)
│   │   ├── Dashboard.jsx        # Owner slam book shelf (/dashboard)
│   │   ├── EditBook.jsx         # Saved book editor & sharing status controls
│   │   ├── ForgotPassword.jsx   # Password reset request page (/forgot-password)
│   │   ├── Home.jsx             # Public landing page (/)
│   │   ├── Login.jsx            # Email/password sign-in (/login)
│   │   ├── NotFound.jsx         # 404 fallback page (*)
│   │   ├── PrintBook.jsx        # Print-ready multilingual + photo memory book (/books/:bookId/print)
│   │   ├── Privacy.jsx          # Plain-language privacy summary (/privacy)
│   │   ├── PublicBook.jsx       # Public friend response form (/s/:bookId)
│   │   ├── Signup.jsx           # Account registration (/signup)
│   │   ├── TemplateBuilderPreview.jsx  # Template book builder (/create/template/:id)
│   │   └── Terms.jsx            # Plain-language terms of use (/terms)
│   ├── services/
│   │   ├── accountService.js    # Reauthentication & full account/books/responses deletion
│   │   ├── bookService.js       # Firestore CRUD for books & publicBooks sync
│   │   ├── pdfExportService.js  # jsPDF quick text export & paginated response fetcher
│   │   └── responseService.js   # Firestore CRUD for friend responses
│   ├── styles/
│   │   ├── components.css       # Component, page, responsive & @media print styles
│   │   ├── global.css           # Reset, typography, focus-visible & reduced-motion rules
│   │   └── variables.css        # Design tokens & WCAG AA color palette
│   ├── utils/
│   │   ├── photoUtils.js        # Client-side canvas photo resize & EXIF stripping
│   │   └── useModalFocusTrap.js # Accessible modal focus trap & Escape handler
│   ├── App.jsx                  # Route table, document.title manager & focus management
│   └── main.jsx                 # React root mount
├── .env.example                 # Template of required VITE_* environment variables
├── firestore.rules              # Production Cloud Firestore security rules
├── index.html                   # HTML shell, Google Fonts & Open Graph metadata
├── package.json                 # Scripts and dependencies
├── vercel.json                  # Vercel SPA rewrite & HTTP security headers
└── vite.config.js               # Vite configuration
```

---

## 10. Route Table

| Route Path | Access | Layout | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Public | `MainLayout` | Scrapbook landing page, interactive preview, how it works & features |
| `/privacy` | Public | `MainLayout` | Plain-language privacy summary |
| `/terms` | Public | `MainLayout` | Plain-language terms of use |
| `/login` | Public-only | `MainLayout` | Email/password sign-in (redirects to `/dashboard` if already logged in) |
| `/signup` | Public-only | `MainLayout` | Account registration (redirects to `/dashboard` if already logged in) |
| `/forgot-password` | Public-only | `MainLayout` | Password reset email form |
| `/dashboard` | Protected (Owner) | `MainLayout` | Personal shelf of saved slam books, status filters, and quick actions |
| `/account` | Protected (Owner) | `MainLayout` | Displays user's name and email, plus permanent account & data deletion |
| `/create` | Protected (Owner) | `MainLayout` | Choose from 5 starter templates or start a blank custom slam book |
| `/create/template/:id` | Protected (Owner) | `MainLayout` | Customize and save a slam book from a starter template |
| `/create/blank` | Protected (Owner) | `MainLayout` | Build and save a custom slam book from scratch |
| `/books/:bookId/edit` | Protected (Owner) | `MainLayout` | Edit a saved slam book's title, theme, status, or questions |
| `/books/:bookId/responses` | Protected (Owner) | `MainLayout` | View, search, edit, delete, and export friend responses for a book |
| `/books/:bookId/print` | Protected (Owner) | Print Layout | Clean print-ready memory book (all languages, emoji, and photos) |
| `/s/:bookId` | Public | Minimal Public Shell | Friend response form (no login required, no owner navigation) |
| `*` | Public | `MainLayout` | Friendly 404 Page Not Found screen |

---

## 11. Known Limitations & Future Ideas

- **Single Photo Per Response:** To stay comfortably within Cloud Firestore's 1 MiB document limit on the free Spark plan, each response supports one compressed polaroid photo (`<= 120 KB`).
- **Print Cap:** The print-ready memory book (`/books/:bookId/print`) loads up to 300 responses at a time (`MAX_PRINT_RESPONSES = 300`) so browser memory stays responsive when rendering photos.
- **Future Ideas:**
  - Optional passcodes on published slam books so owners can share a short PIN alongside their link.
  - Custom sticker stamps that friends can pick when signing a page.
  - Drag-and-drop question reordering.
