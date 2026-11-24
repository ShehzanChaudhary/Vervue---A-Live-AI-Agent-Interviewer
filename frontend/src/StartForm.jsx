import { useState } from "react";

export default function StartForm({ onSubmit, status }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit(new FormData(e.currentTarget));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handle}>
      <h1 className="form-title">Set up your interview</h1>
      <p className="lead small">We use this to tailor the questions to you and the role.</p>

      <div className="row">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="jd">Job description</label>
        <textarea id="jd" name="jd_text" rows="6" required placeholder="Paste the full job posting here" />
      </div>

      <div className="field">
        <label htmlFor="n">Number of questions</label>
        <input id="n" name="max_questions" type="number" defaultValue={6} min={1} max={15} className="narrow" />
      </div>

      <div className="field">
        <label>Resume</label>
        <div className={"drop" + (file ? " has-file" : "")}>
          <input name="resume" type="file" accept=".pdf,.docx" required onChange={(e) => setFile(e.target.files[0] || null)} />
          <b>{file ? file.name : "Drop your resume here or browse"}</b>
          <span>{file ? "Click to replace" : "PDF or DOCX"}</span>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
        {loading && <span className="spinner" />}
        {loading ? "Preparing your interview" : "Start interview"}
      </button>
      {loading && <p className="hint">{status || "Reading your resume and the job description. This can take a minute."}</p>}
    </form>
  );
}
