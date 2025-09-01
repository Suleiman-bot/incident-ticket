import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert, Spinner, Card } from 'react-bootstrap';
import Select from 'react-select';
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import TicketsPage from './TicketsPage';   // adjust exact filename/casing if needed

/**
 * axios instance that respects REACT_APP_API_URL
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
});

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function TicketForm() {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [building, setBuilding] = useState("");
  const [affectedArea, setAffectedArea] = useState("");
  const [impactedSystems, setImpactedSystems] = useState([]);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [detectedBy, setDetectedBy] = useState("");
  const [timeDetected, setTimeDetected] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const query = useQuery();
  const navigate = useNavigate();

  // Prefill from query if editing existing
  useEffect(() => {
    if (query.get("category")) setCategory(query.get("category"));
    if (query.get("subCategory")) setSubCategory(query.get("subCategory"));
    if (query.get("priority")) setPriority(query.get("priority"));
    if (query.get("building")) setBuilding(query.get("building"));
    if (query.get("affectedArea")) setAffectedArea(query.get("affectedArea"));
    if (query.get("impactedSystems")) setImpactedSystems(query.get("impactedSystems").split(","));
    if (query.get("incidentDescription")) setIncidentDescription(query.get("incidentDescription"));
    if (query.get("detectedBy")) setDetectedBy(query.get("detectedBy"));
    if (query.get("timeDetected")) setTimeDetected(query.get("timeDetected"));
    if (query.get("rootCause")) setRootCause(query.get("rootCause"));
    if (query.get("actionTaken")) setActionTaken(query.get("actionTaken"));
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        category,
        subCategory,
        priority,
        building,
        affectedArea,
        impactedSystems,
        incidentDescription,
        detectedBy,
        timeDetected,
        rootCause,
        actionTaken,
      };

      await api.post("/save_ticket.php", payload);
      setSuccess("Ticket created successfully!");
      setTimeout(() => navigate("/tickets"), 1200);
    } catch (err) {
      setError("Failed to create ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4 shadow-lg">
        <h2 className="text-center mb-4">Create New Ticket</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* First big square */}
          <Card className="p-3 mb-4">
            <Row className="mb-3">
              <Col>
                <Form.Group controlId="category">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="subCategory">
                  <Form.Label>Sub-Category</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter sub-category"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group controlId="priority">
                  <Form.Label>Priority Level (P0–P4)</Form.Label>
                  <Form.Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>-- Select Priority --</option>
                    <option value="P0">P0</option>
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="building">
                  <Form.Label>Building</Form.Label>
                  <Form.Select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                  >
                    <option>-- Select Building --</option>
                    <option value="LOS1">LOS1</option>
                    <option value="LOS2">LOS2</option>
                    <option value="LOS3">LOS3</option>
                    <option value="LOS4">LOS4</option>
                    <option value="LOS5">LOS5</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group controlId="affectedArea">
                  <Form.Label>Affected Location (Rack/Zone/Room)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter affected area"
                    value={affectedArea}
                    onChange={(e) => setAffectedArea(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="impactedSystems">
                  <Form.Label>Impacted Systems/Services</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: "Network", label: "Network" },
                      { value: "Server", label: "Server" },
                      { value: "Storage", label: "Storage" },
                      { value: "Database", label: "Database" },
                      { value: "Application", label: "Application" },
                    ]}
                    value={impactedSystems.map((s) => ({ value: s, label: s }))}
                    onChange={(selected) =>
                      setImpactedSystems(selected.map((s) => s.value))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="incidentDescription">
              <Form.Label>Incident Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter detailed incident description"
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
              />
            </Form.Group>
          </Card>

          {/* Second square */}
          <Card className="p-3 mb-4">
            <Row className="mb-3">
              <Col>
                <Form.Group controlId="detectedBy">
                  <Form.Label>Detected By</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter who detected"
                    value={detectedBy}
                    onChange={(e) => setDetectedBy(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="timeDetected">
                  <Form.Label>Time Detected</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={timeDetected}
                    onChange={(e) => setTimeDetected(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="rootCause">
              <Form.Label>Root Cause</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter root cause"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="actionTaken">
              <Form.Label>Action Taken</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter action taken"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
              />
            </Form.Group>
          </Card>

          <div className="text-center">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : "Create Ticket"}
            </Button>
          </div>
        </Form>
      </Card>
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
