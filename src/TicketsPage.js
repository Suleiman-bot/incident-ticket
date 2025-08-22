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

// import the logo
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

/* helper to parse assigned_to field */
const parseAssigned = (raw) => {
  if (!raw && raw !== 0) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/* helper to render attachments */
const formatAttachments = (raw) => {
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw);
};

/* row helper */
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

/* TicketRow */
function TicketRow({ ticket, index, theme, onStatusChange, onEdit }) {
  const [open, setOpen] = useState(false);

  // build a node for PDF
  const createTicketNode = () => {
    const container = document.createElement("div");
    container.style.width = "800px";
    container.style.padding = "16px";
    container.style.background = theme === "dark" ? "#121212" : "#fff";
    container.style.color = theme === "dark" ? "#eee" : "#111";
    container.style.fontFamily = "Arial, sans-serif";

    const h = document.createElement("div");
    h.style.display = "flex";
    h.style.alignItems = "center";
    h.style.gap = "12px";
    const img = document.createElement("img");
    img.src = KasiLogo;
    img.style.height = "80px";
    img.style.width = "auto";
    const title = document.createElement("div");
    title.innerText = `Ticket ${ticket.ticket_id}`;
    title.style.fontSize = "18px";
    title.style.fontWeight = "700";
    h.appendChild(img);
    h.appendChild(title);
    container.appendChild(h);

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
      if (f === "attachments") val = formatAttachments(val);
      v.innerText = val ?? "";
      row.appendChild(k);
      row.appendChild(v);
      container.appendChild(row);
    });

    return container;
  };

  const handleDownload = async () => {
    try {
      const node = createTicketNode();
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
          <Box sx={{ position: "relative" }}>
            <Stack spacing={1}>
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
              <RowKV
                label="Assigned To"
                value={parseAssigned(ticket.assigned_to).join(", ")}
              />
              <RowKV label="Resolution Summary" value={ticket.resolution_summary} />
              <RowKV label="Resolution Time" value={ticket.resolution_time} />
              <RowKV label="Duration" value={ticket.duration} />
              <RowKV label="Post Review" value={ticket.post_review} />
              <RowKV
                label="Attachments"
                value={formatAttachments(ticket.attachments)}
              />
              <RowKV label="Escalation History" value={ticket.escalation_history} />
              <RowKV label="Closed" value={ticket.closed} />
              <RowKV label="SLA Breach" value={ticket.sla_breach} />
            </Stack>

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
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    assigned_to: [],
  });
  const [theme, setTheme] = useState("light");
  const [snackbar, setSnackbar] = useState(null);
  const navigate = useNavigate();

  const loadTickets = async () => {
    try {
      const res = await axios.get("/api/tickets");
      setTickets(res.data || []);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (
        filters.assigned_to.length &&
        !filters.assigned_to.some((a) =>
          parseAssigned(t.assigned_to).includes(a)
        )
      )
        return false;
      return true;
    });
  }, [tickets, filters]);

  const handleStatusChange = async (ticket, newStatus) => {
    try {
      await axios.put(`/api/tickets/${ticket.ticket_id}`, {
        ...ticket,
        status: newStatus,
      });
      setSnackbar({ message: "Status updated", severity: "success" });
      loadTickets();
    } catch {
      setSnackbar({ message: "Failed to update status", severity: "error" });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Tickets
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            />
          }
          label={theme === "dark" ? <DarkMode /> : <LightMode />}
        />
        <Button
          variant="contained"
          onClick={() => navigate("/new")}
          sx={{ ml: "auto" }}
        >
          New Ticket
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filters.priority}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priority: e.target.value }))
            }
            input={<OutlinedInput label="Priority" />}
          >
            {priorityOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            input={<OutlinedInput label="Status" />}
          >
            {statusOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ minWidth: 240 }}>
          <ReactSelect
            isMulti
            options={assignedEngineerOptions}
            value={assignedEngineerOptions.filter((o) =>
              filters.assigned_to.includes(o.value)
            )}
            onChange={(vals) =>
              setFilters((f) => ({
                ...f,
                assigned_to: vals.map((v) => v.value),
              }))
            }
            placeholder="Filter by Assigned"
          />
        </Box>
      </Box>

      {filteredTickets.map((t, i) => (
        <TicketRow
          key={t.ticket_id}
          ticket={t}
          index={i}
          theme={theme}
          onStatusChange={handleStatusChange}
          onEdit={(ticket) => navigate(`/edit/${ticket.ticket_id}`)}
        />
      ))}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
      >
        {snackbar && (
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        )}
      </Snackbar>
    </Box>
  );
}
