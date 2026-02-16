import { useState } from "react";
import GigCard from "./GigCard.jsx";
import GigTable from "./GigTable.jsx";

function isUpcoming(dateStr) {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gig = new Date(dateStr);
  return gig >= today;
}

function sortByDate(gigs) {
  return [...gigs].sort((a, b) => {
    const da = a.date ? new Date(a.date) : new Date(0);
    const db = b.date ? new Date(b.date) : new Date(0);
    return da - db;
  });
}

export default function GigList({ gigs, view, onEdit, onDelete, onAdd, changedGigs }) {
  const [pastOpen, setPastOpen] = useState(false);

  if (gigs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#127926;</div>
        <h3>No gigs yet</h3>
        <p>Add your first gig to start tracking.</p>
        <button className="btn btn-primary" onClick={onAdd}>
          + Add Gig
        </button>
      </div>
    );
  }

  const sorted = sortByDate(gigs);
  const upcoming = sorted.filter((g) => isUpcoming(g.date));
  const past = sorted.filter((g) => !isUpcoming(g.date)).reverse();

  if (view === "table") {
    return <GigTable upcoming={upcoming} past={past} onEdit={onEdit} onDelete={onDelete} />;
  }

  return (
    <div>
      {upcoming.length > 0 && (
        <section className="gig-section">
          <h2 className="gig-section-title">
            Upcoming <span className="count">{upcoming.length}</span>
          </h2>
          <div className="gig-grid">
            {upcoming.map((gig) => (
              <GigCard
                key={`${gig.rowIndex}-${gig.band}`}
                gig={gig}
                past={false}
                changeType={changedGigs[gig.band] || null}
                onEdit={() => onEdit(gig)}
                onDelete={() => onDelete(gig)}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="gig-section">
          <h2 className="gig-section-title gig-section-toggle" onClick={() => setPastOpen(!pastOpen)}>
            <span className={`toggle-arrow${pastOpen ? " open" : ""}`}>&#9654;</span>
            Past <span className="count">{past.length}</span>
          </h2>
          {pastOpen && (
            <div className="gig-grid">
              {past.map((gig) => (
                <GigCard
                  key={`${gig.rowIndex}-${gig.band}`}
                  gig={gig}
                  past={true}
                  changeType={changedGigs[gig.band] || null}
                  onEdit={() => onEdit(gig)}
                  onDelete={() => onDelete(gig)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
