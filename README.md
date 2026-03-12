# Lexintel — AI-Powered Legal Docs & Guidance Platform

Lexintel is a modern legal-assist web app built with Next.js, Firebase, and Genkit.
It helps users in India:

- Ask legal questions via AI (`Lawbot`)
- Generate legal drafts from guided templates
- Discover verified lawyers by location
- Submit documents/profile data for lawyer verification workflows

---

## ✨ Key Features

### 1) Lawbot (AI legal Q&A)
- Conversational legal guidance for common user queries
- Structured, readability-first response format
- India-first legal context by default (unless user specifies another jurisdiction)
- Conversation history-aware prompt flow

### 2) Legal Draft Generator
- Select document templates and fill form-driven fields
- AI-generated legal draft output with sectioned formatting
- Built-in model fallback behavior when AI quota/service is unavailable
- One-click submission for verification review

### 3) Lawyer Discovery
- Browse all verified lawyers across India
- “Near me” flow using browser geolocation
- State/city filtering for location-specific search

### 4) Verification Workflow
- Users can submit draft/profile verification requests
- Lawyer review panel for approve/reject/review actions
- User-facing request tracking with comments and resubmission support

---

## 🧱 Tech Stack

- **Framework:** Next.js 15, React 18, TypeScript
- **Styling/UI:** Tailwind CSS, Radix UI, custom UI components
- **Backend/Data:** Firebase (Firestore + Auth), Firebase Admin SDK
- **AI:** Genkit with Google GenAI model integration
- **Utilities:** date-fns, zod, lucide-react

---

## 📁 Project Structure (high level)

```text
src/
  app/
    page.tsx                 # Landing + authenticated entry routing
    draft/page.tsx           # Draft generation UI
    lawbot/page.tsx          # Lawbot page
    find-lawyer/page.tsx     # Lawyer discovery & filters
    my-requests/page.tsx     # User verification requests dashboard
    lawyer-panel/page.tsx    # Lawyer review dashboard
    actions.ts               # Server actions for drafting + verification
  ai/
    flows/
      answer-legal-query.ts  # Lawbot flow
      generate-legal-draft.ts# Draft generator flow
  components/                # Reusable UI/feature components
  firebase/                  # Client/admin/firebase helpers/hooks
  lib/                       # Static data and utility helpers
```

---

## 🗄️ Firestore Data Model (overview)

Primary collections and relationships include:

- `users`
- `lawyers`
- `verificationRequests`
- `approvedDrafts`
- `activities` (as user subcollection)

See schema diagram in this README’s historical context or your database rules/indexes for implementation details.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm 9+
- Firebase project (Auth + Firestore enabled)
- AI provider credentials (for Genkit model calls)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file in the project root and add your Firebase + AI keys.
A typical setup includes:

```bash
# Firebase web config
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-side actions)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Genkit / Google AI
GOOGLE_API_KEY=...
```

> Note: variable names may vary slightly based on your deployment strategy.
> Check `src/firebase/*` and `src/ai/*` for exact usage patterns.

### 3) Run in development

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

### 4) Build for production

```bash
npm run build
npm run start
```

---

## 🔐 Authentication & Access Rules

- Public pages are available for anonymous users.
- Some routes require login (`/dashboard`, `/lawyer-panel`, `/my-requests`).
- Lawyer-only access is enforced for `/lawyer-panel` using configured identity logic.

---

## 🤖 AI Flow Behavior

### Lawbot
- Uses a prompt policy designed for clarity and safe informational guidance
- Avoids claiming legal representation and avoids fabricated legal details
- Uses model-selection helper with graceful “quota exhausted” messaging

### Draft Generator
- Generates structured legal drafts from selected template and form values
- Uses primary model with fallback model retry before static fallback draft

---

## 🧪 Scripts

```bash
npm run dev    # Start development server
npm run build  # Production build
npm run start  # Start production server
```

---

## 🛠️ Deployment

This project is compatible with standard Next.js deployment targets (including Firebase App Hosting and similar environments). Ensure:

- All required environment variables are configured in your host
- Firestore rules/indexes are deployed
- Server-side credentials are available securely for Admin SDK operations

---

## 🤝 Contributing

1. Create a feature branch
2. Make focused changes
3. Run local checks (`npm run build` recommended)
4. Open a PR with summary + test results

---

## 📄 License

WattWise is released under the **MIT License**.

