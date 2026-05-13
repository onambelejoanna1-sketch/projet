import {
  createDisaster,
  deleteDisaster,
  getDisaster,
  listDisasters,
  rejectDisaster,
  validateDisaster,
} from '../services/disasters.service.js';
import { makeError } from '../utils/errors.js';

export async function postOne(req, res, next) {
  try {
    const disaster = await createDisaster(req.body || {}, req.user);
    res.status(201).json({ disaster });
  } catch (err) {
    next(err);
  }
}

export async function listAll(req, res, next) {
  try {
    const filters = { ...req.query };
    if (req.auth.role !== 'admin') {
      // Non-admin : ne peut interroger que ses propres reports.
      filters.reporterId = req.auth.uid;
    }
    const disasters = await listDisasters(filters);
    res.json({ disasters });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const disaster = await getDisaster(req.params.id);
    if (
      req.auth.role !== 'admin' &&
      disaster.reporterId !== req.auth.uid
    ) {
      throw makeError('auth/forbidden', "Accès refusé à ce signalement.");
    }
    res.json({ disaster });
  } catch (err) {
    next(err);
  }
}

export async function postValidate(req, res, next) {
  try {
    const disaster = await validateDisaster(req.params.id, req.user);
    res.json({ disaster });
  } catch (err) {
    next(err);
  }
}

export async function postReject(req, res, next) {
  try {
    const disaster = await rejectDisaster(req.params.id, req.user, req.body?.reason);
    res.json({ disaster });
  } catch (err) {
    next(err);
  }
}

export async function deleteOne(req, res, next) {
  try {
    await deleteDisaster(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
