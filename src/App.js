import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TicketsPage from './TicketsPage';

const API_BASE = (() => {
  const raw = process.env.REACT_APP_API_URL?.trim();
  if (raw && raw.length > 0) return `${raw.replace(/\/$/, '')}/api`;
  return '/api';
})();

const api = axios.create({ baseURL: API_BASE });

const subCategories = {
  Network: ["Router Failure","Switch Failure","Network Latency","Packet Loss","ISP Outage","Fiber Cut","DNS Issue","Bandwidth Saturation"],
  Server: ["CPU/Memory Overload","Hardware Fault","OS Crash"],
  Storage: ["Disk Failure","RAID Degraded","Capacity Alert"],
  Power: ["Power Outage","UPS Failure","Generator Issue"],
  Cooling: ["Cooling Unit Failure","Temperature Alert"],
  Security: ["Security Breach","Access Control Failure","Surveillance Offline"],
  "Access Control": ["Badge Reader Failure","Door Lock Failure"],
  Application: ["Software Bug","Service Crash","Performance Degradation"],
  Database: ["Database Error","Connection Timeout","Data Corruption"]
};

const priorityOptions = [
  { value: "P0", label: "P0 - Catastrophic" },
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];

const detectedByOptions = [
  { value: "", label: "-- Select --" },
  { value: "Monitoring Tool", label: "Monitoring Tool" },
  { value: "Customer Report", label: "Customer Report" },
  { value: "Engineer Observation", label: "Engineer Observation" },
  { value: "Automated Alert", label: "Automated Alert" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "", label: "-- Select Status --" },
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
];

const categoryOptions = Object.keys(subCategories).map(cat => ({ value: cat, label: cat }));

const assignedEngineerOptions = [
  { value: "Suleiman Abdulsalam", label: "Suleiman Abdulsalam" },
  { value: "Jesse Etuk", label: "Jesse Etuk" },
  { value: "Opeyemi Akintelure", label: "Opeyemi Akintelure" },
  { value: "Gbenga Mabadeje", label: "Gbenga Mabadeje" },
  { value: "Eloka Igbokwe", label: "Eloka Igbokwe" },
  { value: "Ifeoma Ndudim", label: "Ifeoma Ndudim" },
];

// Building dropdown
const buildingOptions = [
  { value: "LOS1", label: "LOS1" },
  { value: "LOS2", label: "LOS2" },
  { value: "LOS3", label: "LOS3" },
  { value: "LOS4", label: "LOS4" },
  { value: "LOS5", label: "LOS5" },
];

const subOptionFromValue = (val) => (val ? { value: val, label: val } : null);

const isoToLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toOption = (val) => (val ? { value: val, label: String(val) } : null);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const [form, setForm] = useState({
    ticket_id: '',
    category: null,
    sub_category: '',
    building: null,
    opened: '',
    reported_by: '',
    contact_info: '',
    priority: null,
    location: '',
    impacted: '',
    description: '',
    detectedBy: null,
    detectedByOther: '',
    time_detected: '',
    root_cause: '',
    actions_taken: '',
    status: null,
    assigned_to: [],
    resolution_summary: '',
    resolution_time: '',
    duration: '',
    post_review: false,
    attachments: null,
    escalation_history: '',
    closed: '',
    sla_breach: false,
  });

  const ticketToEdit = location?.state?.ticketToEdit ?? null;
  const isEditing = Boolean(ticketToEdit);
  const [statusMsg, setStatusMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const t = ticketToEdit;
      setForm({
        ticket_id: t.ticket_id ?? t.id ?? '',
        category: t.category ? toOption(t.category) : null,
        sub_category: t.sub_category ?? '',
        building: t.building ? toOption(t.building) : null,
        opened: isoToLocalDatetime(t.opened) || '',
        reported_by: t.reported_by ?? '',
        contact_info: t.contact_info ?? '',
        priority: t.priority ? toOption(t.priority) : null,
        location: t.location ?? '',
        impacted: t.impacted ?? '',
        description: t.description ?? '',
        detectedBy: t.detectedBy ? toOption(t.detectedBy) : null,
        detectedByOther: t.detectedByOther ?? '',
        time_detected: isoToLocalDatetime(t.time_detected) || '',
        root_cause: t.root_cause ?? '',
        actions_taken: t.actions_taken ?? '',
        status: t.status ? toOption(t.status) : null,
        assigned_to: Array.isArray(t.assigned_to) ? t.assigned_to.map(a => ({ value: a, label: a })) : (t.assigned_to ? [{ value: t.assigned_to, label: t.assigned_to }] : []),
        resolution_summary: t.resolution_summary ?? '',
        resolution_time: isoToLocalDatetime(t.resolution_time) || '',
        duration: t.duration ?? '',
        post_review: Boolean(t.post_review),
        attachments: null,
        escalation_history: t.escalation_history ?? '',
        closed: isoToLocalDatetime(t.closed) || '',
        sla_breach: Boolean(t.sla_breach),
      });
    } else {
      setForm(f => ({ ...f, ticket_id: '' }));
    }
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }));
    else if (type === 'file') setForm(f => ({ ...f, [name]: files }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleCategoryChange = (selected) => setForm(f => ({ ...f, category: selected, sub_category: '' }));
  const handlePriorityChange = (selected) => setForm(f => ({ ...f, priority: selected }));
  const handleDetectedByChange = (selected) => {
    setForm(f => ({ ...f, detectedBy: selected }));
    if (!selected || selected.value !== 'Other') setForm(f => ({ ...f, detectedByOther: '' }));
  };
  const handleStatusChange = (selected) => setForm(f => ({ ...f, status: selected }));
  const handleAssignedToChange = (selectedArray) => setForm(f => ({ ...f, assigned_to: selectedArray || [] }));
  const handleSubCategorySelectChange = (selected) => setForm(f => ({ ...f, sub_category: selected ? selected.value : '' }));
  const handleBuildingChange = (selected) => setForm(f => ({ ...f, building: selected }));

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
    const output = { ...form };
    output.category = output.category?.value || '';
    output.priority = output.priority?.value || '';
    output.detectedBy = output.detectedBy?.value || '';
    output.status = output.status?.value || '';
    output.assigned_to = (output.assigned_to || []).map(a => a.value || a);
    output.building = output.building?.value || '';
    if (output.detectedBy === 'Other') output.detectedBy = output.detectedByOther;
    output.opened = dtToISO(output.opened);
    output.time_detected = dtToISO(output.time_detected);
    output.resolution_time = dtToISO(output.resolution_time);
    output.closed = dtToISO(output.closed);

    try {
      let res;
      const files = output.attachments;
      const identifier = ticketToEdit ? (ticketToEdit.id ?? ticketToEdit.ticket_id ?? ticketToEdit.id) : null;
      if (files && files.length > 0) {
        const formData = new FormData();
        const payload = { ...output };
        delete payload.attachments;
        formData.append('payload', JSON.stringify(payload));
        Array.from(files).forEach((file, idx) => formData.append('attachments[]', file, file.name));
        if (isEditing && identifier) res = await api.put(`/tickets/${identifier}`, formData, { headers: { 'Accept': 'application/json' } });
        else res = await api.post('/tickets', formData, { headers: { 'Accept': 'application/json' } });
      } else {
        const payload = { ...output };
        delete payload.attachments;
        if (isEditing) res = await api.put(`/tickets/${ticketToEdit.id ?? ticketToEdit.ticket_id ?? ticketToEdit.id}`, payload, { headers: { 'Content-Type': 'application/json' } });
        else res = await api.post('/tickets', payload, { headers: { 'Content-Type': 'application/json' } });
      }
      const data = res?.data || {};
      const createdId = data.ticket_id || data.id || data.ticketId || '(unknown)';
      setStatusMsg({ type: 'success', text: isEditing ? `Ticket updated successfully! ID: ${createdId}` : `Ticket submitted successfully! Ticket ID: ${createdId}` });
      if (isEditing) { navigate('/ticketspage'); return; }

      setForm({
        ticket_id: '', category: null, sub_category: '', building: null, opened: '', reported_by: '', contact_info: '', priority: null, location: '',
        impacted: '', description: '', detectedBy: null, detectedByOther: '', time_detected: '', root_cause: '', actions_taken: '', status: null,
        assigned_to: [], resolution_summary: '', resolution_time: '', duration: '', post_review: false, attachments: null, escalation_history: '',
        closed: '', sla_breach: false
      });
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'danger', text: 'Error submitting ticket. See console.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="my-3">
      <Row className="mb-3">
        <Col><h2>{isEditing ? 'Edit Ticket' : 'New Ticket'}</h2></Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={toggleTheme}>Toggle Theme</Button>
        </Col>
      </Row>
      {statusMsg && <Alert variant={statusMsg.type}>{statusMsg.text}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={3}>
            <Form.Group className="mb-2">
              <Form.Label>Priority Level (P0–P4)</Form.Label>
              <Select value={form.priority} onChange={handlePriorityChange} options={priorityOptions} />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-2">
              <Form.Label>Building</Form.Label>
              <Select value={form.building} onChange={handleBuildingChange} options={buildingOptions} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Affected Location (Rack/Zone/Room)</Form.Label>
              <Form.Control type="text" name="location" value={form.location} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Category</Form.Label>
              <Select value={form.category} onChange={handleCategoryChange} options={categoryOptions} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Sub-Category</Form.Label>
              <Form.Control as="select" name="sub_category" value={form.sub_category} onChange={handleChange}>
                <option value="">-- Select Sub-Category --</option>
                {(form.category ? subCategories[form.category.value] : []).map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Reported By</Form.Label>
              <Form.Control type="text" name="reported_by" value={form.reported_by} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>Contact Info</Form.Label>
              <Form.Control type="text" name="contact_info" value={form.contact_info} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-2">
              <Form.Label>Impacted Systems/Services</Form.Label>
              <Form.Control as="textarea" rows={3} name="impacted" value={form.impacted} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-2">
              <Form.Label>Description / Event</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" disabled={submitting}>{submitting ? <Spinner animation="border" size="sm" /> : 'Submit Ticket'}</Button>
      </Form>
    </Container>
  );
}

export default App;
