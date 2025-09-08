// src/TicketsPage.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Typography,
  TextField,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { CSVLink } from "react-csv";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import the logo with space in filename as requested
import KasiLogo from "./KasiLogo.jpeg";
import { Stack, FormControlLabel, Switch } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import ReactSelect from "react-select";
import { Form, Button as RBButton, Card, Row, Col, Alert } from "react-bootstrap";
import SortIcon from "@mui/icons-material/Sort";   // add this at the top
import Tooltip from "@mui/material/Tooltip";
import DateRangeIcon from "@mui/icons-material/DateRange"; // calendar-like icon


// ---------- constants (copied from App.js) ----------
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
const categoryOptions = Object.keys(subCategories).map(cat => ({ value: cat, label: cat }));
const priorityOptions = [
  { value: "P0", label: "P0 - Catastrophic" },
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];
const buildingOptions = ["LOS1","LOS2","LOS3","LOS4","LOS5"].map(b => ({ value: b, label: b }));
const detectedByOptions = [
  { value: "", label: "-- Select --" },
  { value: "Monitoring Tool", label: "Monitoring Tool" },
  { value: "Customer Report", label: "Customer Report" },
  { value: "Engineer Observation", label: "Engineer Observation" },
  { value: "Automated Alert", label: "Automated Alert" },
  { value: "Other", label: "Other" },
];

const subOptionFromValue = (val) => (val ? { value: val, label: val } : null);
const toOption = (val) => (val ? { value: val, label: String(val) } : null);
const isoToLocalDatetime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};


const assignedEngineerOptions = [
  { value: "Suleiman Abdulsalam", label: "Suleiman Abdulsalam" },
  { value: "Jesse Etuk", label: "Jesse Etuk" },
  { value: "Opeyemi Akintelure", label: "Opeyemi Akintelure" },
  { value: "Gbenga Mabadeje", label: "Gbenga Mabadeje" },
  { value: "Eloka Igbokwe", label: "Eloka Igbokwe" },
  { value: "Ifeoma Ndudim", label: "Ifeoma Ndudim" },
];


//TIcketsPage Components
const TicketsPage = ({ theme, setTheme }) => {
  // state, hooks, etc...
  const navigate = useNavigate();
  // theme-based colors
const textColor = theme === "dark" ? "#fff" : "#000";
const cardBg = theme === "dark" ? "#1e1e1e" : "#ffffff";
const fieldBg = theme === "dark" ? "#333" : "#fff";
const borderColor = theme === "dark" ? fieldBg : "#ccc";

// alert state
const [alert, setAlert] = useState({ type: "", message: "" });
const [sortOrder, setSortOrder] = useState("asc"); // "asc" | "desc"
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState({
    ticketId: "",
    building: "",
    priority: "",
    status: "",
    dateRange: [null, null],
  });
  const [dateAnchor, setDateAnchor] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  // 🔹 PATCH 1: Store full ticket objects separately for modal
const [allTickets, setAllTickets] = useState([]); 

  const [modalType, setModalType] = useState(""); // "view" | "assign" | "updateStatus" | "edit" | "resolve"

  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchTickets();
  }, []);

const fetchTickets = async () => {
  try {
    const res = await axios.get("http://192.168.0.3:8000/api/tickets");
    console.log("Fetched tickets: ", res.data);

    // 🔹 PATCH 2: Store full objects for modal
    setAllTickets(res.data);

    // 🔹 PATCH 3: Normalize subset for table
    const normalized = res.data.map((t) => ({
      ticketId: t.ticket_id,
      category: t.category,
      subCategory: t.sub_category,
      priority: t.priority,
      status: t.status,
      dateOpened: t.opened,
      dateClosed: t.closed,
    }));

    setTickets(normalized);
  } catch (err) {
    console.error("Error fetching tickets:", err);
  }
};


// 🔹 Edit form state
const [form, setForm] = useState({
  category: "",
  sub_category: "",
  priority: "",
  building: "",
  location: "",
  impacted: "",
  description: "",
  detectedBy: null,
  detectedByOther: "",
  time_detected: "",
  root_cause: "",
  actions_taken: "",
  // 🔹 Resolve modal fields (default safe values)
  resolution_summary: "",
  resolution_time: "",
  sla_breach: "No",     // default = No
  post_review: "No",    // default = No
});

