# Study-AI Platform - Complete Tech Stack & Architecture

## 🏗️ Technology Stack Overview
**MERN + Python + WebRTC Stack** - Fully Dockerized, deployed on Vercel/Render/Atlas/GCS, with CI/CD via GitHub Actions, monitored by Grafana, designed in Figma. **No user uploads** - content seeded by admins only.

## 📋 Technology Matrix

| Phase / Layer          | Tools & Services                                                                                                                                                                                   | Purpose                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **IDE & Code**         | [VS Code](https://code.visualstudio.com/) + [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)                                                                                       | Dev environment & linting            |
| **Front-End**          | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS](https://tailwindcss.com/) + [ShadCN/ui](https://ui.shadcn.com/)      | SPA UI                               |
| **Back-End**           | [Node 20](https://nodejs.org/) + [Express](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)                                                                                 | REST API                             |
| **AI Engine**          | [Python 3.11](https://www.python.org/) + [FastAPI](https://fastapi.tiangolo.com/) + [OpenAI GPT-4](https://platform.openai.com/docs/models/gpt-4) + [tiktoken](https://github.com/openai/tiktoken) | Chat, quiz, summary, embeddings      |
| **Database**           | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (M0 free)                                                                                                                                     | Users, docs, notes, progress         |
| **Cache & Rate-Limit** | [Redis](https://redis.io/) ([Upstash](https://upstash.com/) serverless)                                                                                                                            | Session, leaderboard, socket adapter |
| **Storage**            | [Google Cloud Storage](https://cloud.google.com/storage) (5 GB free)                                                                                                                               | PDF / thumbnail buckets              |
| **Auth**               | [Firebase Auth](https://firebase.google.com/products/auth) (Google, GitHub, email)                                                                                                                 | JWT tokens                           |
| **Real-Time**          | [Socket.io](https://socket.io/) + [simple-peer](https://github.com/feross/simple-peer)                                                                                                             | Conference rooms & signalling        |
| **File Upload**        | [Multer](https://github.com/expressjs/multer) (admin CLI only) + [Google Cloud Signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls)                                      | Secure admin seed                    |
| **Charts**             | [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)                                                                                                          | Profile dashboards                   |
| **PDF Viewer**         | [pdfjs-dist](https://mozilla.github.io/pdf.js/) + [react-pdf](https://www.npmjs.com/package/react-pdf)                                                                                             | In-browser PDF render                |
| **Video Player**       | [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference)                                                                                                                   | Tutorial Hub embeds                  |
| **Lint & Format**      | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) + [Black](https://black.readthedocs.io/) (Python)                                                                                 | Code quality                         |
| **Testing**            | [Vitest](https://vitest.dev/) (unit) + [Testcontainers](https://testcontainers.com/) (Mongo & Redis) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)      | CI tests                             |
| **CI/CD**              | [GitHub Actions](https://github.com/features/actions) → [Vercel](https://vercel.com/) (front) + [Render](https://render.com/) (back & AI)                                                          | Auto-deploy on push                  |
| **Env & Secrets**      | [Google Secret Manager](https://cloud.google.com/secret-manager) + [dotenv](https://github.com/motdotla/dotenv)                                                                                    | Keys & tokens                        |
| **Monitoring**         | [Prometheus](https://prometheus.io/) + [Grafana Cloud](https://grafana.com/products/cloud/) + [Google Cloud Logging](https://cloud.google.com/logging)                                             | Latency, errors, tokens              |
| **Wire-framing**       | [UXPilot](https://uxpilot.ai/a/ui-list) + [Figma](https://figma.com)                                                                                                                               | UI mock-ups                          |
| **Container**          | [Docker](https://www.docker.com/) + [docker-compose](https://docs.docker.com/compose/)                                                                                                             | Local dev stack                      |
| **Package Manager**    | [pnpm](https://pnpm.io/) (monorepo) + [pip](https://pip.pypa.io/) (Python)                                                                                                                         | Fast installs                        |
| **Domain & CDN**       | [Vercel Edge](https://vercel.com/edge-network) + [Cloudflare](https://www.cloudflare.com/) (optional)                                                                                              | Global CDN & HTTPS                   |

## 🎨 Design System Specifications

### 1. VIEW-PORT & THEME
- **Base Frame**: 1920 × 1080 (auto-layout → 375 px breakpoint)
- **Colors**: Light theme surface `#FFFFFF`, indigo primary `#2563EB`, text `#111827`
- **Grid System**: 8-pt grid (8 / 16 / 24 / 32 / 48 / 64 px spacings)

### 2. NAV-BAR (sticky, 64 px high)
- **Logo**: 24 px icon + word-mark (bold 18 pt)
- **Links**: 14 pt, 32 px gap, change to indigo on hover
- **CTA button**: 12 pt "Sign Up", 8 px y-padding, 16 px x-padding, 4 px radius
- **Border**: Bottom 1 px #E5E7EB, 0 px shadow

### 3. HERO SECTION (75% viewport height ≈ 810 px)
- **Carousel**: 3 slides, auto-advancing 5s
- **Layout**: Left 50% (text), Right 50% (image 540 × 360 px, rounded 12 px)
- **Typography**: H1 48 pt bold, P 18 pt / 28 pt
- **Buttons**: Primary + secondary, 48 px high, 4 px radius
- **Indicators**: 3 circles 8 px

### 4. FEATURE CARDS (6 cards, alternating L/R)
- **Desktop**: 1200 px wide, mobile stacked
- **Image**: 540 × 220 rounded, 12 px radius, subtle indigo border 1 px
- **Typography**: H3 24 pt, P 16 pt / 24 pt
- **Spacing**: 64 px vertical gap, 32 px side-padding mobile

### 5. FLOATING "OPEN WORKSPACE" BUTTON
- **Size**: 56 × 56 px circle, indigo fill, white icon
- **Shadow**: Elevation 8 dp, 24 px margin from bottom-right
- **Animation**: Pulse on scroll-down (2s ease-in-out)

### 6. RESPONSIVE BREAKPOINTS
- **≥ 1280 px**: 2-column hero, 2-column cards
- **768 – 1279 px**: Stacked hero, 2-column cards  
- **≤ 767 px**: Stacked hero, 1-column cards, nav hamburger (optional)

### 7. INTERACTION STATES
- **Buttons**: Default → hover brightness 90%, 150ms transition
- **Carousel dots**: Inactive #D1D5DB 6 px, active indigo 8 px
- **Cards**: Hover scale 1.02, shadow sm, 200ms ease-out
- **Floating button**: Hover scale 1.1, shadow lg

## 🚀 Deployment Architecture
- **Frontend**: Vercel (React/Vite)
- **Backend API**: Render (Node.js/Express)
- **AI Service**: Render (Python/FastAPI)
- **Database**: MongoDB Atlas (M0 free tier)
- **Cache**: Upstash Redis (serverless)
- **Storage**: Google Cloud Storage (5 GB free)
- **Auth**: Firebase Auth
- **Monitoring**: Grafana Cloud + Google Cloud Logging

## 📦 Key Dependencies
```json
{
  "frontend": {
    "react": "^18.x",
    "vite": "^5.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "@shadcn/ui": "latest",
    "socket.io-client": "^4.x",
    "simple-peer": "^9.x",
    "chart.js": "^4.x",
    "react-pdf": "^7.x"
  },
  "backend": {
    "express": "^4.x",
    "socket.io": "^4.x",
    "mongodb": "^6.x",
    "redis": "^4.x",
    "firebase-admin": "^12.x",
    "multer": "^1.x"
  },
  "ai-service": {
    "fastapi": "^0.104.x",
    "openai": "^1.x",
    "tiktoken": "^0.5.x",
    "python": "3.11"
  }
}
```

## 🔧 Development Commands
```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Start all services
pnpm dev:client       # Frontend only
pnpm dev:server       # Backend only
pnpm dev:ai           # AI service only

# Build & Deploy
pnpm build            # Build all
pnpm preview          # Preview build
pnpm deploy           # Deploy to production

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests
pnpm test:e2e         # End-to-end tests

# Docker
docker-compose up     # Local full stack
docker-compose down   # Stop services
```

## 📋 Feature Checklist
- ✅ Admin Console (Add Content, Manage Content, Users, Analytics)
- ✅ Conference System (Lobby, Meeting, WebRTC)
- 🚧 Landing Page (Hero Carousel, Feature Cards, Floating Button)
- ⏳ Tutorial Hub (YouTube playlists, PDF viewer)
- ⏳ StudyPES (Note-taking, highlights, search)
- ⏳ Workspace (AI chat, summarization, quiz generation)
- ⏳ Profile (Progress tracking, analytics, achievements)
- ⏳ Authentication (Firebase integration)
- ⏳ Real-time features (Socket.io, notifications)

## 🎯 Content Strategy
**Admin-seeded only** - No user uploads for security and quality control:
- PDFs uploaded via admin CLI with Google Cloud Storage
- YouTube playlists curated by admins
- Quiz questions generated by AI from PDF content
- Study materials organized by subject/topic hierarchy
