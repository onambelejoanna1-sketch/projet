import {
  appendReading,
  createSensor,
  deleteSensor,
  getReadingsFor,
  getSensorById,
  listSensorsEnriched,
  patchSensor,
} from '../services/sensors.service.js';

export async function listAll(_req, res, next) {
  try {
    const sensors = await listSensorsEnriched();
    res.json({ sensors });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const sensor = await getSensorById(req.params.id);
    res.json({ sensor });
  } catch (err) {
    next(err);
  }
}

export async function postOne(req, res, next) {
  try {
    const sensor = await createSensor(req.body || {}, req.user);
    res.status(201).json({ sensor });
  } catch (err) {
    next(err);
  }
}

export async function patchOne(req, res, next) {
  try {
    const sensor = await patchSensor(req.params.id, req.body || {}, req.user);
    res.json({ sensor });
  } catch (err) {
    next(err);
  }
}

export async function deleteOne(req, res, next) {
  try {
    await deleteSensor(req.params.id, req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listReadings(req, res, next) {
  try {
    const readings = await getReadingsFor(req.params.id, req.query.limit);
    res.json({ readings });
  } catch (err) {
    next(err);
  }
}

export async function ingestReading(req, res, next) {
  try {
    const outcome = await appendReading(req.params.deviceId, req.body || {});
    res.json({
      ok: true,
      sensorId: outcome.sensor.id,
      alertLevel: outcome.alertLevel,
      disasterId: outcome.disasterId,
    });
  } catch (err) {
    next(err);
  }
}