// 🔹 Generic text change handler
const handleChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
};

// 🔹 Category handler
const handleCategoryChange = (option) => {
  setForm((prev) => ({ ...prev, category: option ? option.value : "", sub_category: "" }));
};

  // 🔹 Subcategory helper (same as App.js)
// 🔹 Fix: Subcategory helper (string-based)
const getSubCategoryOptions = () => {
  if (!form.category) return [];
  return (subCategories[form.category] || []).map((s) => ({
    value: s,
    label: s,
  }));
};


// 🔹 Priority handler
const handlePriorityChange = (option) => {
  setForm((prev) => ({ ...prev, priority: option ? option.value : "" }));
};

// 🔹 Building handler
const handleBuildingChange = (option) => {
  setForm((prev) => ({ ...prev, building: option ? option.value : "" }));
};

// 🔹 DetectedBy handler
const handleDetectedByChange = (option) => {
  setForm((prev) => ({ ...prev, detectedBy: option }));
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Prepare output for backend
    const output = {
      ...form,
      detectedBy: form.detectedBy ? form.detectedBy.value : "",
    };

    await axios.put(`http://192.168.0.3:8000/api/tickets/${selectedTicket.ticket_id}`, output);

    // Update frontend state
    setAllTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === selectedTicket.ticket_id ? { ...t, ...output } : t
      )
    );

    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === selectedTicket.ticket_id
          ? {
              ...t,
              category: output.category,
              subCategory: output.sub_category,
              priority: output.priority,
            }
          : t
      )
    );

    setModalType(""); // Close modal
    setSelectedTicket(null);
  } catch (err) {
    console.error("Error updating ticket:", err);
    alert("Failed to update ticket. Please try again.");
  }
};


  const handleActionClick = (event, ticket) => {
    setAnchorEl(event.currentTarget);
    // 🔹 PATCH 4: Find full ticket object by ticketId
const fullTicket = allTickets.find(t => t.ticket_id === ticket.ticketId);
setSelectedTicket(fullTicket);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
//HandleOpenModal
const handleOpenModal = (type) => {
  setModalType(type);
  handleCloseMenu();
//HandleOpenModal Edit
  if (type === "edit" && selectedTicket) {
    setForm({
      category: selectedTicket.category || "",
      sub_category: selectedTicket.sub_category || "",
      priority: selectedTicket.priority || "",
      building: selectedTicket.building || "",
      location: selectedTicket.location || "",
      impacted: selectedTicket.impacted || "",
      description: selectedTicket.description || "",
      detectedBy: selectedTicket.detectedBy 
        ? { value: selectedTicket.detectedBy, label: selectedTicket.detectedBy }
        : null,
      detectedByOther: selectedTicket.detectedByOther || "",
      time_detected: selectedTicket.time_detected || "",
      root_cause: selectedTicket.root_cause || "",
      actions_taken: selectedTicket.actions_taken || "",
    });
  }
   //HandleOpenModal ResolveTicket
  if (type === "resolve" && selectedTicket) {
  setForm({
    ...selectedTicket,
    resolution_summary: selectedTicket.resolution_summary || "",
    resolution_time: selectedTicket.resolution_time || "",
    // normalize SLA + Review to "Yes"/"No"
    sla_breach: selectedTicket.sla_breach || "No",
    post_review: selectedTicket.post_review || "No",
  });
}

};

  const handleFilterChange = (field, value) => {
    setFilter((prev) => ({ ...prev, [field]: value }));
  };

  
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      return (
        (!filter.ticketId || t.ticketId.includes(filter.ticketId)) &&
        (!filter.building || t.building === filter.building) &&
        (!filter.priority || t.priority === filter.priority) &&
        (!filter.status || t.status === filter.status) &&
        (!filter.dateRange[0] ||
          (new Date(t.dateOpened) >= filter.dateRange[0] &&
            new Date(t.dateOpened) <= filter.dateRange[1]))
      );
    });
  }, [tickets, filter]);

