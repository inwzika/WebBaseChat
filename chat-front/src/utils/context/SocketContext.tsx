import { createContext } from "react";
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL as string | undefined;
const USE_PROXY = (import.meta.env.VITE_USE_PROXY as string | undefined) === "true" || !WS_URL;

export const socket = io(USE_PROXY ? undefined : WS_URL, {
	// When using Vite proxy, same-origin is used (no url), cookies are first-party
	withCredentials: true,
});
export const SocketContext = createContext(socket);
