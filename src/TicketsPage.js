import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  IconButton,
  CssBaseline,
  Switch,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme, ThemeProvider, createTheme } from "@mui/material/styles";
import { fetchTickets, updateTicketStatus } from "./apiService";

const parseAssigned = (assigned) => {
  if (!assigned) return [];
  return Array.isArray(assigned)
    ? assigned
    : String(assigned)
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean);
};

const parseAttachments = (raw) => {
  if (!raw) return [];
  return Array.isArray(raw)
    ? raw
    : String(raw)
        .split(/[;,|]/)
        .map((s) => s.trim())
        .filter(Boolean);
};

const TicketRow = ({ ticket, onStatusChange }) => {
  const ticketRef = useRef();

  const handleDownload = async () => {
    const [html2canvasLib, jsPDFLib] = await Promise.all([
      import("html2canvas").then((m) => m.default),
      import("jspdf").then((m) => m.default),
    ]);

    const input = ticketRef.current;
    const canvas = await html2canvasLib(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDFLib("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    if (imgHeight > pageHeight) {
      let heightLeft = imgHeight - pageHeight;
      position = -pageHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }
    }
    pdf.save(`ticket_${ticket.ticket_id || ticket.id}.pdf`);
  };

  return (
    <TableRow ref={ticketRef}>
      <TableCell>{ticket.ticket_id}</TableCell>
      <TableCell>{ticket.category}</TableCell>
      <TableCell>{ticket.sub_category}</TableCell>
      <TableCell>{ticket.opened}</TableCell>
      <TableCell>{ticket.reported_by}</TableCell>
      <TableCell>{ticket.contact_info}</TableCell>
      <TableCell>{ticket.priority}</TableCell>
      <TableCell>{ticket.building}</TableCell>
      <TableCell>{ticket.location}</TableCell>
      <TableCell>{ticket.impacted}</TableCell>
      <TableCell>{ticket.impact_description}</TableCell>
      <TableCell>{ticket.department}</TableCell>
      <TableCell>{ticket.issue}</TableCell>
      <TableCell>
        {parseAttachments(ticket.attachment).map((att, i) => (
          <a
            key={i}
            href={att}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "block" }}
          >
            Attachment {i + 1}
          </a>
        ))}
      </TableCell>
      <TableCell>{parseAssigned(ticket.assigned).join(", ")}</TableCell>
      <TableCell>{ticket.status}</TableCell>
      <TableCell>{ticket.updated}</TableCell>
      <TableCell>
        <FormControl size="small">
          <Select
            value={ticket.status}
            onChange={(e) =>
              onStatusChange(ticket.id, e.target.value)
            }
          >
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
        </FormControl>
      </TableCell>
      <TableCell>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </TableCell>
    </TableRow>
  );
};

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [engineerFilter, setEngineerFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [darkMode, setDarkMode] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchTickets();
        setTickets(data);
      } catch {
        setError("Failed to load tickets.");
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      await updateTicketStatus(ticketId, newStatus);
      setSnackbar({ open: true, message: "Ticket status updated successfully!" });
    } catch {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: t.status } : t
        )
      );
      setSnackbar({ open: true, message: "Failed to update status." });
    }
  };

  const filteredTickets = tickets
    .filter((ticket) => !priorityFilter || ticket.priority === priorityFilter)
    .filter((ticket) => !statusFilter || ticket.status === statusFilter)
    .filter(
      (ticket) =>
        !engineerFilter ||
        parseAssigned(ticket.assigned).includes(engineerFilter)
    )
    .filter((ticket) => !buildingFilter || ticket.building === buildingFilter)
    .filter((ticket) => {
      if (dateFrom && new Date(ticket.opened) < new Date(dateFrom)) return false;
      if (dateTo && new Date(ticket.opened) > new Date(dateTo)) return false;
      return true;
    })
    .sort((a, b) => {
      const timeA = a.opened ? new Date(a.opened).getTime() : 0;
      const timeB = b.opened ? new Date(b.opened).getTime() : 0;
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      alert("No tickets to export.");
      return;
    }
    const rows = filteredTickets.map((t) => ({
      ticket_id: t.ticket_id,
      category: t.category,
      sub_category: t.sub_category,
      opened: t.opened,
      reported_by: t.reported_by,
      contact_info: t.contact_info,
      priority: t.priority,
      building: t.building,
      location: t.location,
      impacted: t.impacted,
      impact_description: t.impact_description,
      department: t.department,
      issue: t.issue,
      attachments: parseAttachments(t.attachment).join(" | "),
      assigned: parseAssigned(t.assigned).join(", "),
      status: t.status,
      updated: t.updated,
    }));

    const header = Object.keys(rows[0]).join(",");
    const csv =
      header +
      "\n" +
      rows.map((r) => Object.values(r).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "tickets.csv";
    link.click();
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <ThemeProvider
      theme={createTheme({ palette: { mode: darkMode ? "dark" : "light" } })}
    >
      <CssBaseline />
      <Container>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4">Tickets</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            }
            label={darkMode ? "Dark" : "Light"}
            labelPlacement="start"
          />
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          {/* Building Filter */}
          <FormControl size="small">
            <InputLabel>Building</InputLabel>
            <Select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              label="Building"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Headquarters">Headquarters</MenuItem>
              <MenuItem value="Annex">Annex</MenuItem>
              <MenuItem value="Remote Office">Remote Office</MenuItem>
              <MenuItem value="Branch A">Branch A</MenuItem>
              <MenuItem value="Branch B">Branch B</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              label="Priority"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Engineer"
            size="small"
            value={engineerFilter}
            onChange={(e) => setEngineerFilter(e.target.value)}
          />

          <TextField
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <TextField
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <FormControl size="small">
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              label="Sort"
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket ID</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Sub Category</TableCell>
              <TableCell>Opened</TableCell>
              <TableCell>Reported By</TableCell>
              <TableCell>Contact Info</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Building</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Impacted</TableCell>
              <TableCell>Impact Description</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Issue</TableCell>
              <TableCell>Attachments</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Change Status</TableCell>
              <TableCell>Download</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
              />
            ))}
          </TableBody>
        </Table>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbar({ ...snackbar, open: false })}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
      </Container>
    </ThemeProvider>
  );
};

export default TicketsPage;
