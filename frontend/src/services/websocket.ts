type WsMessage =
  | { type: "state"; state: { cells: Record<string, string> } }
  | { type: "cell_update"; x: number; y: number; value: string }
  | { type: "error"; message: string };

type MessageHandler = (msg: WsMessage) => void;

export class GameSocket {
  private ws: WebSocket;
  private handlers: MessageHandler[] = [];
  private pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
  private heartbeat: ReturnType<typeof setInterval>;

  constructor(crosswordId: string, guid: string) {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${proto}://${location.host}/ws/games/${crosswordId}/${guid}`);

    this.ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as WsMessage;
        this.handlers.forEach((h) => h(msg));
      } catch {
        // ignore
      }
    });

    this.heartbeat = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000);
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  sendCellUpdate(x: number, y: number, value: string) {
    const key = `${x},${y}`;

    const pending = this.pendingUpdates.get(key);
    if (pending !== undefined) clearTimeout(pending);

    const timer = setTimeout(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "cell_update", x, y, value }));
      }
      this.pendingUpdates.delete(key);
    }, 50);

    this.pendingUpdates.set(key, timer);
  }

  close() {
    clearInterval(this.heartbeat);
    this.ws.close();
  }

  get readyState() {
    return this.ws.readyState;
  }
}
