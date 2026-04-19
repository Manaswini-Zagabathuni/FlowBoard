// ============================================================
// FlowBoard — TemplatePicker modal
// src/components/TemplatePicker.tsx
// ============================================================

import { useCallback } from 'react';
import { X, LayoutTemplate, Bug, CheckSquare, Plus } from 'lucide-react';
import { BOARD_TEMPLATES } from '../lib/templates';
import type { BoardTemplate } from '../types';

const ICONS: Record<string, React.ReactNode> = {
  'agile-sprint':  <LayoutTemplate size={22} />,
  'bug-tracker':   <Bug size={22} />,
  'personal-todo': <CheckSquare size={22} />,
  blank:           <Plus size={22} />,
};

interface TemplatePickerProps {
  onSelect: (template: BoardTemplate) => Promise<void>;
  onClose: () => void;
}

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const handleSelect = useCallback(
    async (template: BoardTemplate) => {
      await onSelect(template);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a board template"
    >
      <div className="modal template-modal">
        <div className="modal-header">
          <h2>Choose a template</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="modal-sub">
          Start with a pre-filled board or create a blank one.
        </p>

        <div className="template-grid">
          {BOARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="template-card"
              onClick={() => handleSelect(t)}
            >
              <span className="template-icon">{ICONS[t.id]}</span>
              <span className="template-name">{t.name}</span>
              <span className="template-desc">{t.description}</span>
              {t.tasks.length > 0 && (
                <span className="template-count">
                  {t.tasks.length} sample tasks
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import type React from 'react';
