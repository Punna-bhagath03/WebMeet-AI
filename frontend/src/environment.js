const SERVER_URL = process.env.REACT_APP_API_URL;

if (!SERVER_URL) {
  throw new Error('REACT_APP_API_URL is not set. Create frontend/.env from frontend/.env.example.');
}

export default SERVER_URL;
