// src/App.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import Select from 'react-select';
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TicketsPage from './TicketsPage';

// ---------- axios base ----------
const API_BASE = (() => {
  const raw = process.env.REACT_APP_API_URL?.trim();
  if (raw && raw.length > 0) return `${raw.replace(/\/$/, '')}/api`;
  return '/api';
})();
const api = axios.create({ baseURL: API_BASE });

// ---------- constants ----------
const subCategories = { /* same as your original */ };
const categoryOptions = Object.keys(subCategories).map(cat => ({ value: cat, label: cat }));
const priorityOptions = [ /* same as your original */ ];
const buildingOptions = ["LOS1","LOS2","LOS3","LOS4","LOS5"].map(b => ({ value: b, label: b }));
const detectedByOptions = [ /* same as your original */ ];

const subOptionFromValue = (val) => (val ? { value: val, label: val } : null);
const toOption = (val) => (val ? { value: val, label: String(val) } : null);
const isoToLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ---------- component ----------
function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  const [form, setForm] = useState({
    category: null,
    sub_category: '',
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

  const ticketToEdit = location?.state?.ticketToEdit ?? null;
  const isEditing = Boolean(ticketToEdit);

  useEffect(() => {
    if (isEditing) {
      const t = ticketToEdit;
      setForm({
        category: t.category ? toOption(t.category) : null,
        sub_category: t.sub_category ?? '',
        priority: t.priority ? toOption(t.priority) : null,
        building: t.building ?? '',
        location: t.location ?? '',
        impacted: t.impacted ?? '',
        description: t.description ?? '',
        detectedBy: t.detectedBy ? toOption(t.detectedBy) : null,
        detectedByOther: t.detectedByOther ?? '',
        time_detected: isoToLocalDatetime(t.time_detected) || '',
        root_cause: t.root_cause ?? '',
        actions_taken: t.actions_taken ?? '',
      });
    }
  }, [isEditing, ticketToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleCategoryChange = (selected) => setForm(f => ({ ...f, category: selected, sub_category: '' }));
  const handlePriorityChange = (selected) => setForm(f => ({ ...f, priority: selected }));
  const handleBuildingChange = (selected) => setForm(f => ({ ...f, building: selected ? selected.value : '' }));
  const handleDetectedByChange = (selected) => {
    setForm(f => ({ ...f, detectedBy: selected }));
    if (!selected || selected.value !== 'Other') setForm(f => ({ ...f, detectedByOther: '' }));
  };

  const getSubCategoryOptions = () => {
    const catKey = form.category?.value;
    if (!catKey) return [];
    return (subCategories[catKey] || []).map(s => ({ value: s, label: s }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const output = {
      category: form.category?.value || '',
      sub_category: form.sub_category,
      priority: form.priority?.value || '',
      building: form.building,
      location: form.location,
      impacted: form.impacted,
      description: form.description,
      detectedBy: form.detectedBy?.value || '',
      detectedByOther: form.detectedByOther,
      time_detected: form.time_detected ? new Date(form.time_detected).toISOString() : '',
      root_cause: form.root_cause,
      actions_taken: form.actions_taken,
    };
    try {
      if (isEditing) {
        const identifier = ticketToEdit.id ?? ticketToEdit.ticket_id;
        await api.put(`/tickets/${identifier}`, output);
      } else {
        await api.post('/tickets', output);
      }
      navigate('/ticketspage');
    } catch (err) {
      console.error('Error submitting ticket:', err);
    }
  };

  const textColor = theme === 'dark' ? '#fff' : '#000';
  const bgColor = theme === 'dark' ? '#121212' : '#ffffff';
  const cardBg = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  const fieldBg = theme === 'dark' ? '#333' : '#fff';
  const borderColor = theme === 'dark' ? fieldBg : '#ccc';

  return (
    <Container style={{ maxWidth: 900, marginTop: 20, marginBottom: 40, backgroundColor: bgColor, minHeight: "100vh" }}>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-sm btn-outline-secondary"
          style={{ position: 'absolute', right: 0, top: -10 }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <div className="text-center mb-4">
          <img src="/KasiLogo.jpeg" alt="Company Logo" style={{ maxWidth: 200 }} />
        </div>

        <h2 className="text-center mb-4" style={{ color: textColor }}>
          Kasi Cloud Data Center Incident Ticket
        </h2>

        <Form onSubmit={handleSubmit}>
          {/* Incident Info Card */}
          <Card className="p-3 mb-3" style={{ backgroundColor: cardBg, border: `2px solid ${borderColor}` }}>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Category</Form.Label>
                  <Select
                    classNamePrefix="rs"
                    options={categoryOptions}
                    value={form.category}
                    onChange={handleCategoryChange}
                    placeholder="-- Select Category --"
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Sub-category</Form.Label>
                  <Select
                    classNamePrefix="rs"
                    options={getSubCategoryOptions()}
                    value={subOptionFromValue(form.sub_category)}
                    onChange={(s) => setForm(f => ({ ...f, sub_category: s ? s.value : '' }))}
                    placeholder="-- Select Sub-category --"
                    isClearable
                    isDisabled={!form.category}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Priority</Form.Label>
                  <Select
                    classNamePrefix="rs"
                    options={priorityOptions}
                    value={form.priority}
                    onChange={handlePriorityChange}
                    placeholder="-- Select Priority --"
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Building</Form.Label>
                  <Select
                    classNamePrefix="rs"
                    options={buildingOptions}
                    value={form.building ? { value: form.building, label: form.building } : null}
                    onChange={handleBuildingChange}
                    placeholder="-- Select Building --"
                    isClearable
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Affected Area</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    style={{ color: textColor, backgroundColor: fieldBg }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Impacted Systems</Form.Label>
                  <Form.Control
                    type="text"
                    name="impacted"
                    value={form.impacted}
                    onChange={handleChange}
                    style={{ color: textColor, backgroundColor: fieldBg }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label style={{ color: textColor }}>Incident Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="description"
                value={form.description}
                onChange={handleChange}
                style={{ color: textColor, backgroundColor: fieldBg }}
              />
            </Form.Group>
          </Card>

          {/* Detection Info Card */}
          <Card className="p-3 mb-3" style={{ backgroundColor: cardBg, border: `2px solid ${borderColor}` }}>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Detected By</Form.Label>
                  <Select
                    classNamePrefix="rs"
                    options={detectedByOptions}
                    value={form.detectedBy}
                    onChange={handleDetectedByChange}
                    placeholder="-- Select --"
                    isClearable
                  />
                </Form.Group>
                {form.detectedBy?.value === 'Other' && (
                  <Form.Group className="mt-2">
                    <Form.Label style={{ color: textColor }}>Please specify</Form.Label>
                    <Form.Control
                      type="text"
                      name="detectedByOther"
                      value={form.detectedByOther}
                      onChange={handleChange}
                      placeholder="Enter custom detection source"
                      style={{ color: textColor, backgroundColor: fieldBg }}
                    />
                  </Form.Group>
                )}
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>Time Detected</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="time_detected"
                    value={form.time_detected}
                    onChange={handleChange}
                    style={{ color: textColor, backgroundColor: fieldBg }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label style={{ color: textColor }}>Root Cause</Form.Label>
              <Form.Control
                type="text"
                name="root_cause"
                value={form.root_cause}
                onChange={handleChange}
                style={{ color: textColor, backgroundColor: fieldBg }}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label style={{ color: textColor }}>Action Taken</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="actions_taken"
                value={form.actions_taken}
                onChange={handleChange}
                style={{ color: textColor, backgroundColor: fieldBg }}
              />
            </Form.Group>
          </Card>

          {/* Submit */}
          <div className="d-grid gap-2 mt-4">
            <Button type="submit" variant="primary" size="lg">
              {isEditing ? 'Update Ticket' : 'Create Ticket'}
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
        <Route path="*" element={<App />} />
      </Routes>
    </Router>
  );
}
