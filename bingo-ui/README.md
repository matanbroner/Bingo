# Bingo UI

A more complex sample application used to highlight pluggable Bingo components.
A simple login and registration flow are shown to demonstrate how a third party service
may inject Bingo functionality into an application with minimal effort.

The Bingo component for React applications accepts a `mode` prop which can be set to
the current action to be performed: either `login` or `register`.
The `onLogin` and `onRegister` props are used to notify the parent component of the
result of the action.

Example:
```js
const onLogin = (data, err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
};

const onRegister = (data, err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
};

const App = (props) => {
    const mode = "login"; // or "register"
    return(
        <Bingo 
            mode={mode}
            onLogin={onLogin}
            onRegister={onRegister}
        />
    )
}
```