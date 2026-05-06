import { Router } from 'express';
import { createGame, getGame } from '../db/games';

const router = Router();

router.post('/', (req, res) => {
  const { crosswordId } = req.body as { crosswordId?: string };
  if (!crosswordId) {
    res.status(400).json({ error: 'crosswordId required' });
    return;
  }
  const game = createGame(crosswordId);
  res.json({ guid: game.guid, crosswordId: game.crosswordId, expiresAt: game.expiresAt });
});

router.get('/:crosswordId/:guid', (req, res) => {
  const game = getGame(req.params.guid);
  if (!game || game.crosswordId !== req.params.crosswordId) {
    res.status(404).json({ error: 'Game not found or expired' });
    return;
  }
  res.json(game);
});

export default router;
