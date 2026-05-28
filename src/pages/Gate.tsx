/**
 * Pantalla de acceso para visitantes SIN sesión.
 *
 * Decisión de producto: el perfil web no tiene modo demo. Si alguien llega sin
 * haber entrado por el link de WhatsApp, no le mostramos datos de ejemplo —
 * le explicamos cómo entrar. La acción diaria (loguear comida/entreno) vive en
 * WhatsApp; el perfil es para ver y configurar.
 */
import { waActions } from "../lib/whatsapp";
import { Brandmark, Wordmark } from "../components/ui";

export function Gate() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[#09090b] relative overflow-hidden">
      <div className="ambient" aria-hidden="true">
        <div className="orb orb-green" />
        <div className="orb orb-red" />
        <div className="grain" />
      </div>

      <div className="relative max-w-md w-full f-card text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brandmark size={34} />
          <Wordmark size={18} />
        </div>

        <h1 className="font-sans font-bold text-[22px] leading-[1.2] text-f-text mb-2">
          Tu perfil vive detrás de WhatsApp
        </h1>
        <p className="text-[14px] leading-[1.55] text-f-text2 mb-6">
          Forja no usa usuario ni contraseña. Para ver tu progreso, escribile{" "}
          <b className="text-f-text">perfil</b> al bot y tocá el link que te manda.
        </p>

        <a href={waActions.open} target="_blank" rel="noreferrer" className="f-btn f-btn-wa w-full">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
          Abrir Forja en WhatsApp
        </a>

        <p className="font-mono text-[11px] text-f-text3 mt-5 leading-[1.5]">
          El link de acceso vence a los 15 minutos y es de un solo uso, por tu seguridad.
        </p>
      </div>
    </div>
  );
}
