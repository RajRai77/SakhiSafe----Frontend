import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";

// --- New Auth Imports ---
import Login from "./pages/Login.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";

// --- Existing Imports ---
import Index from "./pages/Index.tsx";
import ProfilePage from "./pages/profile/page.tsx";
import ContactsPage from "./pages/contacts/page.tsx";
import DevicePage from "./pages/device/page.tsx";
import HistoryPage from "./pages/history/page.tsx";
import SettingsPage from "./pages/settings/page.tsx";
import AppLayout from "./pages/AppLayout.tsx";
import NotFound from "./pages/NotFound.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          {/* --- STANDALONE AUTH ROUTES --- */}
          {/* These are outside AppLayout so they don't show the navigation bar */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/Callback" element={<AuthCallback />} />

          {/* --- MAIN APP ROUTES --- */}
          {/* These are inside AppLayout and will show your app's standard UI/Navigation */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/device" element={<DevicePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* --- 404 FALLBACK --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}