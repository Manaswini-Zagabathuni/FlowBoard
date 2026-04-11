# FlowBoard - Kanban Task Manager

A polished, full-featured Kanban board built with React + TypeScript + Supabase.

---

## Features

- **Drag & drop** tasks across columns (To Do → In Progress → In Review → Done)
- **Guest auth** - anonymous sign-in via Supabase, no email required
- **Row Level Security** - each user only sees their own data
- **Labels / Tags** - create custom color labels and filter by them
- **Task detail panel** - slide-over with editable title, description, priority, due date
- **Comments** - add timestamped comments to any task
- **Activity log** - track status changes and edits per task
- **Due date indicators** - visual badges for upcoming and overdue tasks
- **Search & filter** - live search + filter by priority and label
- **Board stats** - total tasks, completed, overdue at a glance

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Vanilla CSS (custom design system, DM Sans font) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Database & Auth | Supabase (anonymous sign-in + RLS) |
| Hosting | Vercel |

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd kanban-app
npm install
```
  
### 2. Create a Supabase project
 
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (free tier)
3. Go to **Authentication → Providers → Anonymous** and **enable** anonymous sign-in
4. Go to **SQL Editor** and run the entire contents of `schema.sql`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials (found in Project Settings → API):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ Never commit your `.env` file. Never use the service role key in the frontend — only the anon key.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables in the Vercel dashboard (same keys as `.env`)
4. Deploy — Vercel auto-detects Vite

---

## Database Schema

See `schema.sql` for the full SQL. Summary:

| Table | Purpose |
|-------|---------|
| `tasks` | Core task data (title, status, priority, due_date, position) |
| `labels` | User-created color labels |
| `task_labels` | Many-to-many junction between tasks and labels |
| `comments` | Per-task comments |
| `activity_log` | History of task changes (status, title, priority) |

All tables have RLS enabled. Each user can only read/write their own rows.

---

## Advanced Features Built

| Feature | Details |
|---------|---------|
| Due date indicators | Cards show colored badges: normal / "soon" (within 3 days) / "overdue" |
| Search & filter | Live search by title; filter dropdowns for priority and label |
| Board stats | Header shows total tasks, done count, overdue count |
| Labels / Tags | Create color labels, assign to tasks, filter board by label |
| Task comments | Timestamped comment thread per task with Cmd+Enter shortcut |
| Activity log | Automatic tracking of status changes, title edits, priority changes |

---

## Design Decisions

- **Vanilla CSS over Tailwind** - full control over the dark design system with CSS custom properties; easier to maintain and audit
- **@dnd-kit over react-beautiful-dnd** - actively maintained, accessible by default, works well with React 18 strict mode
- **Direct Supabase from frontend** - no separate Go backend needed; RLS enforces security at the database layer
- **Optimistic updates on drag** - task position updates immediately in UI, then confirmed by Supabase; if it fails, state is reverted
- **Anonymous auth** - zero friction for users; each guest session is isolated via RLS

---

## What I'd Improve With More Time

- **Assignees / team members** - add a `team_members` table and avatar display on cards
- **Real-time multiplayer** - the Supabase subscription is set up; with assignees it would show live cursor/drag state
- **Column customization** - let users add/rename/reorder columns
- **Keyboard navigation** - full keyboard-driven drag-and-drop for accessibility
- **Offline support** - queue writes when offline and sync on reconnect
- **Board templates** - start with pre-filled columns and example tasks
