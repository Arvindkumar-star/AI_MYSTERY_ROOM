import { v4 as uuidv4 } from 'uuid';
import { Player } from '../models/Player.js';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'ai_mystery_player';

export async function playerSession(req, res, next) {
  try {
    let anonId = req.cookies?.[COOKIE_NAME] || req.headers['x-player-id'];

    if (!anonId || typeof anonId !== 'string' || anonId.trim() === '') {
      anonId = uuidv4();
    }

    const isProduction = env.NODE_ENV === 'production';
    res.cookie(COOKIE_NAME, anonId, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    res.setHeader('x-player-id', anonId);

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

