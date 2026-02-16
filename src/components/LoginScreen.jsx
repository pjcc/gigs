import { useState } from "react";

export default function LoginScreen({ onLogin, error }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !password) return;
    setSubmitting(true);
    await onLogin(name.trim(), password);
    setSubmitting(false);
  }

  return (
    <div className="auth-screen">
      <h1>Gigsheet max</h1>
      <p>Track upcoming gigs, who's interested, and who's bought tickets.</p>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input
            className="form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Piers"
            autoFocus
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim() || !password || submitting}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {submitting ? "Checking..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
