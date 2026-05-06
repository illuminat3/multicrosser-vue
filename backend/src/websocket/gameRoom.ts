import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { getGame, updateCell } from "../db/games";

interface Client {
  ws: WebSocket;
  gameGuid: string;
}

type CellUpdateMsg = {
  type: "cell_update";
  x: number;
  y: number;
  value: string;
};

type ClientMessage = CellUpdateMsg;

const rooms = new Map<string, Set<Client>>();

function joinRoom(guid: string, client: Client) {
  if (!rooms.has(guid)) rooms.set(guid, new Set());
  rooms.get(guid)!.add(client);
}

function leaveRoom(guid: string, client: Client) {
  rooms.get(guid)?.delete(client);
  if (rooms.get(guid)?.size === 0) rooms.delete(guid);
}

function broadcast(guid: string, data: unknown, exclude?: WebSocket) {
  const payload = JSON.stringify(data);
  rooms.get(guid)?.forEach((c) => {
    if (c.ws !== exclude && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(payload);
    }
  });
}

export function attachWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const match = req.url?.match(/^\/ws\/games\/([^/]+)\/([^/]+)$/);
    if (!match) {
      ws.close(1008, "Invalid path");
      return;
    }

    const [, crosswordId, guid] = match;
    const game = getGame(guid);

    if (!game || game.crosswordId !== crosswordId) {
      ws.send(JSON.stringify({ type: "error", message: "Game not found or expired" }));
      ws.close();
      return;
    }

    const client: Client = { ws, gameGuid: guid };
    joinRoom(guid, client);

    ws.send(JSON.stringify({ type: "state", state: game.state }));

    ws.on("message", (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        return;
      }

      if (msg.type === "cell_update") {
        const updated = updateCell(guid, msg.x, msg.y, msg.value);
        if (!updated) {
          ws.send(JSON.stringify({ type: "error", message: "Game expired" }));
          ws.close();
          return;
        }

        broadcast(guid, {
          type: "cell_update",
          x: msg.x,
          y: msg.y,
          value: msg.value,
        });
      }
    });

    ws.on("close", () => leaveRoom(guid, client));
  });
}
