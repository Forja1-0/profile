/**
 * Manejo de la sesion del web_profile.
 *
 * Tras consumir el token de WhatsApp, el backend devuelve un `session_token`
 * opaco. Lo guardamos en localStorage para que la 2da visita sea instantanea
 * (sin tener que escribir "perfil" otra vez). El token vale 30 dias en el
 * backend; si se revoca/expira, las requests devuelven 401 y limpiamos.
 *
 * Tambien guardamos `user_id` para que el resto del codigo (store.tsx)
 * sepa contra que usuario pegar SIN tener que decodificar nada — al
 * backend igual le importa el header, no el id del path.
 */
const TOKEN_KEY = "forja_session_token";
const USER_KEY = "forja_user_id";
const EXP_KEY = "forja_session_exp";

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userId = localStorage.getItem(USER_KEY);
  const expiresAt = localStorage.getItem(EXP_KEY);
  if (!token || !userId || !expiresAt) return null;
  if (new Date(expiresAt).getTime() < Date.now()) {
    clearSession();
    return null;
  }
  return { token, userId, expiresAt };
}

export function setSession(s: Session): void {
  localStorage.setItem(TOKEN_KEY, s.token);
  localStorage.setItem(USER_KEY, s.userId);
  localStorage.setItem(EXP_KEY, s.expiresAt);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXP_KEY);
}
