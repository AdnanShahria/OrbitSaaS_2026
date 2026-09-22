import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Auto-reload on dynamic import chunk failure (e.g. after a new production deployment with changed hashes)
if (typeof window !== "undefined") {
    window.addEventListener("vite:preloadError", (event) => {
        console.warn("[Vite] Dynamic import preload error detected. Reloading page for new assets...", event);
        const reloadKey = "orbit_vite_preload_reload";
        const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
        const now = Date.now();
        // Prevent infinite loops if offline or experiencing network failure: reload at most once every 10s
        if (now - lastReload > 10000) {
            sessionStorage.setItem(reloadKey, String(now));
            window.location.reload();
        }
    });

    // Auto-reload when a new service worker version activates and takes control
    if ("serviceWorker" in navigator) {
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);

