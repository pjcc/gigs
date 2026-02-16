function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(price) {
  if (price == null || price === '') return '-';
  return `\u00A3${Number(price).toFixed(2)}`;
}

function PeopleTags({ names, className }) {
  if (!names || names.length === 0) return <span style={{ color: 'var(--text-light)' }}>-</span>;
  return (
    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
      {names.map((n) => (
        <span key={n} className={`person-tag ${className || ''}`}>
          {n}
        </span>
      ))}
    </div>
  );
}

function GigRow({ gig, past, onEdit, onDelete }) {
  return (
    <tr className={past ? 'past' : ''}>
      <td className="band-cell">{gig.band}</td>
      <td>{gig.location}</td>
      <td>{formatDate(gig.date)}</td>
      <td>{formatPrice(gig.price)}</td>
      <td><PeopleTags names={gig.interested} className="interested" /></td>
      <td><PeopleTags names={gig.ticketsBought} className="ticket" /></td>
      <td style={{ maxWidth: '140px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {gig.notes || '-'}
      </td>
      <td>
        {gig.link ? (
          <a
            href={gig.link}
            target="_blank"
            rel="noopener noreferrer"
            className="gig-link"
            style={{ marginTop: 0 }}
          >
            Link
          </a>
        ) : (
          '-'
        )}
      </td>
      <td className="actions-cell">
        <button className="btn-icon" onClick={() => onEdit(gig)} title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className="btn-icon" onClick={() => onDelete(gig)} title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export default function GigTable({ upcoming, past, onEdit, onDelete }) {
  const all = [...upcoming, ...past];

  return (
    <div className="gig-table-wrap">
      <table className="gig-table">
        <thead>
          <tr>
            <th>Band</th>
            <th>Venue</th>
            <th>Date</th>
            <th>Price</th>
            <th>Interested</th>
            <th>Bought</th>
            <th>Notes</th>
            <th>Link</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {all.map((gig) => (
            <GigRow
              key={`${gig.rowIndex}-${gig.band}`}
              gig={gig}
              past={!upcoming.includes(gig)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
