import { useState } from 'react';
import { Comment } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';

interface CommentSectionProps {
  comments: Comment[];
  loading: boolean;
  onAdd: (content: string) => void;
}

export function CommentSection({ comments, loading, onAdd }: CommentSectionProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <div className="detail-section">
      <div className="detail-section-title">
        <MessageSquare size={12} /> Comments ({comments.length})
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
      ) : (
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-meta">
                <div className="comment-avatar">U</div>
                <span className="comment-ts">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="comment-content">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="comment-form">
        <textarea
          placeholder="Write a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={!text.trim()}>
            <Send size={12} /> Post
          </button>
        </div>
      </div>
    </div>
  );
}
