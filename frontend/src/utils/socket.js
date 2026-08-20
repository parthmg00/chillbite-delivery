import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

let socket = null;

export const getSocket = () => {
  if (socket) {
    return socket;
  }

  const token =
    localStorage.getItem(
      "chillbite-token"
    );

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },

    withCredentials: true,

    transports: [
      "websocket",
      "polling",
    ],

    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log(
      "🔌 Socket connected:",
      socket.id
    );
  });

  socket.on(
    "connect_error",
    (error) => {
      console.error(
        "❌ Socket connection error:",
        error.message
      );
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(
      "🔌 Socket disconnected:",
      reason
    );
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
};