# BASSAM AI - مساعد ذكاء اصطناعي عربي

## Overview

BASSAM AI is an Arabic-language AI chat assistant application (formerly "ذكاء"). It provides a conversational interface where users can interact with an AI powered by the Groq API. The application supports:
- Multiple conversation threads
- Message history persistence
- Image upload and analysis (vision capabilities)
- Modern RTL (right-to-left) Arabic interface
- Dark/light theme support
- Progressive Web App (PWA) for mobile installation

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Feb 2026**: Renamed from "ذكاء" to "BASSAM AI"
- **Feb 2026**: Added PWA support (manifest.json, service worker)
- **Feb 2026**: Added image upload and vision analysis using Llama 3.2 Vision model
- **Feb 2026**: Custom app icon

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Theme System**: Custom theme provider with dark/light mode support and CSS variables
- **Build Tool**: Vite with HMR support
- **PWA**: Service worker and manifest for mobile app installation

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom application components in `client/src/components/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Design**: RESTful JSON API endpoints under `/api/`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **AI Integration**: Groq SDK for LLM interactions

Key backend modules:
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database access layer implementing IStorage interface
- `server/groq.ts` - AI chat response generation (text + vision)
- `server/db.ts` - Database connection pool

### Data Storage
- **Database**: PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Migrations**: Drizzle Kit with migrations in `./migrations`

Database tables:
- `users` - User accounts (id, username, password)
- `conversations` - Chat conversation threads (id, title, timestamps)
- `messages` - Individual messages (id, conversationId, role, content, timestamp)

### Build System
- Development: Vite dev server with Express backend integration
- Production: Custom build script using esbuild for server bundling and Vite for client

## External Dependencies

### AI/LLM Services
- **Groq API** - Primary AI provider using `groq-sdk` package
  - Text Model: `llama-3.3-70b-versatile`
  - Vision Model: `llama-3.2-90b-vision-preview` (for image analysis)
  - Requires `GROQ_API_KEY` environment variable

### Database
- **PostgreSQL** - Primary database
  - Requires `DATABASE_URL` environment variable
  - Uses `pg` package for connection pooling

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Headless UI primitives for shadcn/ui
- `date-fns` - Date formatting with Arabic locale support
- `zod` - Schema validation for API requests

### Development Tools
- Replit-specific plugins for Vite (error overlay, cartographer, dev banner)
- TypeScript with strict mode enabled

## VPS Deployment

The application is deployed on a VPS server (161.97.69.73):
- PM2 process manager for Node.js
- PostgreSQL database with URL-encoded credentials
- GitHub-based deployment workflow
- Production build via `npm run build`
