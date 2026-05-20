import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProfileDataProvider } from "./api/store";
import { ProfileLayout } from "./components/ProfileLayout";
import { Home } from "./pages/Home";
import { Nutrition } from "./pages/Nutrition";
import { Training } from "./pages/Training";
import { Health } from "./pages/Health";
import { Journey } from "./pages/Journey";
import { Settings } from "./pages/Settings";
import { Subscription } from "./pages/Subscription";

export function App() {
  return (
    <BrowserRouter>
      <ProfileDataProvider>
      <ProfileLayout>
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
      </ProfileLayout>
      </ProfileDataProvider>
    </BrowserRouter>
  );
}
