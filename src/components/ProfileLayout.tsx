import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MOBILE_PRIMARY, MOBILE_SECONDARY, SECTIONS } from "../lib/nav";
import { waActions } from "../lib/whatsapp";
import { useProfileData } from "../api/store";
import { Wordmark, Brandmark, Toaster } from "./ui";

function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="orb orb-green" />
      <div className="orb orb-red" />
      <div className="grain" />
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { data } = useProfileData();
  const athlete = data.athlete;
  return (
    <aside className="hidden lg:flex flex-col w-[260px] flex-none border-r border-f-border bg-[#0c0c0e] sticky top-0 h-dvh">
      <div className="px-6 h-16 flex items-center gap-3 border-b border-f-border">
        <Brandmark size={30} />
        <Wordmark size={16} />
      </div>

      <div className="px-6 py-5 border-b border-f-border">
        <div className="flex items-center justify-between mb-2">
          <span className="f-datalabel">Tu perfil</span>
          <span className="font-mono text-[12px] text-f-green-glow">{athlete.profileCompleteness}%</span>
        </div>
        <div className="f-progress-track">
          <div className="f-progress-fill" style={{ width: `${athlete.profileCompleteness}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }} />
        </div>
        <p className="text-[11px] text-f-text3 mt-2 leading-[1.4]">Subí tu apto médico y agregá 3 comidas más para llegar al 100%.</p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {SECTIONS.map((s) => (
          <Link key={s.slug} to={s.path} className="f-navlink" aria-current={pathname.startsWith(s.path) ? "page" : undefined}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <a href={waActions.open} target="_blank" rel="noreferrer" className="f-btn f-btn-wa w-full">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
          Abrir Forja en WhatsApp
        </a>
        <div className="flex items-center gap-2.5 px-3 mt-4">
          <span className="w-8 h-8 rounded-full bg-f-green-dark flex items-center justify-center font-sans font-bold text-[13px] text-f-text">
            {athlete.firstName[0]}
          </span>
          <div className="min-w-0">
            <div className="text-[13px] text-f-text truncate">{athlete.name}</div>
            <div className="font-mono text-[10px] text-f-text3">Plan {athlete.plan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Topbar mobile minimalista — solo brand y un nombre de sección.
 * Sin progress bar / avatar / porcentaje: liberan altura crítica cuando
 * la URL bar de Safari/Chrome ya se está comiendo el viewport.
 */
function MobileTopbar({ pathname }: { pathname: string }) {
  const section = SECTIONS.find((s) => pathname.startsWith(s.path));
  return (
    <header
      className="lg:hidden sticky top-0 z-40 backdrop-blur-md bg-[#09090Bcc] border-b border-f-border"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Brandmark size={24} />
          <span className="text-[14px] font-medium text-f-text truncate">{section?.label ?? "Forja"}</span>
        </div>
        <a
          href={waActions.open}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center text-f-green-glow"
          aria-label="Abrir Forja en WhatsApp"
          style={{ width: 40, height: 40 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chat</span>
        </a>
      </div>
    </header>
  );
}

function BottomNav({ pathname, onMore }: { pathname: string; onMore: () => void }) {
  const moreActive = MOBILE_SECONDARY.some((s) => pathname.startsWith(s.path));
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 backdrop-blur-md bg-[#09090Bee] border-t border-f-border f-bottomnav"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {MOBILE_PRIMARY.map((s) => (
        <Link key={s.slug} to={s.path} className="f-bottomtab" aria-current={pathname.startsWith(s.path) ? "page" : undefined}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{s.icon}</span>
          <span>{s.short}</span>
        </Link>
      ))}
      <button type="button" onClick={onMore} className="f-bottomtab" aria-current={moreActive ? "page" : undefined} aria-label="Abrir más opciones">
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
        <span>Más</span>
      </button>
    </nav>
  );
}

/** Drawer "Más" — accede a Journey, Config, Suscripción + perfil + WA. */
function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useProfileData();
  const athlete = data.athlete;
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[70] flex items-end bg-black/70 f-fade-up" onClick={onClose}>
      <div
        className="w-full bg-f-card border-t border-f-border rounded-t-2xl flex flex-col"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <span className="block w-10 h-1 rounded-full bg-f-muted" />
        </div>

        <div className="px-5 pb-3 pt-2 flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-f-green-dark flex items-center justify-center font-sans font-bold text-[15px] text-f-text">
            {athlete.firstName[0]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] text-f-text truncate">{athlete.name}</div>
            <div className="font-mono text-[11px] text-f-text3">Plan {athlete.plan} · perfil {athlete.profileCompleteness}%</div>
          </div>
        </div>

        <div className="px-3 pt-1">
          {MOBILE_SECONDARY.map((s) => (
            <Link
              key={s.slug}
              to={s.path}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3.5 rounded-lg text-f-text hover:bg-f-elevated"
            >
              <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 22 }}>{s.icon}</span>
              <span className="text-[15px] flex-1">{s.label}</span>
              <span className="material-symbols-outlined text-f-text3" style={{ fontSize: 18 }}>chevron_right</span>
            </Link>
          ))}
        </div>

        <div className="px-5 pt-3 pb-5">
          <a href={waActions.open} target="_blank" rel="noreferrer" className="f-btn f-btn-wa w-full" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
            Abrir Forja en WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-f-border mt-10 px-4 sm:px-6 lg:px-10 py-6">
      <p className="text-[11px] leading-[1.6] text-f-text3 max-w-[80ch]">
        Forja no constituye asesoramiento médico ni nutricional profesional. No reemplaza la consulta con un
        licenciado en nutrición o profesional de la salud. Consultá siempre a tu equipo médico.
      </p>
      <p className="font-mono text-[10px] text-f-text3 mt-2">FORJA · Buenos Aires, Argentina · Ley 25.326 · Disp. 954/2025</p>
    </footer>
  );
}

/**
 * StatusBanner — solo informa cuando hay algo que decir (loading o error).
 * En "live" deja de ocupar espacio: el usuario sano no necesita ver
 * "conectado" todo el tiempo, era ruido visual.
 */
function StatusBanner() {
  const { source, loading, error } = useProfileData();
  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-f-border bg-f-surface px-4 py-2.5 text-[12px] text-f-text2">
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progressactivity</span>
        Conectando…
      </div>
    );
  }
  if (source === "live") return null;
  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-[12px]"
         style={{ background: "rgba(196,154,60,0.10)", border: "1px solid rgba(196,154,60,0.25)", color: "#C49A3C" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>science</span>
      {error ?? "Modo demo · seteá VITE_API_URL y VITE_USER_ID para datos en vivo"}
    </div>
  );
}

export function ProfileLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  // cerrar el drawer "Más" cuando cambia la URL
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  return (
    <div className="min-h-dvh flex">
      <Ambient />
      <Sidebar pathname={pathname} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopbar pathname={pathname} />
        <main className="flex-1">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-7 lg:pt-9 f-pad-bottom-nav lg:pb-10 f-fade-up">
            <StatusBanner />
            {children}
          </div>
          <LegalFooter />
        </main>
      </div>

      <BottomNav pathname={pathname} onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <Toaster />
    </div>
  );
}