const handleSortDate = () => {
  setTickets((prev) =>
    [...prev].sort((a, b) => {
      const dateA = new Date(a.dateOpened);
      const dateB = new Date(b.dateOpened);

      return sortOrder === "asc"
        ? dateA - dateB
        : dateB - dateA;
    })
  );

  // flip sort order for next click
  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
};


  const handleCreateTicket = () => {
    navigate("/create-ticket");
  };

  const modalBody = () => {
    
    if (!selectedTicket) return null;

    switch (modalType) {

// ===============================
// CASE: VIEW MORE MODAL
// =============================== 
case "view": // View More
  return (
    <Box sx={{ p: 4, bgcolor: "background.paper" }}>
      <Typography variant="h6" gutterBottom>
        Ticket Details
      </Typography>

      {selectedTicket && (
        <div style={{ display: "grid", rowGap: 8 }}>
          {selectedTicket.ticket_id && (
            <div><strong>Ticket ID:</strong> {selectedTicket.ticket_id}</div>
          )}
          {selectedTicket.category && (
            <div><strong>Category:</strong> {selectedTicket.category}</div>
          )}
          {selectedTicket.sub_category && (
            <div><strong>Sub Category:</strong> {selectedTicket.sub_category}</div>
          )}
          {selectedTicket.priority && (
            <div><strong>Priority:</strong> {selectedTicket.priority}</div>
          )}
          {selectedTicket.status && (
            <div><strong>Status:</strong> {selectedTicket.status}</div>
          )}
          {selectedTicket.opened && (
            <div><strong>Date Opened:</strong> {selectedTicket.opened}</div>
          )}
          {selectedTicket.closed && selectedTicket.closed !== "-" && (
            <div><strong>Date Closed:</strong> {selectedTicket.closed}</div>
          )}
          {selectedTicket.building && (
            <div><strong>Building:</strong> {selectedTicket.building}</div>
          )}
          {selectedTicket.location && (
            <div><strong>Location:</strong> {selectedTicket.location}</div>
          )}
          {selectedTicket.impacted && (
            <div><strong>Impacted Systems/Services:</strong> {selectedTicket.impacted}</div>
          )}
          {selectedTicket.description && (
            <div><strong>Description:</strong> {selectedTicket.description}</div>
          )}
          {selectedTicket.detectedBy && (
            <div><strong>Detected By:</strong> {selectedTicket.detectedBy}</div>
          )}
          {selectedTicket.time_detected && (
            <div><strong>Time Detected:</strong> {selectedTicket.time_detected}</div>
          )}
          {selectedTicket.root_cause && (
            <div><strong>Root Cause:</strong> {selectedTicket.root_cause}</div>
          )}
          {selectedTicket.actions_taken && (
            <div><strong>Actions Taken:</strong> {selectedTicket.actions_taken}</div>
          )}
          {selectedTicket.assigned_to && (
            <div><strong>Assigned To:</strong> {selectedTicket.assigned_to}</div>
          )}
          {selectedTicket.resolution_summary && (
            <div><strong>Resolution Summary:</strong> {selectedTicket.resolution_summary}</div>
          )}
          {selectedTicket.resolution_time && (
            <div><strong>Resolution Time:</strong> {selectedTicket.resolution_time}</div>
          )}

          {/* SLA Breach & Post Review only if ticket resolved */}
          {selectedTicket.status === "Resolved" && selectedTicket.sla_breach && (
            <div><strong>SLA Breach:</strong> {selectedTicket.sla_breach}</div>
          )}
          {selectedTicket.status === "Resolved" && selectedTicket.post_review && (
            <div><strong>Post Review:</strong> {selectedTicket.post_review}</div>
          )}
        </div>
      )}

        {/* 🔹 Filled Close button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setModalType("")}
        sx={{ mt: 2 }}
      >
        Close
      </Button>
    </Box>
  );

// ===============================
// CASE: ASSIGNED ENGINEER MODAL
// =============================== 
case "assign":  //Assigned Engineers
  return (
    <Box sx={{ p: 4, bgcolor: "background.paper", borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Assign Engineers
      </Typography>

      <ReactSelect
        isMulti
        options={assignedEngineerOptions}
        placeholder="Select engineers..."
        value={(selectedTicket.assigned_to || "")
          .split(",")
          .filter(name => name.trim() !== "")
          .map(name => ({ value: name, label: name }))}
        onChange={(selected) => {
          const engineers = selected.map(opt => opt.value).join(", ");
          setSelectedTicket(prev => ({ ...prev, assigned_to: engineers }));
        }}
      />

      <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={async () => {
            try {
              // 1. Update backend (tickets.csv)
              await fetch(
                `http://192.168.0.3:8000/api/tickets/${selectedTicket.ticket_id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    assigned_to: selectedTicket.assigned_to,
                  }),
                }
              );

              // 2. Update frontend state
              setAllTickets(prev =>
                prev.map(ticket =>
                  ticket.ticket_id === selectedTicket.ticket_id
                    ? { ...ticket, assigned_to: selectedTicket.assigned_to }
                    : ticket
                )
              );

              setModalType(""); // close modal
            } catch (err) {
              console.error("Error assigning engineers:", err);
              alert("Failed to update ticket. Please try again.");
            }
          }}
        >
          Save
        </Button>
        <Button variant="outlined" onClick={() => setModalType("")}>
          Cancel
        </Button>
      </Box>
    </Box>
  );

// ===============================
// CASE: UPDATE STATUS MODAL
// =============================== 
      case "updateStatus":   //Update Status
        return (
          <Box sx={{ p: 4, bgcolor: "background.paper" }}>
            <Typography variant="h6">Update Status</Typography>
            <FormControl fullWidth>
              <Select
                value={selectedTicket.status || "Open"}
                onChange={(e) =>
                  setSelectedTicket({ ...selectedTicket, status: e.target.value })
                }
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </Select>
            </FormControl>
                 {/* ===== Action Button ===== */}
<Button
        variant="contained"      // 🔹 Filled button
        color="primary"          // 🔹 Blue (use "success" for green)
        sx={{ mt: 2 }}
  onClick={async () => {
    try {
      await fetch(
        `http://192.168.0.3:8000/api/tickets/${selectedTicket.ticket_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedTicket.status }),
        }
      );

      // Update full tickets
      setAllTickets(prev =>
        prev.map(ticket =>
          ticket.ticket_id === selectedTicket.ticket_id
            ? { ...ticket, status: selectedTicket.status }
            : ticket
        )
      );

      // Update normalized table tickets
      setTickets(prev =>
        prev.map(ticket =>
          ticket.ticketId === selectedTicket.ticket_id
            ? { ...ticket, status: selectedTicket.status }
            : ticket
        )
      );

      // Sync modal data too
      setSelectedTicket(prev => ({
        ...prev,
        status: selectedTicket.status,
      }));

      setModalType("");
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }}
>
  Update
</Button>

          </Box>
        );

// ===============================
// CASE: EDIT MODAL
// =============================== 
case "edit": // EDIT BUTTON
  return (
    <Box sx={{ p: 4, bgcolor: "background.paper" }}>
      <Typography variant="h6" gutterBottom>
        Edit Ticket
      </Typography>

      {/* ====== Success / Error Alert Section ====== */}
      {alert.message && (
        <Alert
          variant={alert.type}
          onClose={() => setAlert({ type: "", message: "" })}
          dismissible
          className="mt-3"
        >
          {alert.message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card
          className="p-3"
          style={{
            border: `2px solid ${borderColor}`,
            backgroundColor: cardBg,
          }}
        >
          {/* ===== Square 1 ===== */}
          <Card
            className="p-3 mb-3"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>
                    Category
                  </Form.Label>
                  <ReactSelect
                    classNamePrefix="rs"
                    options={categoryOptions}
                    value={
                      form.category
                        ? { value: form.category, label: form.category }
                        : null
                    }
                    onChange={handleCategoryChange}
                    placeholder="-- Select Category --"
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>
                    Sub-category
                  </Form.Label>
                  <ReactSelect
                    classNamePrefix="rs"
                    options={getSubCategoryOptions()}
                    value={subOptionFromValue(form.sub_category)}
                    onChange={(s) =>
                      setForm((f) => ({
                        ...f,
                        sub_category: s ? s.value : "",
                      }))
                    }
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
                  <Form.Label style={{ color: textColor }}>
                    Priority Level
                  </Form.Label>
                  <ReactSelect
                    classNamePrefix="rs"
                    options={priorityOptions}
                    value={
                      form.priority
                        ? { value: form.priority, label: form.priority }
                        : null
                    }
                    onChange={handlePriorityChange}
                    placeholder="-- Select Priority --"
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>
                    Building
                  </Form.Label>
                  <ReactSelect
                    classNamePrefix="rs"
                    options={buildingOptions}
                    value={
                      form.building
                        ? { value: form.building, label: form.building }
                        : null
                    }
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
                  <Form.Label style={{ color: textColor }}>
                    Affected Area
                  </Form.Label>
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
                  <Form.Label style={{ color: textColor }}>
                    Impacted Systems
                  </Form.Label>
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

            <Form.Group>
              <Form.Label style={{ color: textColor }}>
                Incident Description
              </Form.Label>
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

          {/* ===== Square 2 ===== */}
          <Card
            className="p-3"
            style={{
              border: `2px solid ${borderColor}`,
              backgroundColor: cardBg,
            }}
          >
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: textColor }}>
                    Detected By
                  </Form.Label>
                  <ReactSelect
                    classNamePrefix="rs"
                    options={detectedByOptions}
                    value={form.detectedBy}
                    onChange={handleDetectedByChange}
                    placeholder="-- Select --"
                    isClearable
                  />
                </Form.Group>
                {form.detectedBy?.value === "Other" && (
                  <Form.Group className="mt-2">
                    <Form.Label style={{ color: textColor }}>
                      Please specify
                    </Form.Label>
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
                  <Form.Label style={{ color: textColor }}>
                    Time Detected
                  </Form.Label>
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

          {/* ===== Buttons ===== */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <RBButton
              type="submit"
              variant="primary"
              size="lg"
            >
              Save Changes
            </RBButton>
            <RBButton
              variant="secondary"
              size="lg"
              onClick={() => {
                setModalType("");
                setSelectedTicket(null);
              }}
            >
              Cancel
            </RBButton>
          </div>
        </Card>
      </Form>
    </Box>
  );


// ===============================
// CASE: RESOLVE TICKET MODAL
// ===============================
case "resolve":
  return (
    <Box sx={{ p: 4, bgcolor: "background.paper" }}>
      {/* ===== Modal Title ===== */}
      <Typography variant="h6" gutterBottom>
        Resolve Ticket
      </Typography>

      <Form>
        {/* Resolution Summary */}
        <Form.Group className="mb-3">
          <Form.Label>Resolution Summary</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={form.resolution_summary || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                resolution_summary: e.target.value,
              }))
            }
            placeholder="Enter resolution details"
          />
        </Form.Group>

        {/* Resolution Time */}
        <Form.Group className="mb-3">
          <Form.Label>Resolution Time</Form.Label>
          <Form.Control
            type="datetime-local"
            value={form.resolution_time || ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                resolution_time: e.target.value,
              }))
            }
          />
        </Form.Group>

        {/* SLA Breach */}
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="SLA Breach"
            checked={form.sla_breach === "Yes"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sla_breach: e.target.checked ? "Yes" : "No",
              }))
            }
          />
        </Form.Group>

        {/* Post Incident Review */}
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Post Incident Review"
            checked={form.post_review === "Yes"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                post_review: e.target.checked ? "Yes" : "No",
              }))
            }
          />
        </Form.Group>

        {/* ===== Action Buttons ===== */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <RBButton
            variant="secondary"
            size="lg"
            onClick={() => setModalType("")}
          >
            Close
          </RBButton>

          <RBButton
            variant="success"
            size="lg"
            onClick={async () => {
              try {
                const output = {
                  ...selectedTicket,   // ✅ preserve all fields
                  ...form,             // ✅ overwrite with resolve fields
                  status: "Resolved",  // ✅ enforce resolved
                };

                await axios.put(
                  `http://192.168.0.3:8000/api/tickets/${selectedTicket.ticket_id}`,
                  output
                );

                // 🔹 Update full list
                setAllTickets((prev) =>
                  prev.map((t) =>
                    t.ticket_id === selectedTicket.ticket_id
                      ? { ...t, ...output }
                      : t
                  )
                );

                // 🔹 Update normalized table
                setTickets((prev) =>
                  prev.map((t) =>
                    t.ticketId === selectedTicket.ticket_id
                      ? { ...t, status: "Resolved" }
                      : t
                  )
                );

                setModalType("");
                setSelectedTicket(null);
              } catch (err) {
                console.error("Error resolving ticket:", err);
                alert("Failed to resolve ticket. Please try again.");
              }
            }}
          >
            Resolve Ticket
          </RBButton>
        </div>
      </Form>
    </Box>
  );
    default:
      return null;
  }
};
 
