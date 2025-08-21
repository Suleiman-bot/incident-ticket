// src/TicketsPage.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Collapse,
  Typography,
  IconButton,
  Paper,
  Button,
  Stack
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Download } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function TicketRow({ ticket }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ mb: 1 }}>
      <Box display="flex" alignItems="center" sx={{ px: 1 }}>
        <IconButton size="small" onClick={() => setOpen(!open)} aria-label="expand row">
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
        <Box flex={1}>
          <Typography variant="subtitle1">
            <strong>{ticket.ticket_id}</strong> — {ticket.category || '—'} <Typography component="span" sx={{ ml: 1, color: 'text.secondary' }}>({ticket.status || '—'})</Typography>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reported by: {ticket.reported_by || '—'} • Priority: {ticket.priority || '—'}
          </Typography>
        </Box>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Paper elevation={1} sx={{ p: 2, m: 1 }}>
          <Stack spacing={1}>
            <Typography variant="body2"><strong>Sub-Category:</strong> {ticket.sub_category || '—'}</Typography>
            <Typography variant="body2"><strong>Opened:</strong> {ticket.opened || '—'}</Typography>
            <Typography variant="body2"><strong>Contact:</strong> {ticket.contact_info || '—'}</Typography>
            <Typography variant="body2"><strong>Location:</strong> {ticket.location || '—'}</Typography>
            <Typography variant="body2"><strong>Impacted:</strong> {ticket.impacted || '—'}</Typography>
            <Typography variant="body2"><strong>Description:</strong> {ticket.description || '—'}</Typography>
            <Typography variant="body2"><strong>Actions Taken:</strong> {ticket.actions_taken || '—'}</Typography>
            <Typography variant="body2"><strong>Assigned To:</strong> {ticket.assigned_to || '—'}</Typography>
            <Typography variant="body2"><strong>Attachments:</strong> {ticket.attachments || '—'}</Typography>
            <Typography variant="body2"><strong>Escalation History:</strong> {ticket.escalation_history || '—'}</Typography>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [search, setSearch] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    axios.get('http://192.168.0.3:8000/api/tickets')
      .then(res => {
        setTickets(res.data || []);
        setFilteredTickets(res.data || []);
      })
      .catch(err => console.error('Failed to fetch tickets', err));
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredTickets(tickets);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredTickets(
      tickets.filter(t =>
        Object.values(t).some(v =>
          String(v || '').toLowerCase().includes(lower)
        )
      )
    );
  }, [search, tickets]);

  // Download visible list area to PDF
  const handleDownloadPDF = async () => {
    const el = listRef.current;
    if (!el) return;

    try {
      // Increase scale for better resolution
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // image dimensions in mm
      const imgProps = canvas;
      const imgWidthPx = imgProps.width;
      const imgHeightPx = imgProps.height;
      const pxToMm = pdfWidth / imgWidthPx;
      const imgHeightMm = imgHeightPx * pxToMm;

      // if the content fits on a single page
      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm);
      } else {
        // split into pages
        let heightLeft = imgHeightMm;
        let position = 0;
        // convert canvas to image and add slices by adjusting y offset
        // We'll add the full image and shift using addImage with negative y position on subsequent pages
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMm);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightMm);
          heightLeft -= pdfHeight;
        }
      }

      pdf.save(`tickets_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <TextField
          label="Search Tickets"
          variant="outlined"
          fullWidth
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<Download />} onClick={handleDownloadPDF}>
            Download PDF
          </Button>
        </Stack>
      </Stack>

      {/* area that will be captured for PDF */}
      <Box ref={listRef}>
        {filteredTickets.length === 0 ? (
          <Typography variant="h6" sx={{ mt: 2 }}>No tickets found.</Typography>
        ) : (
          filteredTickets.map(ticket => (
            <TicketRow key={ticket.ticket_id} ticket={ticket} />
          ))
        )}
      </Box>
    </Box>
  );
}
