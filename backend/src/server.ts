import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import crosswordsRouter from "./routes/crosswords";
import gamesRouter from "./routes/games";
import { attachWebSocket } from "./websocket/gameRoom";
import { deleteExpiredGames } from "./db/games";

import "./db/index";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/crosswords", crosswordsRouter);
app.use("/api/games", gamesRouter);

const server = createServer(app);
const wss = new WebSocketServer({ server, path: undefined });
attachWebSocket(wss);

setInterval(
  () => {
    const deleted = deleteExpiredGames();
    if (deleted > 0) console.log(`Cleaned up ${deleted} expired games`);
  },
  60 * 60 * 1000,
);

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
