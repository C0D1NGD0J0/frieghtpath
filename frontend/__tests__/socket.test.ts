import { socketService } from "../lib/socket";

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    connected: true,
    disconnect: jest.fn(),
  })),
}));

describe("SocketService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should connect with token", () => {
    const socket = socketService.connect("test-token");
    expect(socket).toBeDefined();
    expect(socket.connected).toBe(true);
  });

  it("should return existing socket if already connected", () => {
    const socket1 = socketService.connect("test-token");
    const socket2 = socketService.connect("test-token");
    expect(socket1).toBe(socket2);
  });

  it("should disconnect socket", () => {
    socketService.connect("test-token");
    socketService.disconnect();
    expect(socketService.getSocket()).toBeNull();
  });
});
