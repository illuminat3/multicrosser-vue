import { Router } from "express";
import { getAllHosts } from "../providers/registry";
import { getOrFetchCrossword, getAvailableDates } from "../db/crosswords";
import { crosswordsDb } from "../db/index";

const router = Router();

router.get("/hosts", (_req, res) => {
  const hosts = getAllHosts().map((h) => ({
    hostId: h.hostId,
    displayName: h.displayName,
    providers: h.providers.map((p) => ({
      providerId: p.providerId,
      crosswordType: p.crosswordType,
    })),
  }));
  res.json(hosts);
});

router.get("/:providerId/today", async (req, res) => {
  try {
    const data = await getOrFetchCrossword(req.params.providerId, new Date());
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: msg });
  }
});

router.get("/:providerId/date/:date", async (req, res) => {
  const { providerId, date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Date must be YYYY-MM-DD" });
    return;
  }
  try {
    const parsed = new Date(`${date}T12:00:00Z`);
    const data = await getOrFetchCrossword(providerId, parsed);
    res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: msg });
  }
});

router.get("/:providerId/history", (req, res) => {
  const dates = getAvailableDates(req.params.providerId, 30);
  res.json(dates);
});

router.get("/by-id/:crosswordId", (req, res) => {
  const row = crosswordsDb
    .prepare("SELECT data FROM crosswords WHERE id = ?")
    .get(req.params.crosswordId) as { data: string } | undefined;

  if (!row) {
    res.status(404).json({ error: "Crossword not found in cache" });
    return;
  }
  res.json(JSON.parse(row.data));
});

export default router;
