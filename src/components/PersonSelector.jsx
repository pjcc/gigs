import { useState } from 'react';

export default function PersonSelector({
  people,
  selected,
  onChange,
  onAddPerson,
  variant = 'interested', // 'interested' or 'tickets'
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  function remove(name) {
    onChange(selected.filter((n) => n !== name));
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    // Optimistic: update UI immediately
    if (!people.includes(trimmed)) {
      onAddPerson(trimmed); // fire and forget
    }
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setNewName('');
  }

  function handleAddKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  const tagClass = variant === 'tickets' ? 'tickets' : 'interested';

  return (
    <div className="person-selector">
      <div
        className={`person-selector-selected${selected.length === 0 ? ' empty' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 ? (
          'Click to select people...'
        ) : (
          selected.map((name) => (
            <span key={name} className={`person-selector-tag ${tagClass}`}>
              {name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  remove(name);
                }}
              >
                &times;
              </button>
            </span>
          ))
        )}
      </div>

      {open && (
        <div className="person-selector-dropdown">
          {people.map((name) => (
            <label key={name} className="person-option">
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggle(name)}
              />
              {name}
            </label>
          ))}

          {people.length === 0 && (
            <div style={{ padding: '6px 10px', fontSize: '0.82rem', color: 'var(--text-light)' }}>
              No people yet. Add one below.
            </div>
          )}

          <div className="person-add">
            <input
              type="text"
              placeholder="New person..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleAddKeyDown}
            />
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleAdd}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
