// src/TicketsPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "./Kasi Logo.jpeg"; // same logo as ticket form
import "./TicketsPage.css"; // optional custom styling

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    engineer: "",
    startDate: "",
    endDate: "",
  });
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    axios
      .get("/api/data/tickets.csv")
      .then((res) => {
        const lines = res.data.split("\n").filter((line) => line.trim() !== "");
        const headers = lines[0].split(",");
        const data = lines.slice(1).map((line) => {
          const values = line.split(",");
          let ticket = {};
          headers.forEach((h, i) => (ticket[h] = values[i] ?? ""));
          return ticket;
        });
        setTickets(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredTickets = tickets.filter((t) => {
    let pass = true;
    if (filters.priority && t.priority !== filters.priority) pass = false;
    if (filters.status && t.status !== filters.status) pass = false;
    if (filters.engineer && !t.assigned_to.includes(filters.engineer)) pass = false;
    if (filters.startDate && new Date(t.opened) < new Date(filters.startDate)) pass = false;
    if (filters.endDate && new Date(t.opened) > new Date(filters.endDate)) pass = false;
    return pass;
  });

  const downloadPDF = (ticket) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Ticket ID: ${ticket.ticket_id}`, 14, 20);
    doc.autoTable({
      startY: 30,
      head: [["Field", "Value"]],
      body: Object.entries(ticket).map(([key, value]) => [key, value]),
    });
    doc.save(`ticket_${ticket.ticket_id}.pdf`);
  };

  return (
    <div className={`tickets-page ${theme}`}>
      <header className="header">
        <img src={logo} alt="Logo" className="logo" />
        <h1>Kasi Cloud Data Centers Incident Tickets</h1>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          Toggle {theme === "light" ? "Dark" : "Light"} Theme
        </button>
      </header>

      <div className="filters">
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Closed">Closed</option>
        </select>

        <select name="engineer" value={filters.engineer} onChange={handleFilterChange}>
          <option value="">All Engineers</option>
          {Array.from(new Set(tickets.flatMap((t) => t.assigned_to.split("|")))).map((eng) => (
            <option key={eng} value={eng}>
              {eng}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
      </div>

      <table className="tickets-table">
        <thead>
          <tr>
            <th>#</th>
            {Object.keys(tickets[0] || {}).map((field) => (
              <th key={field}>{field}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.map((ticket, index) => (
            <React.Fragment key={ticket.ticket_id}>
              <tr>
                <td>{index + 1}</td>
                {Object.keys(ticket).map((field) => (
                  <td key={field}>{ticket[field]}</td>
                ))}
                <td>
                  <button onClick={() => downloadPDF(ticket)}>Download PDF</button>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketsPage;
