import styles from "./App.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import 'react-toastify/dist/ReactToastify.css';

import { Navbar, Container, Nav } from "react-bootstrap";
import Bingo from "./components/Bingo";
import React, { useState } from "react";
import { useNavigate, BrowserRouter } from "react-router-dom";
import reveille from "./assets/reveille.png";

const renderNavbar = (onLocationChange) => {
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="#home">Texas A&M</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link onClick={() => onLocationChange("home")}>Home</Nav.Link>
          <Nav.Link onClick={() => onLocationChange("login")}>Login</Nav.Link>
          <Nav.Link onClick={() => onLocationChange("register")}>
            Register
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

const renderHome = () => {
  return (
    <div id={styles.homeWrapper}>
      <h1 id={styles.homeTitle}>Welcome to Texas A&M!</h1>
      <img id={styles.reveille} src={reveille} />
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("home");
  const [loading, setLoading] = useState(false);
  const onLocationChange = (newMode) => {
    setMode(newMode);
    navigate(`/${newMode}`);
  };
  return (
    <React.Fragment>
      {renderNavbar(onLocationChange)}
      <div className={styles.wrapper}>
        {mode === "home" ? renderHome() : <Bingo mode={mode} />}
      </div>
    </React.Fragment>
  );
}

export default App;
