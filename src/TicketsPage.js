// src/TicketsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Collapse,
  Typography,
  IconButton,
  Paper,
  Button,
  Stack,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";   // 👈 add this
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Download as DownloadIcon,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import ReactSelect from "react-select";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// import the logo with space in filename as requested
import KasiLogo from "./KasiLogo.jpeg";

/* ---------- engineer options (from your form) ---------- */
const assignedEngineerOptions = [
  { value: "Suleiman Abdulsalam", label: "Suleiman Abdulsalam" },
  { value: "Jesse Etuk", label: "Jesse Etuk" },
  { value: "Opeyemi Akintelure", label: "Opeyemi Akintelure" },
  { value: "Gbenga Mabadeje", label: "Gbenga Mabadeje" },
  { value: "Eloka Igbokwe", label: "Eloka Igbokwe" },
  { value: "Ifeoma Ndudim", label: "Ifeoma Ndudim" },
];

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "P0", label: "P0 - Catastrophic" },
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
];

/* helper to parse assigned_to field (CSV stores semicolon-separated) */
const parseAssigned = (raw) => {
  if (!raw && raw !== 0) return [];
  if (Array.isArray(raw)) return raw;
  // split by common separators
  return String(raw)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

// Convert ISO or timestamp string to "YYYY-MM-DD HH:mm:ss.SSS"
function formatDateTimeFrontend(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d)) return dt; // fallback if invalid date
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}



/* small reusable label-value row */
function RowKV({ label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

/* TicketRow: collapsible ticket with details and per-ticket PDF */
function TicketRow({ ticket, index, theme, onStatusChange, onEdit }) {
  const [open, setOpen] = useState(false);

  // create a DOM node content for PDF capture (off-screen)
  const createTicketNode = () => {
    const container = document.createElement("div");
    container.style.width = "800px";
    container.style.padding = "16px";
    container.style.background = theme === "dark" ? "#121212" : "#fff";
    container.style.color = theme === "dark" ? "#eee" : "#111";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.boxSizing = "border-box";

    // header
    const h = document.createElement("div");
    h.style.display = "flex";
    h.style.alignItems = "center";
    h.style.gap = "12px";
    h.style.flexWrap = "nowrap"; // prevent wrapping
    h.style.height = "auto"; // allow container to adjust height
    const img = document.createElement("img");
    img.src = KasiLogo;
    img.style.height = "80px"; // keeps the logo height consistent
    img.style.width = "auto"; // maintain aspect ratio
    img.style.maxWidth = "100%"; // prevent overflow/cropping
    img.style.objectFit = "contain"; // ensures the full logo fits
    img.style.display = "block"; // remove any extra inline spacing
    const title = document.createElement("div");
    title.innerText = `Ticket ${ticket.ticket_id}`;
    title.style.fontSize = "18px";
    title.style.fontWeight = "700";
    title.style.whiteSpace = "nowrap"; // prevent title from wrapping
    h.appendChild(img);
    h.appendChild(title);
    container.appendChild(h);

    // table-like content (include building)
    const fields = [
      "ticket_id",
      "category",
      "sub_category",
      "opened",
      "reported_by",
      "contact_info",
      "priority",
      "building",
      "location",
      "impacted",
      "description",
      "detectedBy",
      "time_detected",
      "root_cause",
      "actions_taken",
      "status",
      "assigned_to",
      "resolution_summary",
      "resolution_time",
      "duration",
      "post_review",
      "attachments",
      "escalation_history",
      "closed",
      "sla_breach",
    ];
    fields.forEach((f) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.padding = "6px 0";
      const k = document.createElement("div");
      k.style.width = "150px";
      k.style.fontWeight = "700";
      k.innerText = `${f}:`;
      const v = document.createElement("div");
      v.style.flex = "1";
      let val = ticket[f];
      if (f === "assigned_to") val = parseAssigned(val).join(", ");
      row.appendChild(k);
      row.appendChild(v);
      v.innerText = val ?? "";
      container.appendChild(row);
    });

    return container;
  };

  const handleDownload = async () => {
    try {
      const node = createTicketNode();
      // position off-screen
      node.style.position = "fixed";
      node.style.left = "-5000px";
      node.style.top = "0";
      document.body.appendChild(node);

      const canvas = await html2canvas(node, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = { width: canvas.width, height: canvas.height };
      const pxToMm = pdfWidth / imgProps.width;
      const imgHeightMm = imgProps.height * pxToMm;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightMm);
      } else {
        // add with page splitting
        let heightLeft = imgHeightMm;
        let position = 0;
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightMm);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeightMm);
          heightLeft -= pdfHeight;
        }
      }

      const nameSafe = (ticket.ticket_id || "ticket").replace(/\s+/g, "_");
      pdf.save(`${nameSafe}.pdf`);
      document.body.removeChild(node);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF (see console).");
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 1, mb: 1 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={{ width: 36, fontWeight: 700 }}>{index + 1}</Typography>

        <IconButton
          size="small"
          onClick={() => setOpen((s) => !s)}
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>

        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
          {/* small avatar to keep per-ticket branding but avoid duplicate header */}
          <Avatar src={KasiLogo} alt="Kasi" sx={{ width: 32, height: 32 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {ticket.ticket_id}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {ticket.category || "—"}
          </Typography>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={ticket.status || ""}
              onChange={(e) =>
                onStatusChange && onStatusChange(ticket, e.target.value)
              }
              displayEmpty
              inputProps={{ "aria-label": "status" }}
            >
              <MenuItem value="">— Status —</MenuItem>
              {statusOptions
                .filter((s) => s.value)
                .map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
           {formatDateTimeFrontend(ticket.opened)}
          </Typography>
        </Box>

        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          variant="outlined"
        >
          Download
        </Button>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Paper sx={{ p: 2, mt: 1 }}>
          <Box sx={{ position: "relative" }}>
            <Stack spacing={1}>
              <RowKV label="Category" value={ticket.category} />
              <RowKV label="Sub-category" value={ticket.sub_category} />
              <RowKV label="Opened" value={formatDateTimeFrontend(ticket.opened)} />
              <RowKV label="Reported By" value={ticket.reported_by} />
              <RowKV label="Contact Info" value={ticket.contact_info} />
              <RowKV label="Priority" value={ticket.priority} />
              <RowKV label="Building" value={ticket.building} />
              <RowKV label="Location" value={ticket.location} />
              <RowKV label="Impacted" value={ticket.impacted} />
              <RowKV label="Description" value={ticket.description} />
              <RowKV label="Detected By" value={ticket.detectedBy} />
              <RowKV label="Time Detected" value={formatDateTimeFrontend(ticket.time_detected)} />
              <RowKV label="Root Cause" value={ticket.root_cause} />
              <RowKV label="Actions Taken" value={ticket.actions_taken} />
              <RowKV
                label="Assigned To"
                value={parseAssigned(ticket.assigned_to).join(", ")}
              />
              <RowKV label="Resolution Summary" value={ticket.resolution_summary} />
              <RowKV label="Resolution Time" value={formatDateTimeFrontend(ticket.resolution_time)} />
              <RowKV label="Duration" value={ticket.duration} />
              <RowKV label="Post Review" value={ticket.post_review} />
              <RowKV
                label="Attachments"
                value={
                  ticket.attachments && ticket.attachments.length > 0
                    ? (
                        Array.isArray(ticket.attachments)
                          ? ticket.attachments
                          : String(ticket.attachments).split(';')
                      ).map((file, idx) => {
                        if (!file) return null; // skip empty entries
                        const url = `http://192.168.0.3:8000${file}`;
                        const name = file.split('/').pop();
                        return (
                          <Button
                            key={idx}
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ mr: 1 }}
                          >
                            {name}
                          </Button>
                        );
                      })
                    : "No attachments"
                }
              />
              <RowKV label="Escalation History" value={ticket.escalation_history} />
              <RowKV label="Closed" value={formatDateTimeFrontend(ticket.closed)} />
              <RowKV label="SLA Breach" value={ticket.sla_breach} />
            </Stack>

            {/* edit button, positioned bottom-right of the expanded panel */}
            <Button
              size="small"
              variant="contained"
              sx={{ position: "absolute", right: 12, bottom: 12 }}
              onClick={() => onEdit && onEdit(ticket)}
            >
              Edit
            </Button>
          </Box>
        </Paper>
      </Collapse>
    </Paper>
  );
}

