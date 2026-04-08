import { Search, LayoutGrid } from 'lucide-react';
import { Task, Label, Priority } from '../../types';
import { isAfter, startOfDay } from 'date-fns';

interface HeaderProps {
  tasks: Task[];
  labels: Label[];
  search: string;
  onSearchChange: (v: string) => void;
  filterPriority: string;
  onFilterPriority: (v: string) => void;
  filterLabel: string;
  onFilterLabel: (v: string) => void;
}

export function Header({
  tasks, labels, search, onSearchChange,
  filterPriority, onFilterPriority, filterLabel, onFilterLabel,
}: HeaderProps) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const today = startOfDay(new Date());
  const overdue = tasks.filter(t =>
    t.due_date && t.status !== 'done' && isAfter(today, new Date(t.due_date))
  ).length;

  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">
          <LayoutGrid size={16} />
        </div>
        <span className="header-logo-name">Flow<span>Board</span></span>
      </div>

      <div className="header-divider" />

      <div className="header-search">
        <Search size={14} className="header-search-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="header-filters">
        <select
          className="filter-select"
          value={filterPriority}
          onChange={e => onFilterPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select
          className="filter-select"
          value={filterLabel}
          onChange={e => onFilterLabel(e.target.value)}
        >
          <option value="">All labels</option>
          {labels.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="header-stats">
        <span className="stat-chip">{total} tasks</span>
        <span className="stat-chip done">✓ {done} done</span>
        {overdue > 0 && (
          <span className="stat-chip overdue">⚠ {overdue} overdue</span>
        )}
      </div>
    </header>
  );
}
