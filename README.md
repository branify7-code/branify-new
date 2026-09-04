# BRANIFY — Digital Solutions for Modern Businesses

> Official website and digital agency platform for BRANIFY (`BUILD. BRAND. GROW.`).

## 🚀 Features

- **Executive Hero Presentation**: Interactive 3D celestial particle scene, responsive champagne-gold branding, and high-contrast typography.
- **Announcement Bar**: Dynamic 4-message rotator with session persistence and auto-pause.
- **Custom Navigation**: Sticky header with blur effects, dynamic active states, multi-currency switcher (PKR, USD, AED, EUR, GBP, SAR), and mobile drawer.
- **Client Inquiry & Leads System**: Integrated directly with **Supabase** for real-time lead capture, project discovery questionnaires, and notifications.
- **Agency Showcase**: Specialized services, interactive portfolio cases, client testimonials, process roadmap, and interactive FAQ accordion.
- **Browser Utilities & AI Tools**: 100+ free browser utilities and specialized AI tools suite.
- **PWA Ready**: Offline-first capability, service worker caching, and custom installation prompts.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Three.js
- **Backend & Database**: Supabase (PostgreSQL, Row-Level Security, Realtime REST API)
- **Deployment**: Vercel / Cloud Run / Static SPA

---

## 🔑 Environment Variables

To deploy on **Vercel** or locally, configure the following environment variables:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://uspshkegxhrglbpxqtil.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Publishable / Anon API Key | `sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for AI tools | `YOUR_GEMINI_API_KEY` |

---

## 🗄️ Database Setup (Supabase)

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select project **`uspshkegxhrglbpxqtil`**.
3. Navigate to **SQL Editor** on the left navigation panel.
4. Click **New Query** and copy the contents of [`supabase/schema.sql`](./supabase/schema.sql).
5. Click **Run**.
6. The `inquiries` and `newsletter_subscribers` tables and their Row-Level Security (RLS) policies are now active.

---

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Deploying to Vercel

1. **Push or Export** this repository to your GitHub account.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Select **Import Git Repository** and choose your new BRANIFY repo.
4. Set Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://uspshkegxhrglbpxqtil.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_X11QDwMSfS2ivSePRVDpLQ_xNFY_8vw`
6. Click **Deploy**.
