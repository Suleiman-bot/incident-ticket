import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import Select from 'react-select';

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

function App() {
  const [form, setForm] = useState({
    ticket_id: '',
    category: null,
    sub_category: '',
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

  useEffect(() => {
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setForm(f => ({ ...f, ticket_id: `INC-${dateStr}-${randomNum}` }));
  }, []);

  // Handle normal input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: checked }));
    } else if (type === 'file') {
      setForm(f => ({ ...f, [name]: files }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Handle react-select changes
  const handleSelectChange = (selected, action) => {
    const { name } = action;
    setForm(f => ({ ...f, [name]: selected }));
    if (name === 'category') {
      setForm(f => ({ ...f, sub_category: '' }));
    }
    if (name === 'detectedBy' && selected?.value !== 'Other') {
      setForm(f => ({ ...f, detectedByOther: '' }));
    }
  };

  // For sub_category normal select
  const handleSubCategoryChange = (e) => {
    setForm(f => ({ ...f, sub_category: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const output = { ...form };

    // Unwrap react-select values to strings or arrays of strings
    output.category = output.category?.value || '';
    output.priority = output.priority?.value || '';
    output.detectedBy = output.detectedBy?.value || '';
    output.status = output.status?.value || '';
    output.assigned_to = output.assigned_to.map(a => a.value);

    if (output.detectedBy === 'Other') {
      output.detectedBy = output.detectedByOther;
    }

    alert("Ticket Submitted:\n\n" + JSON.stringify(output, null, 2));
  };

  return (
    <Container style={{ maxWidth: 900, marginTop: 20, marginBottom: 40, fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center mb-4">
        <img src="/Kasi Logo.jpeg" alt="Company Logo" style={{ maxWidth: 200, height: 'auto' }} />
      </div>
      <h2 className="text-center mb-4">Kasi Cloud Data Center Incident Ticket</h2>

      <Form onSubmit={handleSubmit}>

        <Form.Group className="mb-3" controlId="ticket_id">
          <Form.Label>Ticket ID</Form.Label>
          <Form.Control type="text" name="ticket_id" value={form.ticket_id} readOnly />
        </Form.Group>

        <Form.Group className="mb-3" controlId="category">
          <Form.Label>Incident Category</Form.Label>
          <Select
            options={categoryOptions}
            value={form.category}
            onChange={handleSelectChange}
            name="category"
            placeholder="-- Select Category --"
            isClearable
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="sub_category">
          <Form.Label>Sub-category</Form.Label>
          <Form.Select
            name="sub_category"
            value={form.sub_category}
            onChange={handleSubCategoryChange}
            disabled={!form.category}
          >
            <option value="">-- Select Sub-category --</option>
            {form.category &&
              subCategories[form.category.value].map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))
            }
          </Form.Select>
        </Form.Group>

        <Row>
          <Form.Group as={Col} md={6} className="mb-3" controlId="opened">
            <Form.Label>Date/Time Opened</Form.Label>
            <Form.Control
              type="datetime-local"
              name="opened"
              value={form.opened}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group as={Col} md={6} className="mb-3" controlId="reported_by">
            <Form.Label>Reported By</Form.Label>
            <Form.Control
              type="text"
              name="reported_by"
              value={form.reported_by}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Row>

        <Form.Group className="mb-3" controlId="contact_info">
          <Form.Label>Contact Information</Form.Label>
          <Form.Control
            type="email"
            name="contact_info"
            placeholder="email@example.com"
            value={form.contact_info}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="priority">
          <Form.Label>Priority Level (P0–P4)</Form.Label>
          <Select
            options={priorityOptions}
            value={form.priority}
            onChange={handleSelectChange}
            name="priority"
            placeholder="-- Select Priority --"
            isClearable
          />
        </Form.Group>

        <Row>
          <Form.Group as={Col} md={6} className="mb-3" controlId="location">
            <Form.Label>Affected Location (Rack/Zone/Room)</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group as={Col} md={6} className="mb-3" controlId="impacted">
            <Form.Label>Impacted Systems/Services</Form.Label>
            <Form.Control
              type="text"
              name="impacted"
              value={form.impacted}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <Form.Group className="mb-3" controlId="description">
          <Form.Label>Incident Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="detectedBy">
          <Form.Label>Detected By</Form.Label>
          <Select
            options={detectedByOptions}
            value={form.detectedBy}
            onChange={handleSelectChange}
            name="detectedBy"
            placeholder="-- Select --"
            isClearable
          />
        </Form.Group>

        {form.detectedBy?.value === 'Other' && (
          <Form.Group className="mb-3" controlId="detectedByOther">
            <Form.Label>Please specify</Form.Label>
            <Form.Control
              type="text"
              name="detectedByOther"
              value={form.detectedByOther}
              onChange={handleChange}
              placeholder="Enter custom detection source"
              required
            />
          </Form.Group>
        )}

        <Row>
          <Form.Group as={Col} md={6} className="mb-3" controlId="time_detected">
            <Form.Label>Time Detected</Form.Label>
            <Form.Control
              type="datetime-local"
              name="time_detected"
              value={form.time_detected}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group as={Col} md={6} className="mb-3" controlId="root_cause">
            <Form.Label>Root Cause (if known)</Form.Label>
            <Form.Control
              type="text"
              name="root_cause"
              value={form.root_cause}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <Form.Group className="mb-3" controlId="actions_taken">
          <Form.Label>Immediate Actions Taken</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="actions_taken"
            value={form.actions_taken}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="status">
          <Form.Label>Status</Form.Label>
          <Select
            options={statusOptions}
            value={form.status}
            onChange={handleSelectChange}
            name="status"
            placeholder="-- Select Status --"
            isClearable
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="assigned_to">
          <Form.Label>Assigned Engineer</Form.Label>
          <Select
            options={assignedEngineerOptions}
            value={form.assigned_to}
            onChange={selected => setForm(f => ({ ...f, assigned_to: selected || [] }))}
            isMulti
            name="assigned_to"
            placeholder="Select assigned engineers"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="resolution_summary">
          <Form.Label>Resolution Summary</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="resolution_summary"
            value={form.resolution_summary}
            onChange={handleChange}
          />
        </Form.Group>

        <Row>
          <Form.Group as={Col} md={6} className="mb-3" controlId="resolution_time">
            <Form.Label>Resolution Time</Form.Label>
            <Form.Control
              type="datetime-local"
              name="resolution_time"
              value={form.resolution_time}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group as={Col} md={6} className="mb-3" controlId="duration">
            <Form.Label>Duration of Outage</Form.Label>
            <Form.Control
              type="text"
              name="duration"
              placeholder="e.g., 2h 15m"
              value={form.duration}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <Form.Group className="mb-3" controlId="post_review">
          <Form.Check
            type="checkbox"
            label="Post-Incident Review Needed?"
            name="post_review"
            checked={form.post_review}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="attachments">
          <Form.Label>Attachments</Form.Label>
          <Form.Control
            type="file"
            name="attachments"
            multiple
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="escalation_history">
          <Form.Label>Escalation History</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="escalation_history"
            value={form.escalation_history}
            onChange={handleChange}
          />
        </Form.Group>

        <Row>
          <Form.Group as={Col} md={6} className="mb-3" controlId="closed">
            <Form.Label>Date/Time Closed</Form.Label>
            <Form.Control
              type="datetime-local"
              name="closed"
              value={form.closed}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group as={Col} md={6} className="mb-3" controlId="sla_breach">
            <Form.Check
              type="checkbox"
              label="SLA Breach?"
              name="sla_breach"
              checked={form.sla_breach}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <div className="d-grid gap-2 mt-4">
          <Button variant="primary" type="submit" size="lg">
            Submit Ticket
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default App;
