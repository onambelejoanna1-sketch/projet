import {
  getAlertsBuckets,
  getStats,
  listActivity,
  listTopZones,
} from '../services/admin.service.js';

export async function statsCtrl(_req, res, next) {
  try {
    const stats = await getStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

export async function activityCtrl(req, res, next) {
  try {
    const activity = await listActivity(req.query.limit);
    res.json({ activity });
  } catch (err) {
    next(err);
  }
}

export async function topZonesCtrl(req, res, next) {
  try {
    const zones = await listTopZones({
      days: req.query.days,
      limit: req.query.limit,
    });
    res.json({ zones });
  } catch (err) {
    next(err);
  }
}

export async function alertsBucketsCtrl(_req, res, next) {
  try {
    const buckets = await getAlertsBuckets();
    res.json({ buckets });
  } catch (err) {
    next(err);
  }
}
