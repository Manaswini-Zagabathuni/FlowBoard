// ============================================================
// FlowBoard — Board Templates
// src/lib/templates.ts
// ============================================================

import type { BoardTemplate } from '../types';

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'agile-sprint',
    name: 'Agile Sprint',
    description: 'Classic scrum board with backlog, in-progress, review and done.',
    columns: [
      { title: 'To Do', color: '#6366F1' },
      { title: 'In Progress', color: '#F59E0B' },
      { title: 'In Review', color: '#8B5CF6' },
      { title: 'Done', color: '#10B981' },
    ],
    tasks: [
      {
        title: 'Set up project repository',
        description: 'Initialise git repo, add .gitignore, README.',
        status: 'done',
        priority: 'high',
      },
      {
        title: 'Design database schema',
        description: 'Define tables, relationships and RLS policies.',
        status: 'done',
        priority: 'high',
      },
      {
        title: 'Implement authentication',
        description: 'Anonymous sign-in via Supabase Auth.',
        status: 'in_progress',
        priority: 'high',
      },
      {
        title: 'Build drag-and-drop board',
        description: 'Use @dnd-kit to implement sortable columns.',
        status: 'in_progress',
        priority: 'normal',
      },
      {
        title: 'Add label filtering',
        description: 'Filter tasks by color labels in the board header.',
        status: 'in_review',
        priority: 'normal',
      },
      {
        title: 'Write unit tests',
        description: 'Cover hooks and utility functions with Vitest.',
        status: 'todo',
        priority: 'low',
      },
      {
        title: 'Deploy to production',
        description: 'Push to Vercel, set env vars, smoke test.',
        status: 'todo',
        priority: 'high',
      },
    ],
  },
  {
    id: 'bug-tracker',
    name: 'Bug Tracker',
    description: 'Track bugs from triage through to verified fix.',
    columns: [
      { title: 'Triage', color: '#EF4444' },
      { title: 'In Progress', color: '#F59E0B' },
      { title: 'Testing', color: '#8B5CF6' },
      { title: 'Resolved', color: '#10B981' },
    ],
    tasks: [
      {
        title: 'Login page crashes on Safari',
        description: 'Reproducible on Safari 17. Auth redirect fails.',
        status: 'todo',
        priority: 'high',
      },
      {
        title: 'Drag-and-drop broken on mobile',
        description: 'TouchSensor delay too short — cards jump on tap.',
        status: 'in_progress',
        priority: 'high',
      },
      {
        title: 'Date picker shows wrong timezone',
        description: 'Due dates appear one day off for UTC-5 users.',
        status: 'in_review',
        priority: 'normal',
      },
      {
        title: 'Label colors reset after reload',
        description: 'Hex colors not persisted correctly to Supabase.',
        status: 'todo',
        priority: 'normal',
      },
      {
        title: 'Activity log duplicates on fast edits',
        description: 'Rapid title edits create multiple log entries.',
        status: 'todo',
        priority: 'low',
      },
    ],
  },
  {
    id: 'personal-todo',
    name: 'Personal To-Do',
    description: 'Simple personal task list — inbox, today, waiting, done.',
    columns: [
      { title: 'Inbox', color: '#6366F1' },
      { title: 'Today', color: '#F59E0B' },
      { title: 'Waiting', color: '#8B5CF6' },
      { title: 'Done', color: '#10B981' },
    ],
    tasks: [
      {
        title: 'Review weekly goals',
        description: '',
        status: 'todo',
        priority: 'high',
      },
      {
        title: 'Reply to emails',
        description: '',
        status: 'in_progress',
        priority: 'normal',
      },
      {
        title: 'Waiting for invoice approval',
        description: 'Sent to finance on Monday.',
        status: 'in_review',
        priority: 'normal',
      },
      {
        title: 'Book dentist appointment',
        description: '',
        status: 'todo',
        priority: 'low',
      },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'Start from scratch with the default four columns.',
    columns: [
      { title: 'To Do', color: '#6366F1' },
      { title: 'In Progress', color: '#F59E0B' },
      { title: 'In Review', color: '#8B5CF6' },
      { title: 'Done', color: '#10B981' },
    ],
    tasks: [],
  },
];

// ── Seed helper ───────────────────────────────────────────────
// Call this once after user auth to populate their board from a template.

import { createTask } from './supabase';
import type { Status } from '../types';

export async function seedFromTemplate(template: BoardTemplate): Promise<void> {
  const tasks = template.tasks.map((t, i) => ({
    title: t.title,
    description: t.description || null,
    status: t.status as Status,
    priority: t.priority,
    due_date: null,
    position: i,
  }));

  // Insert in parallel batches of 5
  for (let i = 0; i < tasks.length; i += 5) {
    await Promise.all(tasks.slice(i, i + 5).map(createTask));
  }
}
