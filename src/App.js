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

const categoryOptions = Object.keys(subCategories).map(cat => ({ value: cat, label: cat }));

const buildingOptions = [
  { value: "LOS1", label: "LOS1" },
  { value: "LOS2", label: "LOS2" },
  { value: "LOS3", label: "LOS3" },
  { value: "LOS4", label: "LOS4" },
  { value: "LOS5", label: "LOS5" },
];

const toOption = (val) => (val ? { value: val, label: String(val) } : null);

const isoToLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function AppWrapper() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>
    </Router>
  );
}

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
    root_cause: '',
    actions_taken: '',
    resolution_summary: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCategoryChange = (selected) => setForm(f => ({ ...f, category: selected, sub_category: '' }));
  const handlePriorityChange = (selected) => setForm(f => ({ ...f, priority: selected }));
  const handleBuildingChange = (selected) => setForm(f => ({ ...f, building: selected }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const output = { ...form };
    output.category = output.category?.value || '';
    output.priority = output.priority?.value || '';
    output.building = output.building?.value || '';

    try {
      await api.post('/tickets', output);
      alert('Ticket submitted successfully!');
      setForm({
        ticket_id: '', category: null, sub_category: '', building: null, opened: '', reported_by: '', contact_info: '', priority: null, location: '',
        impacted: '', description: '', root_cause: '', actions_taken: '', resolution_summary: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error submitting ticket.');
    }
  };

  return (
    <Container className="my-3">
      <Row className="mb-3">
        <Col><h2>New Ticket</h2></Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={toggleTheme}>Toggle Theme</Button>
        </Col>
      </Row>
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

        <Row>
          <Col md={12}>
            <Form.Group className="mb-2">
              <Form.Label>Root Cause</Form.Label>
              <Form.Control as="textarea" rows={2} name="root_cause" value={form.root_cause} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-2">
              <Form.Label>Actions Taken</Form.Label>
              <Form.Control as="textarea" rows={2} name="actions_taken" value={form.actions_taken} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-2">
              <Form.Label>Resolution Summary</Form.Label>
              <Form.Control as="textarea" rows={2} name="resolution_summary" value={form.resolution_summary} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" disabled={false}>Submit Ticket</Button>
      </Form>
    </Container>
  );
}

export default AppWrapper;
