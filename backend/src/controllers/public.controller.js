import {
  getPublicFeed,
  getPublicStats,
  getPublicTicker,
  listPublicSensors,
} from '../services/public.service.js';

export async function feedCtrl(req, res, next) {
  try {
    const feed = await getPublicFeed(req.query.limit);
    res.json({ feed });
  } catch (err) {
    next(err);
  }
}

export async function tickerCtrl(req, res, next) {
  try {
    const ticker = await getPublicTicker(req.query.limit);
    res.json({ ticker });
  } catch (err) {
    next(err);
  }
}

export async function statsCtrl(_req, res, next) {
  try {
    const stats = await getPublicStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

export async function sensorsCtrl(_req, res, next) {
  try {
    const sensors = await listPublicSensors();
    res.json({ sensors });
  } catch (err) {
    next(err);
  }
}