//TITLE LOGO THEMES
return (
    <Box sx={{ p: 2 }}>
      {/* 🔹 Title + Logo + Theme Switch */}
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems="center"
      spacing={2}
      justifyContent="space-between"
      sx={{ mb: 2 }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <img
          src={KasiLogo}
          alt="Kasi"
          style={{
            height: "80px",
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
          }}
        />
        <Box>
          <Typography variant="h6">Kasi Cloud Data Centers</Typography>
          <Typography variant="body2" color="text.secondary">
            Incident Tickets
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={theme === "dark"}
              onChange={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
            />
          }
          label={theme === "dark" ? <DarkMode /> : <LightMode />}
        />
      </Stack>
    </Stack>
{/* ============================
   FILTER BAR SECTION
   ============================
   This <Box> contains all filter controls
   (search, building, priority, status, date, sorting).
   It uses flexbox with wrapping + gap for responsive layout.
*/}
{/* 🔹 Filter + Action Bar */}
<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", mb: 2 }}>
 {/* 🔹 Left: Filters */}
<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>

  {/* 🔹 Search by Ticket ID */}
  <TextField
    label="Search Ticket ID"                 // Input label shown above field
    value={filter.ticketId}                  // Controlled input bound to filter state
    onChange={(e) => handleFilterChange("ticketId", e.target.value)}
    size="small"                             // Makes input compact
    sx={{ minWidth: 180 }}                   // Prevent input from shrinking too much
  />

  {/* 🔹 Filter by Building */}
  <FormControl size="small" sx={{ minWidth: 140 }}>
    <InputLabel>Building</InputLabel>
    <Select
      value={filter.building}
      onChange={(e) => handleFilterChange("building", e.target.value)}
    >
      <MenuItem value="">All</MenuItem>      {/* Default option = no filter */}
      <MenuItem value="LOS1">LOS1</MenuItem>
      <MenuItem value="LOS2">LOS2</MenuItem>
      <MenuItem value="LOS3">LOS3</MenuItem>
      <MenuItem value="LOS4">LOS4</MenuItem>
      <MenuItem value="LOS5">LOS5</MenuItem>
    </Select>
  </FormControl>

  {/* 🔹 Filter by Priority */}
  <FormControl size="small" sx={{ minWidth: 140 }}>
    <InputLabel>Priority</InputLabel>
    <Select
      value={filter.priority}
      onChange={(e) => handleFilterChange("priority", e.target.value)}
    >
      <MenuItem value="">All</MenuItem>      {/* Default = show all priorities */}
      <MenuItem value="P0">P0</MenuItem>
      <MenuItem value="P1">P1</MenuItem>
      <MenuItem value="P2">P2</MenuItem>
      <MenuItem value="P3">P3</MenuItem>
      <MenuItem value="P4">P4</MenuItem>
    </Select>
  </FormControl>

  {/* 🔹 Filter by Status */}
  <FormControl size="small" sx={{ minWidth: 140 }}>
    <InputLabel>Status</InputLabel>
    <Select
      value={filter.status}
      onChange={(e) => handleFilterChange("status", e.target.value)}
    >
      <MenuItem value="">All</MenuItem>       {/* Default = no status filter */}
      <MenuItem value="Open">Open</MenuItem>
      <MenuItem value="In Progress">In Progress</MenuItem>
      <MenuItem value="Resolved">Resolved</MenuItem>
      <MenuItem value="Closed">Closed</MenuItem>
    </Select>
  </FormControl>

{/* 🔹 Date Range Picker (as icon with tooltip) */}
<Tooltip 
  // Tooltip shows current selection OR fallback text
  title={
    filter.dateRange[0] && filter.dateRange[1]
      ? `${filter.dateRange[0].toISOString().split("T")[0]} - ${filter.dateRange[1].toISOString().split("T")[0]}`
      : "Select Date Range"
  }
>
  {/* Icon that opens date picker */}
  <IconButton
    onClick={(e) => setDateAnchor(e.currentTarget)}  // open Menu anchored to icon
    color="primary"
  >
    <DateRangeIcon />  {/* calendar icon */}
  </IconButton>
</Tooltip>

{/* Pop-up menu containing the DatePicker */}
<Menu
  anchorEl={dateAnchor}             // anchor = clicked icon
  open={Boolean(dateAnchor)}        // visible when anchor is set
  onClose={() => setDateAnchor(null)} // close when clicked outside
>
  <Box sx={{ p: 2 }}>
    {/* React DatePicker in range mode */}
    <DatePicker
      selectsRange
      startDate={filter.dateRange[0]}   // controlled by state
      endDate={filter.dateRange[1]}
      onChange={(update) => {
        setFilter((prev) => ({ ...prev, dateRange: update })); // update filter
      }}
      inline   // render calendar inline inside popup
    />
  {/* 🔹 Custom Footer: Done + Clear buttons */}
  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem" }}>
    <Button
      variant="outlined"   // not filled for Clear
      size="small"
      onClick={() => {
        handleFilterChange("dateRange", [null, null]); // reset filter
        setDateAnchor(null); // close popup
      }}
    >
      Clear
    </Button>
    <Button
      variant="contained"   // filled for Done
      size="small"
      onClick={() => setDateAnchor(null)} // just close
    >
      Done
    </Button>
    </Box>
  </Box>
</Menu>


  {/* 🔹 Sort by Date Button */}
    <IconButton
      size="small"
      sx={{
        height: "40px",
        width: "40px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
      onClick={handleSortDate}
    >
      <SortIcon fontSize="small" />
    </IconButton>
  </Box>


  {/* 🔹 Right: Action Buttons */}
  <Box sx={{ display: "flex", gap: 2, mt: { xs: 2, sm: 0 } }}>
    <Button variant="contained" onClick={handleCreateTicket}>
      Create New Ticket
    </Button>
    <CSVLink data={tickets} filename={"tickets.csv"} style={{ textDecoration: "none" }}>
      <Button variant="outlined">Export CSV</Button>
    </CSVLink>
  </Box>
</Box>


  {/* ============================ */}
  {/* TICKETS TABLE                */}
  {/* ============================ */}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket ID</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Sub-Category</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date Opened</TableCell>
              <TableCell>Date Closed</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.ticketId}>
                <TableCell>{ticket.ticketId}</TableCell>
                <TableCell>{ticket.category}</TableCell>
                <TableCell>{ticket.subCategory}</TableCell>
                <TableCell>{ticket.priority}</TableCell>
                <TableCell>{ticket.status}</TableCell>
                <TableCell>{ticket.dateOpened}</TableCell>
                <TableCell>{ticket.dateClosed}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => handleActionClick(e, ticket)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

<Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
  <MenuItem onClick={() => handleOpenModal("view")}>View More</MenuItem>
  <MenuItem onClick={() => handleOpenModal("assign")}>Assign Engineers</MenuItem>
  <MenuItem onClick={() => handleOpenModal("updateStatus")}>Update Status</MenuItem>
  <MenuItem onClick={() => handleOpenModal("edit")}>Edit</MenuItem>
  <MenuItem onClick={() => handleOpenModal("resolve")}>Resolve Ticket</MenuItem>
  <MenuItem
    onClick={() =>
      window.open(
        `http://192.168.0.3:8000/api/tickets/${selectedTicket.ticketId}/download`,
        "_blank"
      )
    }
  >
    Download PDF
  </MenuItem>
</Menu>

      <Modal open={!!modalType} onClose={() => setModalType("")}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          {modalBody()}
        </Box>
      </Modal>
    </Box>
  );
};

export default TicketsPage;
