// src/App.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TicketsPage from './TicketsPage';

/**
 * axios instance that respects REACT_APP_API_URL.
 */
const API_BASE = (() => {
  const raw = process.env.REACT_APP_API_URL?.trim();
  if (raw && raw.length > 0) {
    return `${raw.replace(/\/$/, '')}/api`;
  }
  return '/api';
})();

const api = axios.create({ baseURL: API_BASE });

/* ---------- constants kept (only those used on this form) ---------- */
const subCategories = {
  Network: [
    "Router Failure",
    "Switch Failure",
    "Network Latency",
    "Packet Loss",
    "ISP Outage",
    "Fiber Cut",
    "DNS Issue",
    "Bandwidth Saturation"
  ],
  Server: ["CPU/Memory Overload", "Hardware Fault", "OS Crash"],
  Storage: ["Disk Failure", "RAID Degraded", "Capacity Alert"],
  Power: ["Power Outage", "UPS Failure", "Generator Issue"],
  Cooling: ["Cooling Unit Failure", "Temperature Alert"],
  Security: ["Security Breach", "Access Control Failure", "Surveillance Offline"],
  "Access Control": ["Badge Reader Failure", "Door Lock Failure"],
  Application: ["Software Bug", "Service Crash", "Performance Degradation"],
  Database: ["Database Error", "Connection Timeout", "Data Corruption"]
};

const priorityOptions = [
  { value: "P0", label: "P0 - Catastrophic" },
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];

const buildingOptions = [
  { value: 'LOS1', label: 'LOS1' },
  { value: 'LOS2', label: 'LOS2' },
  { value: 'LOS3', label: 'LOS3' },
  { value: 'LOS4', label: 'LOS4' },
  { value: 'LOS5', label: 'LOS5' },
];

const detectedByOptions = [
  { value: "", label: "-- Select --" },
  { value: "Monitoring Tool", label: "Monitoring Tool" },
  { value: "Customer Report", label: "Customer Report" },
  { value: "Engineer Observation", label: "Engineer Observation" },
  { value: "Automated Alert", label: "Automated Alert" },
  { value: "Other", label: "Other" },
];

const categoryOptions = Object.keys(subCategories).map(cat => ({ value: cat, label: cat }));

const subOptionFromValue = (val) => (val ? { value: val, label: val } : null);
const isoToLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toOption = (val) => (val ? { value: val, label: String(val) } : null);

