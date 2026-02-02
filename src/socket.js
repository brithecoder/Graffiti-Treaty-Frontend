// src/socket.js
import { io } from 'socket.io-client';
import { SOCKET_URL } from "./apiConfig";
// Connect to your backend URL
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  secure: true
});

export default socket;