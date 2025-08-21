// TicketsPage.js
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Box, TextField } from '@mui/material';

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

  const columns = [
    { field: 'ticket_id', headerName: 'Ticket ID', width: 150 },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'sub_category', headerName: 'Sub-Category', width: 120 },
    { field: 'opened', headerName: 'Opened', width: 100 },
    { field: 'reported_by', headerName: 'Reported By', width: 130 },
    { field: 'contact_info', headerName: 'Contact Info', width: 150 },
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'location', headerName: 'Location', width: 120 },
    { field: 'impacted', headerName: 'Impacted', width: 150 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'detectedBy', headerName: 'Detected By', width: 130 },
    { field: 'time_detected', headerName: 'Time Detected', width: 150 },
    { field: 'root_cause', headerName: 'Root Cause', width: 150 },
    { field: 'actions_taken', headerName: 'Actions Taken', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'assigned_to', headerName: 'Assigned To', width: 150 },
    { field: 'resolution_summary', headerName: 'Resolution Summary', width: 200 },
    { field: 'resolution_time', headerName: 'Resolution Time', width: 150 },
    { field: 'duration', headerName: 'Duration', width: 100 },
    { field: 'post_review', headerName: 'Post Review', width: 120 },
    { field: 'attachments', headerName: 'Attachments', width: 200 },
    { field: 'escalation_history', headerName: 'Escalation History', width: 200 },
    { field: 'closed', headerName: 'Closed', width: 100 },
    { field: 'sla_breach', headerName: 'SLA Breach', width: 100 },
  ];

  const rows = filteredTickets.map(t => ({ id: t.ticket_id, ...t }));

  return (
    <Box sx={{ height: '80vh', width: '100%', padding: 2 }}>
      <TextField
        label="Search Tickets"
        variant="outlined"
        fullWidth
        margin="normal"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        disableSelectionOnClick
        autoHeight
      />
    </Box>
  );
}
