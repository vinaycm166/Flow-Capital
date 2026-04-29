/**
 * Singleton Socket.IO client instance.
 * Import this instead of calling `io()` directly in each component.
 * Prevents multiple connections from the same browser tab.
 */
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    // Connect directly to backend — Socket.IO handles its own CORS
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type { Socket };
