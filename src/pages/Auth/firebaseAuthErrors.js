const MESSAGES = {
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/email-already-in-use': 'Cette adresse est déjà utilisée. Connecte-toi à la place.',
  'auth/weak-password': 'Mot de passe trop faible (8 caractères minimum).',
  'auth/missing-password': 'Mot de passe manquant.',
  'auth/user-not-found': 'Aucun compte n\'existe pour cette adresse.',
  'auth/wrong-password': 'Email ou mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-login-credentials': 'Email ou mot de passe incorrect.',
  'auth/too-many-requests':
    'Trop de tentatives. Réessaie dans quelques minutes ou réinitialise ton mot de passe.',
  'auth/network-request-failed':
    'Connexion réseau impossible. Vérifie ta connexion internet et réessaie.',
  'auth/operation-not-allowed':
    'Méthode de connexion désactivée. Contacte un administrateur.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/invalid-reset-token':
    'Lien de réinitialisation invalide ou expiré. Recommencez la demande.',
  'rate-limit/too-many-requests':
    'Trop de tentatives. Réessayez dans quelques minutes.',
};

export function authErrorMessage(error) {
  if (!error) return '';
  const code = error.code ?? '';
  return MESSAGES[code] ?? 'Une erreur est survenue. Réessaie dans un instant.';
}
