import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Auto-reload on dynamic import chunk failure (e.g. after a new production deployment with changed hashes)
if (typeof window !== "undefined") {
    const handleStaleChunkReload = (reason: string) => {
        console.warn("[Vite] Stale chunk detected due to new deployment. Auto-reloading fresh version...", reason);
        const reloadKey = "orbit_vite_preload_reload";
        const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
        const now = Date.now();
        // Prevent infinite loops if offline or experiencing network failure: reload at most once every 8s
        if (now - lastReload > 8000) {
            sessionStorage.setItem(reloadKey, String(now));
            if ("caches" in window) {
                caches.keys().then((names) => {
                    return Promise.all(names.map(name => caches.delete(name)));
                }).finally(() => {
                    window.location.reload();
                });
            } else {
                window.location.reload();
            }
        }
    };

    window.addEventListener("vite:preloadError", (event) => {
        handleStaleChunkReload("vite:preloadError");
    });

    window.addEventListener("unhandledrejection", (event) => {
        const errorMsg = event.reason?.message || String(event.reason || "");
        if (
            errorMsg.includes("dynamically imported module") ||
            errorMsg.includes("Expected a JavaScript-or-Wasm module script") ||
            errorMsg.includes("Failed to fetch dynamically imported module")
        ) {
            event.preventDefault(); // suppress red console crash
            handleStaleChunkReload(errorMsg);
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
