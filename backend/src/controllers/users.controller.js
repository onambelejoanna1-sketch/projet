import {
  addFcmToken,
  deleteUserByUid,
  getUserById,
  listAllUsers,
  patchUserProfile,
  removeFcmToken,
  updateNotificationPrefs,
} from '../services/users.service.js';
import { createUserByAdmin } from '../services/auth.service.js';
import { makeError } from '../utils/errors.js';

export async function getOne(req, res, next) {
  try {
    if (req.auth.role !== 'admin' && req.params.uid !== req.auth.uid) {
      throw makeError('auth/forbidden', 'Vous ne pouvez consulter que votre propre profil.');
    }
    const user = await getUserById(req.params.uid);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function listAll(_req, res, next) {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function patchProfile(req, res, next) {
  try {
    const user = await patchUserProfile(req.params.uid, req.body || {});
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function patchNotifications(req, res, next) {
  try {
    const user = await updateNotificationPrefs(req.params.uid, req.body || {});
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function postFcmToken(req, res, next) {
  try {
    const user = await addFcmToken(req.params.uid, req.body?.token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteFcmToken(req, res, next) {
  try {
    const user = await removeFcmToken(req.params.uid, req.body?.token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function createByAdmin(req, res, next) {
  try {
    const { email, password, displayName, role } = req.body || {};
    const user = await createUserByAdmin({ email, password, displayName, role });
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteOne(req, res, next) {
  try {
    await deleteUserByUid(req.params.uid, { requesterUid: req.auth.uid });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