/* ---------- component (grouped UI, preserved styles & behavior) ---------- */
function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // theme state (persisted)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  // form state: only fields that remain on this page
  const [form, setForm] = useState({
    category: null,
    sub_category: '',
    opened: '',
    reported_by: '',
    contact_info: '',
    priority: null,
    building: '',
    location: '',
    impacted: '',
    description: '',
    detectedBy: null,
    detectedByOther: '',
    time_detected: '',
    root_cause: '',
    actions_taken: '',
  });

  // editing support (ticket passed in navigation state)
  const ticketToEdit = location?.state?.ticketToEdit ?? null;
  const isEditing = Boolean(ticketToEdit);

  const [statusMsg, setStatusMsg] = useState(null); // {type,text}
  const [submitting, setSubmitting] = useState(false);

  // populate when editing
  useEffect(() => {
    if (isEditing && ticketToEdit) {
      const t = ticketToEdit;
      setForm({
        category: t.category ? toOption(t.category) : null,
        sub_category: t.sub_category ?? '',
        opened: isoToLocalDatetime(t.opened) || (t.opened ?? ''),
        reported_by: t.reported_by ?? '',
        contact_info: t.contact_info ?? '',
        priority: t.priority ? toOption(t.priority) : null,
        building: t.building ?? '',
        location: t.location ?? '',
        impacted: t.impacted ?? '',
        description: t.description ?? '',
        detectedBy: t.detectedBy ? toOption(t.detectedBy) : null,
        detectedByOther: t.detectedByOther ?? '',
        time_detected: isoToLocalDatetime(t.time_detected) || (t.time_detected ?? ''),
        root_cause: t.root_cause ?? '',
        actions_taken: t.actions_taken ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // handlers
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }));
    else if (type === 'file') setForm(f => ({ ...f, [name]: files }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleCategoryChange = (selected) => setForm(f => ({ ...f, category: selected, sub_category: '' }));
  const handlePriorityChange = (selected) => setForm(f => ({ ...f, priority: selected }));
  const handleBuildingChange = (selected) => setForm(f => ({ ...f, building: selected ? selected.value : '' }));
  const handleDetectedByChange = (selected) => {
    setForm(f => ({ ...f, detectedBy: selected }));
    if (!selected || selected.value !== 'Other') setForm(f => ({ ...f, detectedByOther: '' }));
  };
  const handleSubCategorySelectChange = (selected) => setForm(f => ({ ...f, sub_category: selected ? selected.value : '' }));

  const dtToISO = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setSubmitting(true);

    // normalize payload
    const output = { ...form };
    output.category = output.category?.value || '';
    output.priority = output.priority?.value || '';
    output.building = output.building || '';
    output.detectedBy = output.detectedBy?.value || '';
    if (output.detectedBy === 'Other') output.detectedBy = output.detectedByOther;

    output.opened = dtToISO(output.opened);
    output.time_detected = dtToISO(output.time_detected);

    try {
      let res;
      if (isEditing) {
        const identifier = ticketToEdit.id ?? ticketToEdit.ticket_id ?? ticketToEdit.id;
        res = await api.put(`/tickets/${identifier}`, output, { headers: { 'Content-Type': 'application/json' } });
      } else {
        res = await api.post('/tickets', output, { headers: { 'Content-Type': 'application/json' } });
      }

      setStatusMsg({ type: 'success', text: isEditing ? 'Ticket updated successfully!' : 'Ticket created successfully!' });

      if (isEditing) {
        navigate('/ticketspage');
        return;
      }

      // reset to initial
      setForm({
        category: null,
        sub_category: '',
        opened: '',
        reported_by: '',
        contact_info: '',
        priority: null,
        building: '',
        location: '',
        impacted: '',
        description: '',
        detectedBy: null,
        detectedByOther: '',
        time_detected: '',
        root_cause: '',
        actions_taken: '',
      });

    } catch (err) {
      let msg = 'Unknown error';
      if (err?.response?.data) msg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || JSON.stringify(err.response.data));
      else if (err.message) msg = err.message;
      setStatusMsg({ type: 'error', text: `Error submitting ticket: ${msg}` });
    } finally {
      setSubmitting(false);
    }
  };

  const getSubCategoryOptions = () => {
    const catKey = form.category?.value;
    if (!catKey) return [];
    return (subCategories[catKey] || []).map(s => ({ value: s, label: s }));
  };

  // styling for squares (keeps look simple and matches previous aesthetic)
  const outerSquareStyle = { border: '2px solid #e6e6e6', padding: 18, borderRadius: 10, background: '#fafafa' };
  const innerSquareStyle = { border: '1px solid #ddd', padding: 14, borderRadius: 8, marginBottom: 16, background: '#fff' };
  const centerTextAreaWrapper = { display: 'flex', justifyContent: 'center', alignItems: 'center' };

  return (
    <Container style={{ maxWidth: 900, marginTop: 20, marginBottom: 40, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-sm btn-outline-secondary"
          aria-label="Toggle theme"
          style={{ position: 'absolute', right: 0, top: -10, zIndex: 20, transform: 'translateY(-50%)' }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div className="text-center mb-4">
          <img src="/KasiLogo.jpeg" alt="Company Logo" style={{ maxWidth: 200, height: 'auto' }} />
        </div>
        <h2 className="text-center mb-4">Kasi Cloud Data Center Incident Ticket</h2>

        {statusMsg && (
          <Alert variant={statusMsg.type === 'success' ? 'success' : 'danger'} onClose={() => setStatusMsg(null)} dismissible>
            {statusMsg.text}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="app-form">
          {/* Outer big square */}
          <div style={outerSquareStyle}>
            {/* TOP inner square: category, subcategory, priority, building, location, impacted, description */}
            <div style={innerSquareStyle}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="category">
                    <Form.Label>Incident Category</Form.Label>
                    <Select
                      classNamePrefix="rs"
                      options={categoryOptions}
                      value={form.category}
                      onChange={handleCategoryChange}
                      name="category"
                      placeholder="-- Select Category --"
                      isClearable
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3" controlId="sub_category">
                    <Form.Label>Sub-category</Form.Label>
                    <Select
                      classNamePrefix="rs"
                      options={getSubCategoryOptions()}
                      value={subOptionFromValue(form.sub_category)}
                      onChange={handleSubCategorySelectChange}
                      name="sub_category"
                      placeholder="-- Select Sub-category --"
                      isClearable
                      isDisabled={!form.category}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="priority">
                    <Form.Label>Priority Level (P0–P4)</Form.Label>
                    <Select
                      classNamePrefix="rs"
                      options={priorityOptions}
                      value={form.priority}
                      onChange={handlePriorityChange}
                      name="priority"
                      placeholder="-- Select Priority --"
                      isClearable
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3" controlId="building">
                    <Form.Label>Building</Form.Label>
                    <Select
                      classNamePrefix="rs"
                      options={buildingOptions}
                      value={form.building ? { value: form.building, label: form.building } : null}
                      onChange={handleBuildingChange}
                      name="building"
                      placeholder="-- Select Building --"
                      isClearable
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Form.Group as={Col} md={6} className="mb-3" controlId="location">
                  <Form.Label>Affected Location (Rack/Zone/Room)</Form.Label>
                  <Form.Control type="text" name="location" value={form.location} onChange={handleChange} />
                </Form.Group>

                <Form.Group as={Col} md={6} className="mb-3" controlId="impacted">
                  <Form.Label>Impacted Systems/Services</Form.Label>
                  <Form.Control type="text" name="impacted" value={form.impacted} onChange={handleChange} />
                </Form.Group>
              </Row>

              {/* Centrally placed, larger incident description */}
              <div style={centerTextAreaWrapper}>
                <Form.Group className="mb-3" controlId="description" style={{ width: '100%', maxWidth: 760 }}>
                  <Form.Label className="text-center d-block">Incident Description</Form.Label>
                  <Form.Control as="textarea" rows={8} name="description" value={form.description} onChange={handleChange} required />
                </Form.Group>
              </div>
            </div>

            {/* BOTTOM inner square: detected by, time detected, root cause, actions taken */}
            <div style={innerSquareStyle}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="detectedBy">
                    <Form.Label>Detected By</Form.Label>
                    <Select
                      classNamePrefix="rs"
                      options={detectedByOptions}
                      value={form.detectedBy}
                      onChange={handleDetectedByChange}
                      name="detectedBy"
                      placeholder="-- Select --"
                      isClearable
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3" controlId="time_detected">
                    <Form.Label>Time Detected</Form.Label>
                    <Form.Control type="datetime-local" name="time_detected" value={form.time_detected} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>

              {form.detectedBy?.value === 'Other' && (
                <Form.Group className="mb-3" controlId="detectedByOther">
                  <Form.Label>Please specify</Form.Label>
                  <Form.Control type="text" name="detectedByOther" value={form.detectedByOther} onChange={handleChange} placeholder="Enter custom detection source" required />
                </Form.Group>
              )}

              <Row>
                <Form.Group as={Col} md={12} className="mb-3" controlId="root_cause">
                  <Form.Label>Root Cause (if known)</Form.Label>
                  <Form.Control type="text" name="root_cause" value={form.root_cause} onChange={handleChange} />
                </Form.Group>
              </Row>

              <Form.Group className="mb-3" controlId="actions_taken">
                <Form.Label>Immediate Actions Taken</Form.Label>
                <Form.Control as="textarea" rows={3} name="actions_taken" value={form.actions_taken} onChange={handleChange} />
              </Form.Group>
            </div>
          </div>

          {/* Submit Button directly after the big square */}
          <div className="d-grid gap-2 mt-4">
            <Button variant="primary" type="submit" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" role="status" aria-hidden="true" /> Submitting...
                </>
              ) : (isEditing ? 'Update Ticket' : 'Create Ticket')}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
}

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/frontend" element={<App />} />
        <Route path="/ticketspage" element={<TicketsPage />} />
        {/* default route -> show the form */}
        <Route path="*" element={<App />} />
      </Routes>
    </Router>
  );
}
