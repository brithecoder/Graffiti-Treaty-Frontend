// Check if we are running locally or on the live site
const isLocal = window.location.hostname === "localhost";

export const API_BASE_URL = isLocal 
  ? "http://localhost:3001" 
  : "https://graffiti-treaty-backend.onrender.com";

export const SOCKET_URL = isLocal 
  ? "http://localhost:3001" 
  : "https://graffiti-treaty-backend.onrender.com";