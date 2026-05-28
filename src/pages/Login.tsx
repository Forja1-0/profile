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
import { Brandmark, Wordmark } from "../components/ui";
import { waActions } from "../lib/whatsapp";

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

  // Estados que requieren reintentar desde WhatsApp muestran el CTA.
  const showWaCta = status === "missing" || status === "invalid" || status === "network";

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[#09090b] relative overflow-hidden">
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-green" />
        <div className="orb orb-red" />
        <div className="grain" />
      </div>

      <div className="relative max-w-md w-full f-card text-center f-fade-up">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brandmark size={32} />
          <Wordmark size={17} />
        </div>

        {status === "loading" && (
          <>
            <span className="f-spinner mx-auto mb-4" style={{ width: 30, height: 30, borderWidth: 3 }} />
            <div className="text-[20px] font-bold text-f-text mb-1.5">Abriendo tu perfil…</div>
            <div className="text-[14px] text-f-text2">Validando tu acceso desde WhatsApp.</div>
          </>
        )}

        {status === "ok" && (
          <>
            <span className="material-symbols-outlined text-f-green-glow mb-2" style={{ fontSize: 40 }}>check_circle</span>
            <div className="text-[20px] font-bold text-f-text mb-1.5">¡Listo!</div>
            <div className="text-[14px] text-f-text2">Te llevamos a tu perfil…</div>
          </>
        )}

        {status === "missing" && (
          <>
            <span className="material-symbols-outlined text-f-text3 mb-2" style={{ fontSize: 38 }}>link_off</span>
            <div className="text-[20px] font-bold text-f-text mb-1.5">Falta el código de acceso</div>
            <div className="text-[14px] text-f-text2">
              Este link no trae un código. Volvé a WhatsApp y escribí <b className="text-f-text">perfil</b> para recibir uno nuevo.
            </div>
          </>
        )}

        {status === "invalid" && (
          <>
            <span className="material-symbols-outlined text-f-text3 mb-2" style={{ fontSize: 38 }}>schedule</span>
            <div className="text-[20px] font-bold text-f-text mb-1.5">
              {reason === "token_already_used" ? "Este link ya se usó" : "Link vencido"}
            </div>
            <div className="text-[14px] text-f-text2">
              {reason === "token_expired"
                ? "Los links valen 15 minutos por seguridad."
                : reason === "token_already_used"
                  ? "Cada link sirve una sola vez."
                  : "No pudimos validar el link."}{" "}
              Pedí uno nuevo escribiendo <b className="text-f-text">perfil</b> en WhatsApp.
            </div>
          </>
        )}

        {status === "network" && (
          <>
            <span className="material-symbols-outlined text-f-text3 mb-2" style={{ fontSize: 38 }}>cloud_off</span>
            <div className="text-[20px] font-bold text-f-text mb-1.5">Sin conexión</div>
            <div className="text-[14px] text-f-text2">No pudimos conectar con el servidor. Probá de nuevo en unos minutos.</div>
          </>
        )}

        {showWaCta && (
          <a href={waActions.open} target="_blank" rel="noreferrer" className="f-btn f-btn-wa w-full mt-6">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
            Abrir Forja en WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
