import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TicketsPage from './TicketsPage';   // adjust exact filename/casing if needed

/**
 * axios instance that respects REACT_APP_API_BASE_URL
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api",
});

function TicketForm() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [formData, setFormData] = useState({
    category: "",
    subCategory: "",
    priority: "",
    building: "",
    affectedArea: "",
    impactedSystems: "",
    incidentDescription: "",
    detectedBy: "",
    timeDetected: "",
    rootCause: "",
    actionTaken: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setCategories([
      { value: "Network", label: "Network" },
      { value: "Server", label: "Server" },
      { value: "Application", label: "Application" },
      { value: "Security", label: "Security" },
    ]);
  }, []);

  const handleCategoryChange = (selectedOption) => {
    setFormData({ ...formData, category: selectedOption?.value || "", subCategory: "" });
    if (selectedOption?.value === "Network") {
      setSubCategories([
        { value: "Switch", label: "Switch" },
        { value: "Router", label: "Router" },
        { value: "Access Point", label: "Access Point" },
      ]);
    } else if (selectedOption?.value === "Server") {
      setSubCategories([
        { value: "Database", label: "Database" },
        { value: "Web", label: "Web" },
        { value: "File", label: "File" },
      ]);
    } else {
      setSubCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/tickets", formData);
      setMessage({ type: "success", text: "Ticket created successfully!" });
      setFormData({
        category: "",
        subCategory: "",
        priority: "",
        building: "",
        affectedArea: "",
        impactedSystems: "",
        incidentDescription: "",
        detectedBy: "",
        timeDetected: "",
        rootCause: "",
        actionTaken: ""
      });
    } catch (error) {
      setMessage({ type: "danger", text: "Error creating ticket. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Create New Ticket</h2>
      {message.text && <Alert variant={message.type}>{message.text}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Outer square (big card) */}
        <div className="border rounded p-4 mb-4">

          {/* First inner square */}
          <div className="border rounded p-3 mb-4">
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Category</Form.Label>
                <Select
                  options={categories}
                  onChange={handleCategoryChange}
                  value={categories.find(opt => opt.value === formData.category) || null}
                  placeholder="-- Select Category --"
                />
              </Col>
              <Col md={6}>
                <Form.Label>Sub-Category</Form.Label>
                <Select
                  options={subCategories}
                  onChange={(opt) => setFormData({ ...formData, subCategory: opt?.value || "" })}
                  value={subCategories.find(opt => opt.value === formData.subCategory) || null}
                  placeholder="-- Select Sub-Category --"
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Priority Level</Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="">-- Select Priority --</option>
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                  <option value="P3">P3</option>
                  <option value="P4">P4</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Building</Form.Label>
                <Form.Select
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                >
                  <option value="">-- Select Building --</option>
                  <option value="LOS1">LOS1</option>
                  <option value="LOS2">LOS2</option>
                  <option value="LOS3">LOS3</option>
                  <option value="LOS4">LOS4</option>
                  <option value="LOS5">LOS5</option>
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Affected Area</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.affectedArea}
                  onChange={(e) => setFormData({ ...formData, affectedArea: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Impacted Systems</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.impactedSystems}
                  onChange={(e) => setFormData({ ...formData, impactedSystems: e.target.value })}
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Incident Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.incidentDescription}
                onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                style={{ textAlign: "center" }}
              />
            </Form.Group>
          </div>

          {/* Second inner square */}
          <div className="border rounded p-3 mb-4">
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Detected By</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.detectedBy}
                  onChange={(e) => setFormData({ ...formData, detectedBy: e.target.value })}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Time Detected</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={formData.timeDetected}
                  onChange={(e) => setFormData({ ...formData, timeDetected: e.target.value })}
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Root Cause</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.rootCause}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Action Taken</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.actionTaken}
                onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
              />
            </Form.Group>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Create Ticket"}
            </Button>
          </div>

        </div>
      </Form>
    </Container>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TicketForm />} />
        <Route path="/tickets" element={<TicketsPage />} />
      </Routes>
    </Router>
  );
}
