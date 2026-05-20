import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { ProfileDataProvider } from "./api/store";
import { ProfileLayout } from "./components/ProfileLayout";
import { Home } from "./pages/Home";
import { Nutrition } from "./pages/Nutrition";
import { Training } from "./pages/Training";
import { Health } from "./pages/Health";
import { Journey } from "./pages/Journey";
import { Settings } from "./pages/Settings";
import { Subscription } from "./pages/Subscription";
import { Login } from "./pages/Login";

/**
 * /login es la unica ruta fuera del ProfileDataProvider/ProfileLayout: no
 * tiene sentido cargar el bundle de perfil mientras estamos validando el
 * token de WhatsApp. El resto del arbol entra dentro del provider.
 */
function ProfileShell({ children }: { children: ReactNode }) {
  return (
    <ProfileDataProvider>
      <ProfileLayout>{children}</ProfileLayout>
    </ProfileDataProvider>
  );
}

function Routed() {
  const loc = useLocation();
  if (loc.pathname === "/login") {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }
  return (
    <ProfileShell>
      <Routes>
        <Route path="/" element={<Navigate to="/perfil/inicio" replace />} />
        <Route path="/perfil" element={<Navigate to="/perfil/inicio" replace />} />
        <Route path="/perfil/inicio" element={<Home />} />
        <Route path="/perfil/nutricion" element={<Nutrition />} />
        <Route path="/perfil/entrenamiento" element={<Training />} />
        <Route path="/perfil/salud" element={<Health />} />
        <Route path="/perfil/journey" element={<Journey />} />
        <Route path="/perfil/configuracion" element={<Settings />} />
        <Route path="/perfil/suscripcion" element={<Subscription />} />
        <Route path="*" element={<Navigate to="/perfil/inicio" replace />} />
      </Routes>
    </ProfileShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routed />
    </BrowserRouter>
  );
}
