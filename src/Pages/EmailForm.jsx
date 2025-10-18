import React, { useState } from "react";
import axios from "axios";

export default function EmailForm() {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null); // { type: 'success'|'danger'|'info', text: '' }
  const [sending, setSending] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState("");

  const validateEmails = (text) => {
    if (!text) return false;
    const list = text.split(",").map((s) => s.trim()).filter(Boolean);
    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return list.length > 0 && list.every((e) => re.test(e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
  setResumeError("");

    if (!validateEmails(recipients)) {
      setStatus({ type: "danger", text: "Please provide one or more valid email addresses." });
      return;
    }

    if (!subject.trim()) {
      setStatus({ type: "danger", text: "Subject cannot be empty." });
      return;
    }

    setSending(true);
    const recipientList = recipients.split(",").map((email) => email.trim());

    try {
      // Always send FormData with keys: recipients, subject, message; append file under 'file' if present
      const form = new FormData();
      // append recipients as the raw string (comma-separated) per requested format
      form.append("recipients", recipients);
      form.append("subject", subject);
      form.append("message", message); // HTML from editor or plain text
      if (resumeFile) form.append("file", resumeFile, resumeFile.name);
        const backendUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8080';
      const res = await axios.post(`${backendUrl}/api/email/send`, form, {
        // allow axios to set Content-Type with boundary automatically
      });
      console.log(res.data)
      const text = res && res.data && (res.data.message || JSON.stringify(res.data)) || "Emails sent";
      setStatus({ type: "success", text });
    } catch (err) {
      const errText = err?.response?.data?.message || err.message || "Error sending emails";
      setStatus({ type: "danger", text: errText });
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    setResumeError("");
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (!allowed.includes(file.type)) {
      setResumeError("Only PDF or DOC/DOCX files are allowed.");
      setResumeFile(null);
      return;
    }

    if (file.size > maxBytes) {
      setResumeError("File is too large. Max 5MB allowed.");
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-3">Send Bulk Email</h3>

              {status && (
                <div className={`alert alert-${status.type}`} role="alert">
                  {status.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Recipients</label>
                  <textarea
                    className={`form-control ${recipients && !validateEmails(recipients) ? 'is-invalid' : ''}`}
                    rows="3"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    aria-describedby="recipientsHelp"
                  />
                  <div id="recipientsHelp" className="form-text">
                    Enter comma-separated email addresses.
                  </div>
                  <div className="invalid-feedback">One or more email addresses are invalid.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows="6"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here (optional)"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Resume (optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                  />
                  {resumeError && <div className="text-danger mt-1">{resumeError}</div>}
                  {resumeFile && (
                    <div className="mt-2">
                      <strong>Selected:</strong> {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)
                      <button type="button" className="btn btn-link btn-sm ms-2" onClick={() => setResumeFile(null)}>Remove</button>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <button className="btn btn-primary" type="submit" disabled={sending}>
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </button>

                  <small className="text-muted">Server: localhost:8080</small>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
