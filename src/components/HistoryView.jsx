function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionColour(action) {
  switch (action) {
    case 'Added':
      return 'var(--teal)';
    case 'Deleted':
      return 'var(--accent)';
    default:
      return 'var(--text-muted)';
  }
}

function ActionBadge({ action }) {
  return (
    <span
      className="history-action-badge"
      style={{
        color: actionColour(action),
        borderColor: actionColour(action),
      }}
    >
      {action}
    </span>
  );
}

export default function HistoryView({ history }) {
  if (history.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128221;</div>
        <h3>No history yet</h3>
        <p>Changes will appear here as you add, edit, and delete gigs.</p>
      </div>
    );
  }

  return (
    <div className="history-list">
      {history.map((entry, i) => (
        <div key={`${entry.timestamp}-${i}`} className="history-item">
          <div className="history-item-header">
            <div className="history-item-left">
              <ActionBadge action={entry.action} />
              <span className="history-band">{entry.band}</span>
            </div>
            <span className="history-time">{formatTimestamp(entry.timestamp)}</span>
          </div>
          <div className="history-item-body">
            <span className="history-summary">{entry.summary}</span>
          </div>
          <div className="history-user">{entry.user}</div>
        </div>
      ))}
    </div>
  );
}
