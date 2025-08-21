// TicketsPage.js
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, Collapse, Typography, IconButton, Paper } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axios from 'axios';

function TicketRow({ ticket }) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <Box display="flex" alignItems="center">
        <IconButton size="small" onClick={() => setOpen(!open)}>
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
        <Box flex={1}>
          <Typography variant="body2">{ticket.ticket_id} - {ticket.category} - {ticket.status}</Typography>
        </Box>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Paper elevation={2} sx={{ p: 2, my: 1 }}>
          <Typography><strong>Sub-Category:</strong> {ticket.sub_category}</Typography>
          <Typography><strong>Opened:</strong> {ticket.opened}</Typography>
          <Typography><strong>Reported By:</strong> {ticket.reported_by}</Typography>
          <Typography><strong>Contact Info:</strong> {ticket.contact_info}</Typography>
          <Typography><strong>Priority:</strong> {ticket.priority}</Typography>
          <Typography><strong>Location:</strong> {ticket.location}</Typography>
          <Typography><strong>Impacted:</strong> {ticket.impacted}</Typography>
          <Typography><strong>Description:</strong> {ticket.description}</Typography>
          <Typography><strong>Detected By:</strong> {ticket.detectedBy}</Typography>
          <Typography><strong>Time Detected:</strong> {ticket.time_detected}</Typography>
          <Typography><strong>Root Cause:</strong> {ticket.root_cause}</Typography>
          <Typography><strong>Actions Taken:</strong> {ticket.actions_taken}</Typography>
          <Typography><strong>Assigned To:</strong> {ticket.assigned_to}</Typography>
          <Typography><strong>Resolution Summary:</strong> {ticket.resolution_summary}</Typography>
          <Typography><strong>Resolution Time:</strong> {ticket.resolution_time}</Typography>
          <Typography><strong>Duration:</strong> {ticket.duration}</Typography>
          <Typography><strong>Post Review:</strong> {ticket.post_review}</Typography>
          <Typography><strong>Attachments:</strong> {ticket.attachments}</Typography>
          <Typography><strong>Escalation History:</strong> {ticket.escalation_history}</Typography>
          <Typography><strong>Closed:</strong> {ticket.closed}</Typography>
          <Typography><strong>SLA Breach:</strong> {ticket.sla_breach}</Typography>
        </Paper>
      </Collapse>
    </React.Fragment>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('http://192.168.0.3:8000/api/tickets')
      .then(res => {
        setTickets(res.data);
        setFilteredTickets(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!search) return setFilteredTickets(tickets);
    const lower = search.toLowerCase();
    setFilteredTickets(
      tickets.filter(t =>
        Object.values(t).some(v =>
          String(v).toLowerCase().includes(lower)
        )
      )
    );
  }, [search, tickets]);

  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <TextField
        label="Search Tickets"
        variant="outlined"
        fullWidth
        margin="normal"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filteredTickets.map(ticket => (
        <TicketRow key={ticket.ticket_id} ticket={ticket} />
      ))}
    </Box>
  );
}
