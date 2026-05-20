/**
 * Pagina de aterrizaje del link de WhatsApp: /login?t=<token>
 *
 * Sin formularios, sin mail, sin password. Llegamos aca por un link unico
 * generado por el bot cuando el usuario escribe "perfil". El token va a
 * /api/auth/consume y, si es valido, recibimos un session_token de 30 dias
 * que guardamos en localStorage.
 *
 * Despues forzamos un reload duro al perfil. La razon: el ProfileDataProvider
 * lee currentUserId() en su useEffect inicial; despues del login necesitamos
 * que ese efecto vuelva a correr para traer los datos en vivo en vez de los
 * demo. Es feo programar contra react-context re-mount, asi que un reload
 * limpio es lo mas robusto y solo ocurre una vez.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "../api/client";
import { setSession } from "../api/session";

type Status = "loading" | "ok" | "missing" | "invalid" | "network";

export function Login() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("t");
    if (!token) {
      setStatus("missing");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setReason(body?.details?.reason ?? body?.error ?? "invalid");
          setStatus("invalid");
          return;
        }
        const body = (await res.json()) as { session_token: string; expires_at: string; user_id: string };
        setSession({ token: body.session_token, userId: body.user_id, expiresAt: body.expires_at });
        setStatus("ok");
        // Reload duro: el provider tiene que volver a montarse para ver
        // la sesion recien escrita en localStorage.
        window.location.replace("/perfil/inicio");
      } catch (err) {
        if (!cancelled) {
          setReason((err as Error).message);
          setStatus("network");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
        {status === "loading" && (
          <>
            <div className="text-2xl font-semibold mb-2">Abriendo tu perfil…</div>
            <div className="text-neutral-500">Validando el acceso desde WhatsApp.</div>
          </>
        )}
        {status === "ok" && (
          <>
            <div className="text-2xl font-semibold mb-2">¡Listo!</div>
            <div className="text-neutral-500">Redirigiendo…</div>
          </>
        )}
        {status === "missing" && (
          <>
            <div className="text-2xl font-semibold mb-2">Falta el token</div>
            <div className="text-neutral-500">
              El link no incluye un token. Volvé a WhatsApp y escribí <b>perfil</b> para recibir uno nuevo.
            </div>
          </>
        )}
        {status === "invalid" && (
          <>
            <div className="text-2xl font-semibold mb-2">Link inválido o vencido</div>
            <div className="text-neutral-500 mb-2">
              {reason === "token_expired"
                ? "El link venció (válido por 15 minutos)."
                : reason === "token_already_used"
                  ? "Este link ya se usó."
                  : "No pudimos validar el link."}
            </div>
            <div className="text-neutral-500">
              Volvé a WhatsApp y escribí <b>perfil</b> para recibir uno nuevo.
            </div>
          </>
        )}
        {status === "network" && (
          <>
            <div className="text-2xl font-semibold mb-2">Sin conexión</div>
            <div className="text-neutral-500">No pudimos conectar con el servidor. Probá de nuevo en unos minutos.</div>
          </>
        )}
      </div>
    </div>
  );
}
