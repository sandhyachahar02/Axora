# Axora — Next.js 14 App

A premium AI-powered collaboration SaaS UI built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

---

## 📁 Project Structure

```
axora-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout (fonts, metadata)
│   │   ├── page.tsx                ← Landing page (/)
│   │   ├── globals.css             ← Global styles + Tailwind
│   │   └── (app)/                  ← App shell route group
│   │       ├── layout.tsx          ← Sidebar + header shell
│   │       ├── dashboard/page.tsx
│   │       ├── projects/page.tsx
│   │       ├── teams/page.tsx
│   │       └── chat/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                     ← Shared primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── SectionLabel.tsx
│   │   │   └── ScrollRevealProvider.tsx
│   │   ├── layout/                 ← App shell
│   │   │   ├── Sidebar.tsx
│   │   │   └── AppHeader.tsx
│   │   ├── landing/                ← Landing page sections
│   │   │   ├── LandingNav.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   ├── CtaSection.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── WelcomeRow.tsx
│   │   │   ├── StatsGrid.tsx
│   │   │   ├── ActivityCard.tsx
│   │   │   └── TasksCard.tsx
│   │   ├── projects/
│   │   │   └── KanbanBoard.tsx
│   │   ├── teams/
│   │   │   └── TeamGrid.tsx
│   │   └── chat/
│   │       └── ChatLayout.tsx      ← Client component (useState)
│   │
│   ├── lib/
│   │   └── data.ts                 ← All mock data
│   └── types/
│       └── index.ts                ← TypeScript interfaces
│
├── tailwind.config.ts              ← Design tokens
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#050505` |
| Surface | `#0F0F10` |
| Elevated | `#1C1C1F` |
| Primary | `#635BFF` |
| Secondary | `#3FD0FF` |
| Accent | `#FF5C8A` |
| Text | `#E6E6E6` |
| Text muted | `#A1A1AA` |

**Fonts:** Syne (display headings) + DM Sans (body) via `next/font/google`

---

## 📄 Pages & Routes

| Route | Page |
|---|---|
| `/` | Landing page |
| `/dashboard` | Dashboard (stats, activity, tasks) |
| `/projects` | Projects + Kanban board |
| `/teams` | Teams grid |
| `/chat` | Live chat with channel switching |

---

## 🛠 Tech Stack

- **Next.js 14** — App Router, Server & Client Components
- **TypeScript** — Strict mode, fully typed
- **Tailwind CSS** — Utility-first, custom design tokens
- **clsx** — Conditional class merging
- **next/font** — Zero-layout-shift font loading

---

## 💡 Key Patterns

- **Route Groups** — `(app)` groups dashboard routes under shared layout without affecting URLs
- **Server Components by default** — only `ChatLayout`, `LandingNav`, `Sidebar`, `AppHeader` use `"use client"`
- **Data layer** — all mock data lives in `src/lib/data.ts` with typed interfaces in `src/types/index.ts`
- **Scroll reveal** — `ScrollRevealProvider` is a client component that runs `IntersectionObserver` after hydration

---

## 📦 Scripts

```bash
npm run dev      # Development server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```
