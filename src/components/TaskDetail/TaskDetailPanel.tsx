import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { X, Trash2, Tag, Plus } from 'lucide-react';
import { Task, Label, Priority, Status, COLUMNS, PRIORITY_CONFIG, LABEL_COLORS } from '../../types';
import { useComments } from '../../hooks/useComments';
import { useActivityLog } from '../../hooks/useActivityLog';
import { CommentSection } from './CommentSection';
import { ActivityLogPanel } from './ActivityLog';

interface TaskDetailPanelProps {
  task: Task;
  user: User;
  labels: Label[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task> & { labelIds?: string[] }) => void;
  onDelete: (id: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | undefined>;
  logActivity: (taskId: string, action: string, from?: string, to?: string) => void;
}

export function TaskDetailPanel({
  task, user, labels, onClose, onUpdate, onDelete, onCreateLabel, logActivity
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<Status>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels?.map(l => l.id) ?? []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[2]);
  const [showNewLabel, setShowNewLabel] = useState(false);
  const labelPickerRef = useRef<HTMLDivElement>(null);

  const { comments, loading: commentsLoading, addComment } = useComments(user, task.id);
  const { logs } = useActivityLog(user, task.id);

  // Save on blur/change helpers
  const saveTitle = () => {
    if (title.trim() && title !== task.title) {
      onUpdate(task.id, { title: title.trim() });
      logActivity(task.id, 'title_changed', task.title, title.trim());
    }
  };

  const saveDescription = () => {
    if (description !== (task.description ?? '')) {
      onUpdate(task.id, { description });
      logActivity(task.id, 'description_changed');
    }
  };

  const handlePriorityChange = (val: Priority) => {
    setPriority(val);
    logActivity(task.id, 'priority_changed', task.priority, val);
    onUpdate(task.id, { priority: val });
  };

  const handleStatusChange = (val: Status) => {
    const old = status;
    setStatus(val);
    logActivity(task.id, 'status_changed', old, val);
    onUpdate(task.id, { status: val });
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    onUpdate(task.id, { due_date: val || null });
  };

  const toggleLabel = (id: string) => {
    const next = selectedLabels.includes(id)
      ? selectedLabels.filter(x => x !== id)
      : [...selectedLabels, id];
    setSelectedLabels(next);
    onUpdate(task.id, { labelIds: next });
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const label = await onCreateLabel(newLabelName.trim(), newLabelColor);
    if (label) {
      const next = [...selectedLabels, label.id];
      setSelectedLabels(next);
      onUpdate(task.id, { labelIds: next });
      setNewLabelName('');
      setShowNewLabel(false);
    }
  };

  // Close label picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (labelPickerRef.current && !labelPickerRef.current.contains(e.target as Node)) {
        setShowLabelPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabelObjs = labels.filter(l => selectedLabels.includes(l.id));

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <div className="detail-header">
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
          <span style={{ flex: 1 }} />
          <button className="btn btn-danger btn-sm" onClick={() => { onDelete(task.id); onClose(); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>

        <div className="detail-body">
          {/* Title */}
          <input
            className="detail-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />

          {/* Meta grid */}
          <div className="detail-meta-grid">
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={e => handleStatusChange(e.target.value as Status)}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={priority} onChange={e => handlePriorityChange(e.target.value as Priority)}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={e => handleDueDateChange(e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div className="field">
            <label>Description</label>
            <textarea
              placeholder="Add a description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={4}
            />
          </div>

          {/* Labels */}
          <div className="detail-section">
            <div className="detail-section-title"><Tag size={12} /> Labels</div>
            <div className="labels-container" style={{ position: 'relative' }} ref={labelPickerRef}>
              {selectedLabelObjs.map(l => (
                <span
                  key={l.id}
                  className="label-chip-removable"
                  style={{ background: l.color + 'cc' }}
                >
                  {l.name}
                  <button onClick={() => toggleLabel(l.id)}><X size={10} /></button>
                </span>
              ))}
              <button className="label-add-btn" onClick={() => setShowLabelPicker(v => !v)}>
                <Plus size={10} /> Add label
              </button>

              {showLabelPicker && (
                <div className="label-picker-popup" style={{ top: '100%', left: 0, marginTop: 4 }}>
                  {labels.map(l => (
                    <div key={l.id} className="label-picker-item" onClick={() => toggleLabel(l.id)}>
                      <input type="checkbox" checked={selectedLabels.includes(l.id)} onChange={() => {}} />
                      <span className="label-picker-swatch" style={{ background: l.color }} />
                      <span style={{ fontSize: 13 }}>{l.name}</span>
                    </div>
                  ))}
                  <div className="label-new-row">
                    {showNewLabel ? (
                      <>
                        <input
                          type="text"
                          placeholder="Name"
                          value={newLabelName}
                          onChange={e => setNewLabelName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCreateLabel()}
                          style={{ flex: 1, fontSize: 12, padding: '4px 8px' }}
                        />
                        <input type="color" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} />
                        <button className="btn btn-primary btn-sm" onClick={handleCreateLabel}>+</button>
                      </>
                    ) : (
                      <button className="label-add-btn" style={{ width: '100%' }} onClick={() => setShowNewLabel(true)}>
                        + New label
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="divider" />

          {/* Comments */}
          <CommentSection comments={comments} loading={commentsLoading} onAdd={addComment} />

          <div className="divider" />

          {/* Activity */}
          <ActivityLogPanel logs={logs} />
        </div>
      </div>
    </>
  );
}
