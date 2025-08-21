// src/TicketsPage.js
import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
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
function TicketRow({ ticket, index, theme }) {
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
    h.style.flexWrap = "nowrap";      // prevent wrapping
    h.style.height = "auto";          // allow container to adjust height
    const img = document.createElement("img");
    img.src = KasiLogo;
    img.style.height = "80px";       // keeps the logo height consistent
    img.style.width = "auto";        // maintain aspect ratio
    img.style.maxWidth = "100%";     // prevent overflow/cropping
    img.style.objectFit = "contain"; // ensures the full logo fits
    img.style.display = "block";     // remove any extra inline spacing
    const title = document.createElement("div");
    title.innerText = `Ticket ${ticket.ticket_id}`;
    title.style.fontSize = "18px";
    title.style.fontWeight = "700";
    title.style.whiteSpace = "nowrap"; // prevent title from wrapping
    h.appendChild(img);
    h.appendChild(title);
    container.appendChild(h);

    // table-like content
    const fields = [
      "ticket_id",
      "category",
      "sub_category",
      "opened",
      "reported_by",
      "contact_info",
      "priority",
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
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {ticket.ticket_id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ticket.category || "—"}
          </Typography>
          <Chip label={ticket.status || "—"} size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
            {ticket.opened ? new Date(ticket.opened).toLocaleString() : ""}
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
          <Stack spacing={1}>
            <RowKV label="Ticket ID" value={ticket.ticket_id} />
            <RowKV label="Category" value={ticket.category} />
            <RowKV label="Sub-category" value={ticket.sub_category} />
            <RowKV label="Opened" value={ticket.opened} />
            <RowKV label="Reported By" value={ticket.reported_by} />
            <RowKV label="Contact Info" value={ticket.contact_info} />
            <RowKV label="Priority" value={ticket.priority} />
            <RowKV label="Location" value={ticket.location} />
            <RowKV label="Impacted" value={ticket.impacted} />
            <RowKV label="Description" value={ticket.description} />
            <RowKV label="Detected By" value={ticket.detectedBy} />
            <RowKV label="Time Detected" value={ticket.time_detected} />
            <RowKV label="Root Cause" value={ticket.root_cause} />
            <RowKV label="Actions Taken" value={ticket.actions_taken} />
            <RowKV label="Status" value={ticket.status} />
            <RowKV label="Assigned To" value={parseAssigned(ticket.assigned_to).join(", ")} />
            <RowKV label="Resolution Summary" value={ticket.resolution_summary} />
            <RowKV label="Resolution Time" value={ticket.resolution_time} />
            <RowKV label="Duration" value={ticket.duration} />
            <RowKV label="Post Review" value={ticket.post_review} />
            <RowKV label="Attachments" value={ticket.attachments} />
            <RowKV label="Escalation History" value={ticket.escalation_history} />
            <RowKV label="Closed" value={ticket.closed} />
            <RowKV label="SLA Breach" value={ticket.sla_breach} />
          </Stack>
        </Paper>
      </Collapse>
    </Paper>
  );
}

/* ---------- main TicketsPage component ---------- */
export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [engineers, setEngineers] = useState([]); // array of values
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("tc_theme") || "light");

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
  }, [tickets, search, priority, status, engineers, startDate, endDate]);

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
    height: '80px', 
    width: 'auto', 
    maxWidth: '100%', 
    objectFit: 'contain' 
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Search (free text)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
              {priorityOptions.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ minWidth: 260 }}>
            <ReactSelect
              isMulti
              options={engineerOptions}
              value={engineers}
              onChange={(val) => setEngineers(val || [])}
              placeholder="Filter by engineers..."
            />
          </Box>

          <TextField
            label="Start date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="End date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch("");
                setPriority("");
                setStatus("");
                setEngineers([]);
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                // quick export visible tickets as CSV
                const rows = filtered.map((t) => ({
                  ticket_id: t.ticket_id,
                  category: t.category,
                  sub_category: t.sub_category,
                  opened: t.opened,
                  reported_by: t.reported_by,
                  contact_info: t.contact_info,
                  priority: t.priority,
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
                    Object.keys(rows[0] || {}).join(","),
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
        </Stack>
      </Paper>

      {/* LIST */}
      <Box>
        {filtered.length === 0 ? (
          <Typography variant="body1">No tickets found.</Typography>
        ) : (
          filtered.map((t, idx) => (
            <TicketRow key={t.ticket_id || `${idx}`} ticket={t} index={idx} theme={theme} />
          ))
        )}
      </Box>
    </Box>
  );
}
