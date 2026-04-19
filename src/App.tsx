// ============================================================
// FlowBoard — App.tsx (upgraded)
// src/App.tsx
//
// Key changes vs original:
//  • useTasks hook replaces scattered useState/useEffect
//  • KeyboardSensor added for accessible drag-and-drop
//  • TouchSensor tuned for mobile
//  • TemplatePicker shown to new users
//  • Global keyboard shortcuts: N = new task, / = search, ? = shortcuts
//  • Theme toggle (light/dark) persisted to localStorage
// ============================================================

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase, signInAnonymously, getSession } from './lib/supabase';
import { useTasks } from './hooks/useTasks';
import { KanbanColumn } from './components/KanbanColumn';
import { KanbanCard } from './components/KanbanCard';
import { TemplatePicker } from './components/TemplatePicker';
import { seedFromTemplate } from './lib/templates';
import type { Task, Status, BoardTemplate } from './types';

const STATUSES: Status[] = ['todo', 'in_progress', 'in_review', 'done'];

// ── Theme ─────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('fb-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fb-theme', theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );
  return { theme, toggle };
}

// ── Search / filter state ─────────────────────────────────────
function useFilters() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  return { search, setSearch, priorityFilter, setPriorityFilter, labelFilter, setLabelFilter };
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { theme, toggle: toggleTheme } = useTheme();
  const filters = useFilters();
  const {
    tasks,
    tasksByStatus,
    stats,
    loading,
    error,
    isOverdue,
    isDueSoon,
    addTask,
    editTask,
    removeTask,
    reorderTasks,
  } = useTasks();

  // ── Auth ───────────────────────────────────────────────────
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setAuthed(true);
      } else {
        signInAnonymously().then(() => {
          setAuthed(true);
          setShowTemplate(true); // first-time user → show template picker
        });
      }
    });
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

      if (!typing && e.key === 'n') {
        e.preventDefault();
        handleAddTask('todo');
      }
      if (!typing && e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === '?' && !e.shiftKey) {
        setShowShortcuts((s) => !s);
      }
      if (e.key === 'Escape') {
        setDetailTask(null);
        setShowShortcuts(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── DnD sensors ────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Filtered tasks per column ──────────────────────────────
  const filteredByStatus = useMemo(() => {
    const filterFn = (t: Task) => {
      if (
        filters.search &&
        !t.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (
        filters.priorityFilter !== 'all' &&
        t.priority !== filters.priorityFilter
      )
        return false;
      if (filters.labelFilter !== 'all') {
        if (!(t.labels ?? []).some((l) => l.id === filters.labelFilter))
          return false;
      }
      return true;
    };

    return Object.fromEntries(
      STATUSES.map((s) => [s, (tasksByStatus[s] ?? []).filter(filterFn)])
    ) as Record<Status, Task[]>;
  }, [tasksByStatus, filters.search, filters.priorityFilter, filters.labelFilter]);

  // ── Drag handlers ──────────────────────────────────────────
  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
    },
    [tasks]
  );

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return;
      const activeTask = tasks.find((t) => t.id === active.id);
      const overStatus = STATUSES.includes(over.id as Status)
        ? (over.id as Status)
        : tasks.find((t) => t.id === over.id)?.status;
      if (activeTask && overStatus && activeTask.status !== overStatus) {
        // Optimistic cross-column move — will be confirmed on DragEnd
        editTask(activeTask.id, { status: overStatus });
      }
    },
    [tasks, editTask]
  );

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveTask(null);
      if (!over || active.id === over.id) return;

      const activeTask = tasks.find((t) => t.id === active.id);
      if (!activeTask) return;

      const overStatus = STATUSES.includes(over.id as Status)
        ? (over.id as Status)
        : tasks.find((t) => t.id === over.id)?.status ?? activeTask.status;

      const columnTasks = tasksByStatus[overStatus] ?? [];
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);

      const reordered =
        oldIndex !== -1 && newIndex !== -1
          ? arrayMove(columnTasks, oldIndex, newIndex)
          : columnTasks;

      const updates = reordered.map((t, i) => ({
        id: t.id,
        position: i,
        status: overStatus,
      }));

      // Also include the moved task if it wasn't already in the column
      if (!updates.find((u) => u.id === activeTask.id)) {
        updates.push({
          id: activeTask.id,
          position: reordered.length,
          status: overStatus,
        });
      }

      await reorderTasks(updates);

      if (activeTask.status !== overStatus) {
        await editTask(activeTask.id, { status: overStatus }, {
          action: 'status_changed',
          from_value: activeTask.status,
          to_value: overStatus,
        });
      }
    },
    [tasks, tasksByStatus, reorderTasks, editTask]
  );

  // ── Add task shortcut ──────────────────────────────────────
  const handleAddTask = useCallback(
    async (status: Status) => {
      const title = window.prompt(`New task in "${status.replace('_', ' ')}":`);
      if (!title?.trim()) return;
      const pos = (tasksByStatus[status] ?? []).length;
      await addTask({ title: title.trim(), description: null, status, priority: 'normal', due_date: null, position: pos });
    },
    [addTask, tasksByStatus]
  );

  // ── Template selection ─────────────────────────────────────
  const handleTemplateSelect = useCallback(
    async (template: BoardTemplate) => {
      await seedFromTemplate(template);
    },
    []
  );

  // ── Render ─────────────────────────────────────────────────
  if (!authed || loading) {
    return (
      <div className="loading-screen" role="status" aria-label="Loading FlowBoard">
        <div className="spinner" />
        <p>Loading FlowBoard…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Board header */}
      <header className="board-header">
        <div className="header-left">
          <h1 className="logo">FlowBoard</h1>
          <div className="stats-row">
            <span className="stat">{stats.total} tasks</span>
            <span className="stat stat-done">{stats.done} done</span>
            {stats.overdue > 0 && (
              <span className="stat stat-overdue">{stats.overdue} overdue</span>
            )}
          </div>
        </div>

        <div className="header-right">
          {/* Search */}
          <input
            ref={searchRef}
            className="search-input"
            type="search"
            placeholder="Search tasks… (/)"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            aria-label="Search tasks"
          />

          {/* Priority filter */}
          <select
            className="filter-select"
            value={filters.priorityFilter}
            onChange={(e) => filters.setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Theme toggle */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Keyboard shortcuts hint */}
          <button
            className="icon-btn"
            onClick={() => setShowShortcuts((s) => !s)}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ⌨️
          </button>
        </div>
      </header>

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div className="shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
          <h3>Keyboard shortcuts</h3>
          <table>
            <tbody>
              <tr><td><kbd>N</kbd></td><td>New task in To Do</td></tr>
              <tr><td><kbd>/</kbd></td><td>Focus search</td></tr>
              <tr><td><kbd>?</kbd></td><td>Toggle shortcuts</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>Close panel</td></tr>
              <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Open focused task</td></tr>
              <tr><td><kbd>↑↓←→</kbd></td><td>Move task (keyboard drag)</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Kanban board */}
      <main className="board">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={filteredByStatus[status] ?? []}
              assigneeMap={new Map()} // wire up from useAssignees hook
              commentCountMap={new Map()} // wire up from useCommentCounts hook
              overdueFn={isOverdue}
              dueSoonFn={isDueSoon}
              onAddTask={handleAddTask}
              onOpenTask={setDetailTask}
            />
          ))}

          {/* Floating drag overlay */}
          <DragOverlay>
            {activeTask ? (
              <KanbanCard
                task={activeTask}
                isOverdue={isOverdue(activeTask)}
                isDueSoon={isDueSoon(activeTask)}
                onOpen={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Template picker (first-time users) */}
      {showTemplate && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplate(false)}
        />
      )}

      {/* Task detail panel — plug in your existing TaskDetail component here */}
      {detailTask && (
        <aside className="detail-panel" aria-label="Task details">
          {/* <TaskDetail task={detailTask} onClose={() => setDetailTask(null)} onSave={editTask} onDelete={removeTask} /> */}
          <p style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
            Plug your existing TaskDetail component here and pass{' '}
            <code>detailTask</code>, <code>editTask</code>, and{' '}
            <code>removeTask</code>.
          </p>
          <button onClick={() => setDetailTask(null)}>Close</button>
        </aside>
      )}
    </div>
  );
}
