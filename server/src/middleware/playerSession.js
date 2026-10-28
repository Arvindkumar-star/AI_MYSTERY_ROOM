import { v4 as uuidv4 } from 'uuid';
import { Player } from '../models/Player.js';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'ai_mystery_player';

export async function playerSession(req, res, next) {
  try {
    let anonId = req.cookies?.[COOKIE_NAME];

    if (!anonId) {
      anonId = uuidv4();
      res.cookie(COOKIE_NAME, anonId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });
    }

    let player = await Player.findOne({ anonId });
    if (!player) {
      player = await Player.create({ anonId });
    }

    req.player = player;
    req.playerId = player._id;
    req.playerAnonId = anonId;
    next();
  } catch (err) {
    next(err);
  }
}

