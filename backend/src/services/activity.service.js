import { genActivityId } from '../utils/ids.js';

export function buildActivityEntry({
  actorUid,
  actorName,
  action,
  targetType,
  targetId,
  targetTitle,
}) {
  return {
    id: genActivityId(),
    actorUid,
    actorName,
    action,
    targetType,
    targetId,
    targetTitle: targetTitle || null,
    createdAt: new Date().toISOString(),
  };
}

const MAX_ACTIVITY = 200;

export function appendActivity(db, entry) {
  const next = [entry, ...(db.activity || [])].slice(0, MAX_ACTIVITY);
  return { ...db, activity: next };
}
