import { io, Socket } from "socket.io-client";

// Socket.io server URL - uses environment variable or defaults to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

let socket: Socket | null = null;

/**
 * Get or create the Socket.io client instance
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/**
 * Connect the socket
 */
export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

