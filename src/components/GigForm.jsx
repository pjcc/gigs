import { useState } from 'react';
import PersonSelector from './PersonSelector.jsx';

const EMPTY_GIG = {
  band: '',
  location: '',
  price: '',
  date: '',
  interested: [],
  ticketsBought: [],
  notes: '',
  link: '',
};

export default function GigForm({ gig, people, onSubmit, onCancel, onAddPerson }) {
  const isEdit = !!gig;
  const [form, setForm] = useState(() => {
    if (gig) {
      return {
        ...gig,
        band: String(gig.band || ''),
        location: String(gig.location || ''),
        price: gig.price != null ? String(gig.price) : '',
        date: String(gig.date || ''),
        interested: Array.isArray(gig.interested) ? gig.interested : [],
        ticketsBought: Array.isArray(gig.ticketsBought) ? gig.ticketsBought : [],
        notes: String(gig.notes || ''),
        link: String(gig.link || ''),
      };
    }
    return { ...EMPTY_GIG };
  });
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.band.trim() || !form.location.trim() || !form.date) return;

    setSubmitting(true);
    const payload = {
      ...form,
      price: form.price !== '' ? parseFloat(form.price) : null,
    };
    await onSubmit(payload);
    setSubmitting(false);
  }

  const isValid = form.band.trim() && form.location.trim() && form.date;

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">
            Band / Artist <span className="required">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            value={form.band}
            onChange={(e) => update('band', e.target.value)}
            placeholder="e.g. Battlesnake"
            autoFocus
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Venue <span className="required">*</span>
            </label>
            <input
              className="form-input"
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Sticky Mike's"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Date <span className="required">*</span>
            </label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price</label>
            <div className="form-input-prefix">
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Event Link</label>
            <input
              className="form-input"
              type="url"
              value={form.link}
              onChange={(e) => update('link', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Interested</label>
          <PersonSelector
            people={people}
            selected={form.interested}
            onChange={(val) => update('interested', val)}
            onAddPerson={onAddPerson}
            variant="interested"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tickets Bought</label>
          <PersonSelector
            people={people}
            selected={form.ticketsBought}
            onChange={(val) => update('ticketsBought', val)}
            onAddPerson={onAddPerson}
            variant="tickets"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any extra notes..."
          />
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid || submitting}
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Gig' : 'Add Gig'}
        </button>
      </div>
    </form>
  );
}
