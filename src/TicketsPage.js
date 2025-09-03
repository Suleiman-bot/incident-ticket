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
const assignedEngineerOptions = [
  { value: "Suleiman Abdulsalam", label: "Suleiman Abdulsalam" },
  { value: "Jesse Etuk", label: "Jesse Etuk" },
  { value: "Opeyemi Akintelure", label: "Opeyemi Akintelure" },
  { value: "Gbenga Mabadeje", label: "Gbenga Mabadeje" },
  { value: "Eloka Igbokwe", label: "Eloka Igbokwe" },
  { value: "Ifeoma Ndudim", label: "Ifeoma Ndudim" },
];

const TicketsPage = ({ theme, setTheme }) => {
  // state, hooks, etc...
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState({
    ticketId: "",
    building: "",
    priority: "",
    status: "",
    dateRange: [null, null],
  });
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





  const handleActionClick = (event, ticket) => {
    setAnchorEl(event.currentTarget);
    // 🔹 PATCH 4: Find full ticket object by ticketId
const fullTicket = allTickets.find(t => t.ticket_id === ticket.ticketId);
setSelectedTicket(fullTicket);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    handleCloseMenu();
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
      [...prev].sort((a, b) => new Date(a.dateOpened) - new Date(b.dateOpened))
    );
  };

  const handleCreateTicket = () => {
    navigate("/create-ticket");
  };

  const modalBody = () => {
    if (!selectedTicket) return null;

    switch (modalType) {
      case "view": //View More
  return (
<Box sx={{ p: 4, bgcolor: "background.paper" }}>
  <Typography variant="h6" gutterBottom>Ticket Details</Typography>

  {selectedTicket && (
    <div style={{ display: 'grid', rowGap: 8 }}>
      <div><strong>Ticket ID:</strong> {selectedTicket.ticket_id}</div>
      <div><strong>Category:</strong> {selectedTicket.category}</div>
      <div><strong>Sub Category:</strong> {selectedTicket.sub_category}</div>
      <div><strong>Priority:</strong> {selectedTicket.priority}</div>
      <div><strong>Status:</strong> {selectedTicket.status}</div>
      <div><strong>Date Opened:</strong> {selectedTicket.opened}</div>
      <div><strong>Date Closed:</strong> {selectedTicket.closed || '-'}</div>
      <div><strong>Building:</strong> {selectedTicket.building}</div>
      <div><strong>Location:</strong> {selectedTicket.location}</div>
      <div><strong>Impacted Systems/Services:</strong> {selectedTicket.impacted}</div>
      <div><strong>Description:</strong> {selectedTicket.description}</div>
      <div><strong>Detected By:</strong> {selectedTicket.detectedBy}</div>
      <div><strong>Time Detected:</strong> {selectedTicket.time_detected}</div>
      <div><strong>Root Cause:</strong> {selectedTicket.root_cause}</div>
      <div><strong>Actions Taken:</strong> {selectedTicket.actions_taken}</div>
      <div><strong>Assigned To:</strong> {selectedTicket.assigned_to}</div>
      <div><strong>Resolution Summary:</strong> {selectedTicket.resolution_summary}</div>
      <div><strong>Resolution Time:</strong> {selectedTicket.resolution_time}</div>
      <div><strong>SLA Breach:</strong> {selectedTicket.sla_breach}</div>
      <div><strong>Post Review:</strong> {selectedTicket.post_review}</div>
    </div>
  )}

  <Button onClick={() => setModalType("")} sx={{ mt: 2 }}>Close</Button>
</Box>

  );

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
<Button
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
      case "edit":    //Edit Button
        return (
          <Box sx={{ p: 4, bgcolor: "background.paper" }}>
            <Typography variant="h6">Edit Ticket</Typography>
            <TextField
              label="Category"
              fullWidth
              value={selectedTicket.category}
              onChange={(e) =>
                setSelectedTicket({ ...selectedTicket, category: e.target.value })
              }
            />
            {/* Add other fields similarly */}
            <Button onClick={() => setModalType("")}>Save</Button>
          </Box>
        );
      case "resolve":
        return (
          <Box sx={{ p: 4, bgcolor: "background.paper" }}>
            <Typography variant="h6">Resolve Incident</Typography>
            <TextField
              label="Resolution Summary"
              fullWidth
              multiline
              rows={3}
            />
            <FormControl>
              <Select>
                <MenuItem value="Yes">SLA Breach</MenuItem>
                <MenuItem value="No">No Breach</MenuItem>
              </Select>
            </FormControl>
            <Button onClick={() => setModalType("")}>Resolve</Button>
          </Box>
        );
      default:
        return null;
    }
  };

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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Search Ticket ID"
            value={filter.ticketId}
            onChange={(e) => handleFilterChange("ticketId", e.target.value)}
          />
          <FormControl>
            <InputLabel>Building</InputLabel>
            <Select
              value={filter.building}
              onChange={(e) => handleFilterChange("building", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="LOS1">LOS1</MenuItem>
              <MenuItem value="LOS2">LOS2</MenuItem>
              <MenuItem value="LOS3">LOS3</MenuItem>
              <MenuItem value="LOS4">LOS4</MenuItem>
              <MenuItem value="LOS5">LOS5</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filter.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="P0">P0</MenuItem>
              <MenuItem value="P1">P1</MenuItem>
              <MenuItem value="P2">P2</MenuItem>
              <MenuItem value="P3">P3</MenuItem>
              <MenuItem value="P4">P4</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
            selectsRange
            startDate={filter.dateRange[0]}
            endDate={filter.dateRange[1]}
            onChange={(update) =>
              handleFilterChange("dateRange", update)
            }
            isClearable
            placeholderText="Select date range"
          />
          <Button onClick={handleSortDate}>Sort Date</Button>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleCreateTicket}>
            Create New Ticket
          </Button>
          <CSVLink data={tickets} filename={"tickets.csv"}>
            <Button variant="outlined">Export CSV</Button>
          </CSVLink>
        </Box>
      </Box>

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
  <MenuItem onClick={() => handleOpenModal("resolve")}>Resolution</MenuItem>
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
