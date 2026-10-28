import { Router } from 'express';
import { Asset } from '../models/Asset.js';
import { Case } from '../models/Case.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/assets/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      throw new AppError('Asset not found', 404, 'NOT_FOUND');
    }

    // Security check: Verify case ownership
    const caseDoc = await Case.findOne({
      _id: asset.caseId,
      playerId: req.playerId,
    });

    if (!caseDoc) {
      throw new AppError('Asset access denied', 403, 'FORBIDDEN');
    }

    res.set({
      'Content-Type': asset.mimeType,
      'Content-Length': asset.size,
      'Cache-Control': 'public, max-age=86400, immutable',
    });

    res.send(asset.data);
  } catch (err) {
    next(err);
  }
});

export default router;

