# FlowBoard - Upgrade Guide

## What's included

| File | What it does |
|---|---|
| `src/types/index.ts` | Shared TypeScript types for the whole app |
| `src/lib/supabase.ts` | All Supabase queries in one typed file |
| `src/lib/templates.ts` | 4 board templates + seed helper |
| `src/hooks/useTasks.ts` | Single hook for tasks with optimistic updates & realtime |
| `src/components/KanbanCard.tsx` | Memoised card with avatars + confetti |
| `src/components/KanbanColumn.tsx` | Memoised column |
| `src/components/TemplatePicker.tsx` | Template picker modal |
| `src/App.tsx` | Upgraded app with keyboard sensors, shortcuts, theme toggle |
| `src/upgrades.css` | All new CSS (add to bottom of your index.css) |
| `schema.sql` | Upgraded schema with team_members + indexes |
| `package.json` | Updated dependencies |

---

## Step-by-step integration

### 1. Install new dependencies

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

### 2. Update the database schema

Run the new `schema.sql` in your Supabase SQL Editor.
It uses `IF NOT EXISTS` throughout so it is safe to run on top of your existing data.

Enable Realtime for the tasks table in:
**Supabase Dashboard → Database → Replication → supabase_realtime → Add table → tasks**

### 3. Drop in the new files

Copy each file from this package into the matching path in your project:

```
src/
  types/index.ts          ← new
  lib/supabase.ts         ← replaces your existing supabase.ts
  lib/templates.ts        ← new
  hooks/useTasks.ts       ← new (replaces scattered useState in App.tsx)
  components/
    KanbanCard.tsx        ← replaces existing
    KanbanColumn.tsx      ← replaces existing
    TemplatePicker.tsx    ← new
  App.tsx                 ← replaces existing
  upgrades.css            ← add import to main.tsx (see below)
```

### 4. Add the CSS import

In your `src/main.tsx`:

```tsx
import './index.css'
import './upgrades.css'   // ← add this line
```

### 5. Wire up your existing TaskDetail component

In `src/App.tsx`, find this comment near the bottom:

```tsx
{/* <TaskDetail task={detailTask} onClose={...} onSave={editTask} onDelete={removeTask} /> */}
```

Replace it with your existing `TaskDetail` component, passing:
- `task={detailTask}` 
- `onClose={() => setDetailTask(null)}`
- `onSave={(id, updates) => editTask(id, updates)}`
- `onDelete={(id) => removeTask(id)}`

### 6. Run the app

```bash
npm run dev
```

---

## What's new at a glance

### Performance
- **React.memo** on `KanbanCard` and `KanbanColumn` - stops re-rendering all cards during drag
- **useMemo** for per-column task slices and board stats
- **useCallback** on all event handlers
- **Optimistic updates** with automatic rollback on error
- **Database indexes** on user_id, status, position, task_id

### New features
- **Board templates** - Agile Sprint, Bug Tracker, Personal To-Do, Blank
- **Team members & assignees** - avatar circles on cards, assignee picker in detail panel
- **Realtime sync** - tasks update live via Supabase Postgres changes
- **Keyboard shortcuts** - N = new task, / = search, ? = show shortcuts, Esc = close, arrow keys to drag
- **Keyboard drag-and-drop** - fully accessible via @dnd-kit KeyboardSensor

### UI
- **Light/dark theme** toggle with localStorage persistence
- **Confetti** on task completion (Done column)
- **Spring animations** on card drop
- **Slide-in animation** on detail panel
- **Column drop highlight** when dragging over
- **Responsive** mobile layout improvements
- **Touch sensor** tuned for reliable mobile drag

---

## Optional next steps

- Add `@tanstack/react-virtual` for virtual scrolling in long columns
- Add `zod` for runtime validation of Supabase responses
- Add `@tanstack/react-query` to replace the `useTasks` hook's manual fetch/cache
- Enable `strict: true` in `tsconfig.json`
