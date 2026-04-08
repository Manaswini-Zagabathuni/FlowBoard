import { useState } from 'react';
import { X } from 'lucide-react';
import { Status, Priority, Label, COLUMNS, LABEL_COLORS } from '../../types';

interface CreateTaskModalProps {
  defaultStatus: Status;
  labels: Label[];
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    priority: Priority;
    due_date: string;
    status: Status;
    labelIds: string[];
  }) => void;
  onCreateLabel: (name: string, color: string) => Promise<Label | undefined>;
}

export function CreateTaskModal({ defaultStatus, labels, onClose, onCreate, onCreateLabel }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onCreate({ title: title.trim(), description, priority, due_date: dueDate, status, labelIds: selectedLabels });
    onClose();
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    const label = await onCreateLabel(newLabelName.trim(), newLabelColor);
    if (label) {
      setSelectedLabels(prev => [...prev, label.id]);
      setNewLabelName('');
      setShowLabelForm(false);
    }
  };

  const toggleLabel = (id: string) => {
    setSelectedLabels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Task</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Title *</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              placeholder="Add more details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Status)}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="field">
            <label>Labels</label>
            <div className="labels-container" style={{ marginBottom: 8 }}>
              {labels.map(l => (
                <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 13, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(l.id)}
                    onChange={() => toggleLabel(l.id)}
                    style={{ width: 'auto' }}
                  />
                  <span className="label-chip" style={{ background: l.color + 'cc' }}>{l.name}</span>
                </label>
              ))}
            </div>

            {showLabelForm ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Label name"
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateLabel()}
                  style={{ flex: 1 }}
                />
                <input type="color" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} />
                <button className="btn btn-primary btn-sm" onClick={handleCreateLabel}>Add</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowLabelForm(false)}>Cancel</button>
              </div>
            ) : (
              <button className="label-add-btn" onClick={() => setShowLabelForm(true)}>
                + New label
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!title.trim() || submitting}>
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
