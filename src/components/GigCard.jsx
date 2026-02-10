function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(price) {
  if (price == null || price === '') return null;
  return `\u00A3${Number(price).toFixed(2)}`;
}

export default function GigCard({ gig, past, onEdit, onDelete }) {
  const hasInterested = gig.interested.length > 0;
  const hasTickets = gig.ticketsBought.length > 0;
  const hasNotes = gig.notes && gig.notes.trim();
  const hasLink = gig.link && gig.link.trim();
  const price = formatPrice(gig.price);

  return (
    <div className={`gig-card${past ? ' past' : ''}`}>
      {/* Row 1: Band name + actions */}
      <div className="gig-card-header">
        <div className="gig-band">{gig.band}</div>
        <div className="gig-card-actions">
          <button className="btn-icon" onClick={onEdit} title="Edit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="btn-icon" onClick={onDelete} title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Meta left, price/link right */}
      <div className="gig-card-middle">
        <div className="gig-meta">
          <span className="gig-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {gig.location}
          </span>
          <span className="gig-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(gig.date)}
          </span>
        </div>
        <div className="gig-card-middle-right">
          {price && <span className="gig-price">{price}</span>}
          {hasLink && (
            <a
              className="gig-link"
              href={gig.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Link
            </a>
          )}
        </div>
      </div>

      {/* Row 3: Interested left, Tickets right */}
      {(hasInterested || hasTickets) && (
        <div className="gig-card-people-row">
          <div className="gig-card-people-left">
            {hasInterested && (
              <div className="gig-people-group">
                <span className="gig-people-label">Interested</span>
                <div className="gig-people-list">
                  {gig.interested.map((p) => (
                    <span key={p} className="person-tag interested">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="gig-card-people-right">
            {hasTickets && (
              <div className="gig-people-group">
                <span className="gig-people-label">Tickets</span>
                <div className="gig-people-list">
                  {gig.ticketsBought.map((p) => (
                    <span key={p} className="person-tag ticket">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {hasNotes && <div className="gig-notes">{gig.notes}</div>}
    </div>
  );
}