/* ---------- main TicketsPage component ---------- */
export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [engineers, setEngineers] = useState([]); // array of values
  const [building, setBuilding] = useState(""); // <-- building filter state
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" or "oldest"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("tc_theme") || "light");

  // snackbar state for minor UX polish
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  // update ticket status (receives the ticket object now)
  const handleStatusChange = async (ticket, newStatus) => {
    if (!ticket) return;
    const identifier = ticket.id ?? ticket.ticket_id ?? ticket.id;
    // optimistic update
    const prevTickets = tickets;
    setTickets((prev) =>
      prev.map((t) => (t.ticket_id === ticket.ticket_id ? { ...t, status: newStatus } : t))
    );

    try {
      // try both likely endpoints: if your API expects DB id, use identifier
      await axios.put(`http://192.168.0.3:8000/api/tickets/${identifier}`, {
        status: newStatus,
      });

      // success feedback
      setSnack({ open: true, message: "Status updated", severity: "success" });
    } catch (err) {
      console.error("Failed to update status", err);
      // rollback
      setTickets(prevTickets);
      setSnack({ open: true, message: "Failed to update status. Try again.", severity: "error" });
    }
  };

  // navigate to edit form
  const handleEdit = (ticket) => {
    navigate("/frontend", { state: { ticketToEdit: ticket } });
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tc_theme", theme);
  }, [theme]);

  useEffect(() => {
    // fetch tickets from backend API
    axios
      .get("http://192.168.0.3:8000/api/tickets")
      .then((res) => {
        setTickets(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch tickets", err);
        setTickets([]);
      });
  }, []);

  // engineer select options (same as form)
  const engineerOptions = assignedEngineerOptions;

  // derived filtered list
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      // search across values
      if (search) {
        const q = search.toLowerCase();
        const any = Object.values(t).some((v) => String(v || "").toLowerCase().includes(q));
        if (!any) return false;
      }

      if (priority && (t.priority || "") !== priority) return false;
      if (status && (t.status || "") !== status) return false;
      if (building && (t.building || "") !== building) return false;

      if (engineers && engineers.length > 0) {
        const wanted = engineers.map((e) => e.value || e);
        const assigned = parseAssigned(t.assigned_to);
        // must match at least one of selected engineers
        const intersects = wanted.some((w) => assigned.includes(w));
        if (!intersects) return false;
      }

      if (startDate) {
        const d = t.opened ? new Date(t.opened) : null;
        if (!d || d < new Date(startDate + "T00:00:00")) return false;
      }
      if (endDate) {
        const d = t.opened ? new Date(t.opened) : null;
        if (!d || d > new Date(endDate + "T23:59:59")) return false;
      }

      return true;
    });
  }, [tickets, search, priority, status, engineers, startDate, endDate, building]);
  const sortedTickets = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.opened).getTime();
      const timeB = new Date(b.opened).getTime();
      return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
    });
  }, [filtered, sortOrder]);


  return (
    <Box sx={{ p: 2, width: "100%" }}>
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
                onChange={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              />
            }
            label={theme === "dark" ? <DarkMode /> : <LightMode />}
          />
        </Stack>
      </Stack>

{/* FILTER BAR */}
<Paper sx={{ p: 2, mb: 2 }}>
  <Grid container spacing={2} alignItems="center">
    <Grid item xs={12} sm={6} md>
      <TextField
        fullWidth
        label="Search (free text)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
      />
    </Grid>

    {/* Building filter dropdown (LOS1..LOS5) */}
    <Grid item xs={12} sm={6} md>
      <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Building</InputLabel>
        <Select value={building} label="Building" onChange={(e) => setBuilding(e.target.value)}>
          <MenuItem value="">All Buildings</MenuItem>
          <MenuItem value="LOS1">LOS1</MenuItem>
          <MenuItem value="LOS2">LOS2</MenuItem>
          <MenuItem value="LOS3">LOS3</MenuItem>
          <MenuItem value="LOS4">LOS4</MenuItem>
          <MenuItem value="LOS5">LOS5</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md>
      <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Priority</InputLabel>
        <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
          {priorityOptions.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md>
      <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
          {statusOptions.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md>
      <ReactSelect
        isMulti
        options={engineerOptions}
        value={engineers}
        onChange={(val) => setEngineers(val || [])}
        placeholder="Filter by engineers..."
      />
    </Grid>

    <Grid item xs={12} sm={6} md>
      <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Sort by Date</InputLabel>
        <Select
          value={sortOrder}
          label="Sort by Date"
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <MenuItem value="latest">Latest → Oldest</MenuItem>
          <MenuItem value="oldest">Oldest → Latest</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6} md>
      <TextField
        fullWidth
        label="Start date"
        type="date"
        size="small"
        InputLabelProps={{ shrink: true }}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
    </Grid>

    <Grid item xs={12} sm={6} md>
      <TextField
        fullWidth
        label="End date"
        type="date"
        size="small"
        InputLabelProps={{ shrink: true }}
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
    </Grid>

    {/* Clear & Export Buttons */}
    <Grid item xs={12} md="auto" sx={{ ml: "auto" }}>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          onClick={() => {
            setSearch("");
            setPriority("");
            setStatus("");
            setEngineers([]);
            setStartDate("");
            setEndDate("");
            setBuilding("");
          }}
        >
          Clear
        </Button>
<Button
  variant="contained"
  onClick={() => {
    const rows = tickets.map((t) => ({
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
      description: t.description,
      detectedBy: t.detectedBy,
      time_detected: t.time_detected,
      root_cause: t.root_cause,
      actions_taken: t.actions_taken,
      status: t.status,
      assigned_to: t.assigned_to,
      resolution_summary: t.resolution_summary,
      resolution_time: t.resolution_time,
      duration: t.duration,
      post_review: t.post_review,
      attachments: t.attachments,
      escalation_history: t.escalation_history,
      closed: t.closed,
      sla_breach: t.sla_breach,
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        Object.keys(rows[0] || {}).join(","), // headers
        ...rows.map((r) =>
          Object.values(r)
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `tickets_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }}
>
  Export CSV
</Button>
    
      </Stack>
    </Grid>
  </Grid>
</Paper>

      {/* LIST */}
      <Box>
       {sortedTickets.length === 0 ? (
  <Typography variant="body1">No tickets found.</Typography>
) : (
  sortedTickets.map((t, idx) => (
    <TicketRow
      key={t.ticket_id || idx}
      ticket={t}
      index={idx}
      theme={theme}
      onStatusChange={handleStatusChange}
      onEdit={handleEdit}
    />
  ))
)}
        
      </Box>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
