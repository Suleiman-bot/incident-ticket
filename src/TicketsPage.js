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

const TicketsPage = () => {
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
  const [modalType, setModalType] = useState(""); // "view" | "assign" | "updateStatus" | "edit" | "resolve"

  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchTickets();
  }, []);

const fetchTickets = async () => {
  try {
    const res = await axios.get("http://192.168.0.3:8000/api/tickets");
    console.log("Fetched tickets: ", res.data);

    const normalized = res.data.map((t) => ({
      ticketId: t.ticket_id,
      category: t.category,
      subCategory: t.sub_category,
      priority: t.priority,
      status: t.status,
      dateOpened: t.opened,   // correct field
      dateClosed: t.closed,   // correct field
    }));

    setTickets(normalized);
  } catch (err) {
    console.error("Error fetching tickets:", err);
  }
};




  const handleActionClick = (event, ticket) => {
    setAnchorEl(event.currentTarget);
    setSelectedTicket(ticket);
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
      case "view":
        return (
          <Box sx={{ p: 4, bgcolor: "background.paper" }}>
            <Typography variant="h6">Ticket Details</Typography>
            <pre>{JSON.stringify(selectedTicket, null, 2)}</pre>
            <Button onClick={() => setModalType("")}>Close</Button>
          </Box>
        );
      case "assign":
        return (
          <Box sx={{ p: 4, bgcolor: "background.paper" }}>
            <Typography variant="h6">Assign Engineers</Typography>
            <FormControl fullWidth>
              <Select
                multiple
                value={selectedTicket.assignedEngineers || []}
                onChange={(e) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    assignedEngineers: e.target.value,
                  })
                }
              >
                {/* Populate engineers list */}
                <MenuItem value="Engineer1">Engineer1</MenuItem>
                <MenuItem value="Engineer2">Engineer2</MenuItem>
              </Select>
            </FormControl>
            <Button onClick={() => setModalType("")}>Save</Button>
          </Box>
        );
      case "updateStatus":
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
            <Button onClick={() => setModalType("")}>Update</Button>
          </Box>
        );
      case "edit":
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
        <MenuItem onClick={() => handleOpenModal("assign")}>
          Assign Engineers
        </MenuItem>
        <MenuItem onClick={() => handleOpenModal("updateStatus")}>
          Update Status
        </MenuItem>
        <MenuItem onClick={() => handleOpenModal("edit")}>Edit</MenuItem>
        <MenuItem onClick={() => handleOpenModal("resolve")}>
          Resolution
        </MenuItem>
        <MenuItem
          onClick={() =>
            window.open(`/api/download/${selectedTicket.ticketId}`, "_blank")
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
