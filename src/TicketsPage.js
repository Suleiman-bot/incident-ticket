// TicketsPage.js
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid } from '@mui/material';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null); // Modal state

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
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'assigned_to', headerName: 'Assigned To', width: 150 },
  ];

  const rows = filteredTickets.map(t => ({ id: t.ticket_id, ...t }));

  // Handle row click
  const handleRowClick = (params) => {
    setSelectedTicket(params.row);
  };

  const handleClose = () => setSelectedTicket(null);

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
        onRowClick={handleRowClick} // Row click opens modal
      />

      {/* Modal for ticket details */}
      <Dialog open={!!selectedTicket} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Ticket Details</DialogTitle>
        <DialogContent dividers>
          {selectedTicket && (
            <Grid container spacing={2}>
              {Object.entries(selectedTicket).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Typography variant="subtitle2" color="textSecondary">{key.replace('_', ' ').toUpperCase()}</Typography>
                  <Typography variant="body1">{String(value)}</Typography>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
