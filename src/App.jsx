import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import SettingsContextProvider from "./context/SettingsContext";
import ErrorBoundary from "./components/ErrorBoundary";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Editor = lazy(() => import("./pages/Editor"));
const BugReport = lazy(() => import("./pages/BugReport"));
const Templates = lazy(() => import("./pages/Templates"));
const CloudDiagrams = lazy(() => import("./pages/CloudDiagrams"));
const NotFound = lazy(() => import("./pages/NotFound"));
const routerBaseName = normalizeBaseName(import.meta.env.BASE_URL);

export default function App() {
  return (
    <BrowserRouter basename={routerBaseName}>
      <SettingsContextProvider>
        <RestoreScroll />
        <ErrorBoundary>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/editor/diagrams/:id" element={<Editor />} />
              <Route path="/editor/templates/:id" element={<Editor />} />
              <Route path="/bug-report" element={<BugReport />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/cloud/diagrams" element={<CloudDiagrams />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </SettingsContextProvider>
    </BrowserRouter>
  );
}

function normalizeBaseName(baseUrl) {
  if (!baseUrl || baseUrl === "/") return undefined;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function RouteLoading() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-200">
      {t("loading")}
    </main>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
