const listeners = new Set();
let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUserSilent(user) {
  currentUser = user;
}

export function setCurrentUser(user) {
  currentUser = user;
  notify(user);
}

export function subscribe(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notify(user) {
  listeners.forEach((cb) => {
    try {
      cb(user);
    } catch {
      // listener errors should not break the chain
    }
  });
}
