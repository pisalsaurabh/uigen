# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (installs deps, generates Prisma client, runs migrations)
npm run setup

# Development server (Turbopack)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
npx vitest src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Reset database
npm run db:reset
```

Environment: Add `ANTHROPIC_API_KEY` to `.env`. If missing, the app falls back to mock data (no real AI generation).

## Architecture

**UIGen** is an AI-powered React component generator. Users describe components in a chat interface; Claude generates code that renders live in an iframe.

### Request Flow

1. User sends message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. API streams response from Claude via Vercel AI SDK (`src/lib/provider.ts`)
3. Claude uses two tools to write code:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`): create/read/edit files
   - `file_manager` (`src/lib/tools/file-manager.ts`): rename/delete/list files
4. Tool calls mutate a **virtual in-memory filesystem** (`src/lib/file-system.ts`) — no real disk writes
5. Virtual FS changes trigger `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) to recompile via Babel standalone and reload the iframe
6. If authenticated, final FS state + messages are persisted as JSON blobs in SQLite via Prisma

### Virtual Filesystem

`src/lib/file-system.ts` implements an in-memory tree. The AI always targets `/App.jsx` as the entry point and uses `@/` imports for internal files. The FS serializes to JSON for database storage (`Project.data` column).

### State Management

Two React contexts bridge server and client:
- `src/lib/contexts/file-system-context.tsx`: owns the `FileSystem` instance; exposes it to editor and preview
- `src/lib/contexts/chat-context.tsx`: manages message history and streaming state

### AI System Prompt

`src/lib/prompts/generation.tsx` — instructs Claude to generate Tailwind-styled React components, always output `/App.jsx` as entry, and operate on the virtual FS (not real disk).

### Authentication

JWT sessions in httpOnly cookies (`src/lib/auth.ts`, 7-day expiry). Server actions in `src/actions/index.ts` handle sign-up/in/out and project CRUD. Anonymous users can generate components; work is tracked via `src/lib/anon-work-tracker.ts` and can be saved after sign-up.

### Database Schema

The database schema is defined in `prisma/schema.prisma`. Reference it any time you need to understand the structure of data stored in the database.

### Key Path Alias

`@/*` resolves to `src/*` (see `tsconfig.json`).

### UI Layout

`src/app/main-content.tsx` renders a resizable 3-panel layout: Chat (left, 35%) | Preview or Code editor (right, 65%). The Code view splits into FileTree (30%) + Monaco Editor (70%).

### JSX Preview Pipeline


`src/lib/transform/jsx-transformer.ts` uses `@babel/standalone` in the browser to compile JSX/TSX, resolves `@/` imports from the virtual FS, and injects the result into a sandboxed iframe. Entry point auto-detected as `App.jsx`, `App.tsx`, `index.jsx`, etc.

### Testing

Tests use Vitest + React Testing Library. Test files are in `src/lib/__tests__/` and component `__tests__/` folders.

## Code Style

Only add comments where the logic is complex or non-obvious. Self-explanatory code should have no comments.
