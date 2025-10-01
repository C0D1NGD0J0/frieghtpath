import { io, Socket } from "socket.io-client";
import type {
  StartComparisonPayload,
  ErrorPayload,
  SessionCreatedPayload,
  StatusPayload,
  ChunkPayload,
  CompletePayload,
} from "./types";

export interface ServerToClientEvents {
  error: (data: ErrorPayload) => void;
  sessionCreated: (data: SessionCreatedPayload) => void;
  modelStatus: (data: StatusPayload) => void;
  modelChunk: (data: ChunkPayload) => void;
  modelComplete: (data: CompletePayload) => void;
  modelError: (data: ErrorPayload) => void;
}

export interface ClientToServerEvents {
  startComparison: (data: StartComparisonPayload) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;

  connect(token: string): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    }) as TypedSocket;

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
