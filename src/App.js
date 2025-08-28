import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TicketsPage from './TicketsPage'; // adjust filename if needed

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
  { value: 'LOS5', label: 'LOS5' }
];

// Example category/subcategory mapping
const categoryOptions = [
  { value: 'Network', label: 'Network' },
  { value: 'Server', label: 'Server' },
  { value: 'Application', label: 'Application' }
];

const subCategories = {
  Network: ['LAN', 'WAN', 'Firewall'],
  Server: ['Linux', 'Windows', 'VM'],
  Application: ['Web', 'DB', 'API']
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    ticket_id: '',
    category: null,
    sub_category: '',
    opened: '',
    reported_by: '',
    contact_info: '',
    priority: null,
    building: '', // added
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

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handlePriorityChange = (selected) => setForm(f => ({ ...f, priority: selected }));
  const handleBuildingChange = (selected) => setForm(f => ({ ...f, building: selected ? selected.value : '' }));
  const handleCategoryChange = (selected) => setForm(f => ({ ...f, category: selected, sub_category: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      await axios.post('/api/tickets', form); // replace with your endpoint
      setStatusMsg({ type: 'success', text: 'Ticket submitted successfully.' });
      setForm({
        ticket_id: '',
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
        status: null,
        assigned_to: [],
        resolution_summary: '',
        resolution_time: '',
        duration: '',
        post_review: false,
        attachments: null,
        escalation_history: '',
        closed: '',
        sla_breach: false
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
      <h2>New Ticket</h2>
      {statusMsg && <Alert variant={statusMsg.type}>{statusMsg.text}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Priority Level (P0–P4)</Form.Label>
              <Select
                value={form.priority}
                onChange={handlePriorityChange}
                options={priorityOptions}
                placeholder="-- Select Priority --"
                isClearable
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Select
                value={form.category}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder="-- Select Category --"
                isClearable
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Sub-Category</Form.Label>
              <Form.Control
                as="select"
                name="sub_category"
                value={form.sub_category}
                onChange={handleChange}
              >
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
            <Form.Group className="mb-3">
              <Form.Label>Reported By</Form.Label>
              <Form.Control type="text" name="reported_by" value={form.reported_by} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Contact Info</Form.Label>
              <Form.Control type="text" name="contact_info" value={form.contact_info} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        {/* Building dropdown inserted here */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Building</Form.Label>
              <Select
                value={form.building ? { value: form.building, label: form.building } : null}
                onChange={handleBuildingChange}
                options={buildingOptions}
                placeholder="-- Select Building --"
                isClearable
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Affected Location (Rack/Zone/Room)</Form.Label>
              <Form.Control type="text" name="location" value={form.location} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Impacted Systems/Services</Form.Label>
              <Form.Control as="textarea" rows={3} name="impacted" value={form.impacted} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Description / Event</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        {/* Optional fields preserved */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Detected By</Form.Label>
              <Form.Control type="text" name="detectedByOther" value={form.detectedByOther} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Time Detected</Form.Label>
              <Form.Control type="datetime-local" name="time_detected" value={form.time_detected} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Actions Taken</Form.Label>
              <Form.Control as="textarea" rows={2} name="actions_taken" value={form.actions_taken} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner animation="border" size="sm" /> : 'Submit Ticket'}
        </Button>
      </Form>
    </Container>
  );
}

// Wrap App in Router in index.js or main entry
function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tickets" element={<TicketsPage />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
