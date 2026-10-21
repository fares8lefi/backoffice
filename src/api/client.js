// Vide en développement : les appels passent par le proxy Vite (même origine).
const API_URL = import.meta.env.VITE_API_URL || '';

const HTTP_MESSAGES = {
  400: 'Les informations envoyées sont invalides.',
  401: 'Votre session a expiré. Reconnectez-vous.',
  403: 'Ce compte n’a pas accès à cette action.',
  404: 'Élément introuvable.',
  429: 'Trop de tentatives. Réessayez dans quelques minutes.',
  500: 'Le serveur a rencontré une erreur.',
};

const NO_REFRESH = ['/loginUser', '/refreshToken'];
let refreshing = null;

function refreshSession() {
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/users/refreshToken`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/**
 * Appel JSON vers l'API Fluxio (cookies httpOnly jwt_login / jwt_refresh).
 * Sur 401, tente un rafraîchissement du jeton puis rejoue la requête une fois.
 */
export async function request(path, { method = 'GET', body, retry = true } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Le serveur Fluxio ne répond pas. Vérifiez que l’API est démarrée.');
  }

  if (response.status === 401 && retry && !NO_REFRESH.some((p) => path.includes(p))) {
    if (await refreshSession()) return request(path, { method, body, retry: false });
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* réponse sans corps JSON */
  }

  if (!response.ok || data.success === false) {
    const error = new Error(
      data.message || data.error || HTTP_MESSAGES[response.status] || 'La requête a échoué.'
    );
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

export function toQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value);
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}
