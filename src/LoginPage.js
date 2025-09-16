// src/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons"; // 👈 install: npm i react-bootstrap-icons
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔑 Dummy login (replace later with backend API)
    if (username === "admin" && password === "password") {
      localStorage.setItem("isLoggedIn", "true"); // persist login
      navigate("/ticketspage");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "400px" }} className="p-4 shadow-lg">
        <h3 className="mb-4 text-center">Login</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

<Form.Group className="mb-3" controlId="formPassword">
  <Form.Label>Password</Form.Label>
  <div className="d-flex align-items-center">
    <Form.Control
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
    <Button
      variant="outline-secondary"
      onClick={() => setShowPassword(!showPassword)}
      style={{ marginLeft: "8px" }}
    >
      {showPassword ? <EyeSlashFill /> : <EyeFill />}
    </Button>
  </div>
</Form.Group>

          <Button variant="primary" type="submit" className="w-100">
            Login
          </Button>
        </Form>
      </Card>
    </Container>
  );
}
