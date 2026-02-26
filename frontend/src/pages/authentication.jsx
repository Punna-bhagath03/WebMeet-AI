import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Authentication() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const [formState, setFormState] = React.useState(0);

  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        setUsername('');
        setMessage(result);
        setOpen(true);
        setError('');
        setFormState(0);
        setPassword('');
        setName('');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Authentication failed';
      setError(errorMessage);
    }
  };

  return (
    <div className="authPageContainer">
        <header className="landingHeader authHeader">
          <button
            type="button"
            className="landingBrand authHomeButton"
            onClick={() => navigate('/')}
          >
            <div className="landingBrandIcon">
              <VideocamOutlinedIcon fontSize="small" />
            </div>
            <h2>WebMeet AI</h2>
          </button>
        </header>

      <main className="authMain">
        <Paper elevation={0} className="authCard">
          <div className="authTabs">
            <button
              type="button"
              className={`authTabButton ${formState === 0 ? 'active' : ''}`}
              onClick={() => {
                setFormState(0);
                setError('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`authTabButton ${formState === 1 ? 'active' : ''}`}
              onClick={() => {
                setFormState(1);
                setError('');
              }}
            >
              Sign Up
            </button>
          </div>

          <Box component="form" noValidate className="authForm">
            <div key={formState} className="authFormFields">
              <Typography className="authTitle" component="h1">
                {formState === 0 ? 'Welcome back' : 'Create your account'}
              </Typography>
              <Typography className="authSubtitle" component="p">
                {formState === 0
                  ? 'Sign in to your workspace'
                  : 'Join the team in just a few seconds'}
              </Typography>

              {formState === 1 ? (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="full-name"
                  label="Full Name"
                  name="fullName"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                />
              ) : null}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                autoFocus={formState === 0}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                value={password}
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                id="password"
              />

              <p className="authErrorText">{error}</p>

              <Button
                type="button"
                variant="contained"
                className="authSubmitButton"
                onClick={handleAuth}
              >
                {formState === 0 ? 'Login' : 'Register'}
              </Button>
            </div>
          </Box>
        </Paper>
      </main>

      <Snackbar open={open} autoHideDuration={4000} message={message} />
    </div>
  );
}
