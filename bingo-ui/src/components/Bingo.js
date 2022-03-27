import { useState, useEffect } from "react";
import styles from "./Bingo.module.css";
import { Form, Button, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";

const renderFormTitle = (mode) => {
  return (
    <div id={styles.titleWrapper}>
      <h2 id={styles.titleMain}>{mode === "login" ? "Login" : "Register"}</h2>
      <span id={styles.titleSub}>Powered by Bingo</span>
    </div>
  );
};

const renderLoginForm = (loading, onFormChange, onFormSubmit) => {
  return (
    <Form onSubmit={onFormSubmit}>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Control
          className={styles.input}
          name="email"
          type="email"
          placeholder="user@tamu.edu"
          onChange={onFormChange}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Control
          className={styles.input}
          name="password"
          type="password"
          placeholder="********"
          onChange={onFormChange}
        />
      </Form.Group>

      <Button id={styles.submitBtn} variant="primary" type="submit">
        {loading ? (
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
        ) : (
          "Submit"
        )}
      </Button>
    </Form>
  );
};

const renderRegisterForm = (loading, onFormChange, onFormSubmit) => {
  return (
    <Form onSubmit={onFormSubmit}>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Control
          className={styles.input}
          name="email"
          type="email"
          placeholder="user@tamu.edu"
          onChange={onFormChange}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Control
          className={styles.input}
          name="password"
          type="password"
          placeholder="********"
          onChange={onFormChange}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Control
          className={styles.input}
          name="passwordConfirm"
          type="password"
          placeholder="********"
          onChange={onFormChange}
        />
      </Form.Group>

      <Button id={styles.submitBtn} variant="primary" type="submit">
        {loading ? (
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
        ) : (
          "Submit"
        )}
      </Button>
    </Form>
  );
};

const renderBingoNotInstalled = () => {
  return (
    <div id={styles.waitForBingo}>
      <h4>Bingo is not installed on your browser</h4>
      <span>Please download the extension from the Chrome Web Store</span>
    </div>
  );
};

const Bingo = (props) => {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({});
  const [listenerAttached, setListernerAttached] = useState(false);

  const onFormChange = (e) => {
    e.preventDefault();
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const onFormSubmit = (e) => {
    setLoading(true);
    e.preventDefault();
    if (props.mode === "login") {
      window.postMessage({ type: "LOGIN", payload: values }, "*");
    }
  };

  const handleWindowMessage = (event) => {
    if (event.source != window || !event.data.type) return;
    if (event.data.type === "LOGIN_SUCCESS") {
      toast("Login successful", {
        type: "success",
      });
      setLoading(false);
    }
    if (event.data.type === "LOGIN_ERROR") {
        toast("Login failed: " + event.data.error.message, {
            type: "error",
        });
        setLoading(false);
    }
    if (event.data.type === "REGISTER_SUCCESS") {
      console.log("Register ACK");
      setLoading(false);
    }
  };

  // prevent multiple listeners on the same event
  useEffect(() => {
    if (!listenerAttached) {
      // on mount
      window.addEventListener("message", handleWindowMessage);
      setListernerAttached(true);
    }
    return () => {
      // on unmount
      window.removeEventListener("message", handleWindowMessage);
    };
  }, []);

  // use a hidden div to check if bingo is installed
  if (document.getElementById("bingo-installed") === null) {
    return <div id={styles.wrapper}>{renderBingoNotInstalled()}</div>;
  }

  return (
    <div id={styles.wrapper}>
      {renderFormTitle(props.mode)}
      {props.mode === "login"
        ? renderLoginForm(loading, onFormChange, onFormSubmit)
        : renderRegisterForm(loading, onFormChange, onFormSubmit)}
      <ToastContainer />
    </div>
  );
};

export default Bingo;
