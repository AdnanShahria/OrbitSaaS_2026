import { lazy, Suspense, useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ContentProvider } from './contexts/ContentContext';
import { Navbar } from './components/orbit/Navbar';
import { Home } from './components/orbit/Home';
import { StructuredData } from './components/seo/StructuredData';
import ScrollToTop from './components/ScrollToTop';
import { useContent } from './contexts/ContentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from './components/seo/SEOHead';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomCursor } from './components/orbit/CustomCursor';
import { CustomScrollbar } from './components/ui/CustomScrollbar';

// Helper to handle dynamic chunk import failures gracefully by forcing a browser reload
const lazyWithRetry = (importFunc: () => Promise<any>) => {
  return lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      console.error("Chunk load failed, reloading...", error);
      const hasReloaded = sessionStorage.getItem('chunk-reload-occurred');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-reload-occurred', 'true');
        window.location.reload();
        return new Promise(() => {}); // Keep in loading state
      }
      throw error;
    }
  });
};

/* ═══════════════════════════════════════════════════════════
   APP ORCHESTRATION — Coordinates sequential reveal:
   Phase 0: Nothing visible (preloader)
   Phase 1: Hero title words animate in
   Phase 2: Subtitle & CTA fade in
   Phase 3: Navbar slides down
   Phase 4: Below-fold sections ready
   ═══════════════════════════════════════════════════════════ */

interface OrchestrationContextValue {
  phase: number;
  advanceTo: (p: number) => void;
  isReady: boolean; // true once content data has arrived at least once
}

const OrchestrationContext = createContext<OrchestrationContextValue>({
  phase: 0,
  advanceTo: () => { },
  isReady: false,
});

export function useOrchestration() {
  return useContext(OrchestrationContext);
}

function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState(0);
  const { loading } = useContent();
  const hasBeenReady = useRef(false);

  // Mark ready once content has loaded at least once (fallback translations are always available)
  if (!loading) hasBeenReady.current = true;
  const isReady = hasBeenReady.current || !loading;

  // Kick off phase 1 once content is ready
  useEffect(() => {
    if (isReady && phase === 0) {
      // Small RAF delay to ensure the browser has painted the black bg first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase(1);
        });
      });
    }
  }, [isReady, phase]);

  // Auto-advance the cascade: 1→2→3→4 with staggered timing
  useEffect(() => {
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 600);  // subtitle after title words
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 400);  // navbar after subtitle
      return () => clearTimeout(t);
    }
    if (phase === 3) {
      const t = setTimeout(() => setPhase(4), 300);  // rest
      return () => clearTimeout(t);
    }
  }, [phase]);

  const advanceTo = useCallback((p: number) => {
    setPhase(prev => Math.max(prev, p));
  }, []);

  return (
    <OrchestrationContext.Provider value={{ phase, advanceTo, isReady }}>
      {children}
    </OrchestrationContext.Provider>
  );
}

// Lazy load public sections
const StatsSection = lazy(() => import('./components/orbit/StatsSection').then(m => ({ default: m.StatsSection })));
const ServicesSection = lazy(() => import('./components/orbit/ServicesSection').then(m => ({ default: m.ServicesSection })));
const ProcessSection = lazy(() => import('./components/orbit/ProcessSection').then(m => ({ default: m.ProcessSection })));
const TechStackSection = lazy(() => import('./components/orbit/TechStackSection').then(m => ({ default: m.TechStackSection })));
const WhyUsSection = lazy(() => import('./components/orbit/WhyUsSection').then(m => ({ default: m.WhyUsSection })));
const ProjectsSection = lazy(() => import('./components/orbit/ProjectsSection').then(m => ({ default: m.ProjectsSection })));
const AchievementsSection = lazy(() => import('./components/orbit/AchievementsSection').then(m => ({ default: m.AchievementsSection })));
const LeadershipSection = lazy(() => import('./components/orbit/LeadershipSection').then(m => ({ default: m.LeadershipSection })));
const ReviewsSection = lazy(() => import('./components/orbit/ReviewsSection').then(m => ({ default: m.ReviewsSection })));
const ContactSection = lazy(() => import('./components/orbit/ContactSection').then(m => ({ default: m.ContactSection })));
const OrbitFooter = lazy(() => import('./components/orbit/OrbitFooter').then(m => ({ default: m.OrbitFooter })));
const MobileFooter = lazy(() => import('./components/orbit/MobileFooter').then(m => ({ default: m.MobileFooter })));
const Chatbot = lazy(() => import('./components/orbit/chatbot').then(m => ({ default: m.Chatbot })));
const LeadMagnetPopup = lazy(() => import('./components/orbit/LeadMagnetPopup').then(m => ({ default: m.LeadMagnetPopup })));

// Lazy load public pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const AchievementDetail = lazy(() => import('./pages/AchievementDetail'));

// Lazy load admin pages
const AdminLogin = lazyWithRetry(() => import('./pages/AdminLogin'));
const AdminLayout = lazyWithRetry(() => import('./pages/AdminLayout'));
const AdminHero = lazyWithRetry(() => import('./pages/admin/AdminHero'));
const AdminStats = lazyWithRetry(() => import('./pages/admin/AdminStats'));
const AdminServices = lazyWithRetry(() => import('./pages/admin/AdminServices'));
const AdminProcess = lazyWithRetry(() => import('./pages/admin/AdminProcess'));
const AdminTechStack = lazyWithRetry(() => import('./pages/admin/AdminTechStack'));
const AdminWhyUs = lazyWithRetry(() => import('./pages/admin/AdminWhyUs'));
const AdminProjects = lazyWithRetry(() => import('./pages/admin/AdminProjects'));
const AdminLeadership = lazyWithRetry(() => import('./pages/admin/AdminLeadership'));
const AdminReviews = lazyWithRetry(() => import('./pages/admin/AdminReviews'));
const AdminAchievements = lazyWithRetry(() => import('./pages/admin/AdminAchievements'));
const AdminContact = lazyWithRetry(() => import('./pages/admin/AdminContact'));
const AdminFooter = lazyWithRetry(() => import('./pages/admin/AdminFooter'));
const AdminChatbot = lazyWithRetry(() => import('./pages/admin/AdminChatbot'));
const AdminLeads = lazyWithRetry(() => import('./pages/admin/AdminLeads'));
const AdminLinks = lazyWithRetry(() => import('./pages/admin/AdminLinks'));
const AdminNavbar = lazyWithRetry(() => import('./pages/admin/AdminNavbar'));
const AdminSEO = lazyWithRetry(() => import('./pages/admin/AdminSEO'));
const AdminBackup = lazyWithRetry(() => import('./pages/admin/AdminBackup'));
const AdminLegal = lazyWithRetry(() => import('./pages/admin/AdminLegal'));
const AdminNotifications = lazyWithRetry(() => import('./pages/admin/AdminNotifications'));
const AdminProfile = lazyWithRetry(() => import('./pages/admin/AdminProfile'));
const AdminFinanceDashboard = lazyWithRetry(() => import('./pages/admin/finance/AdminFinanceDashboard'));
const AdminFinanceTransactions = lazyWithRetry(() => import('./pages/admin/finance/AdminFinanceTransactions'));
const AdminAuditLog = lazyWithRetry(() => import('./pages/admin/AdminAuditLog'));
const AdminImageOptimizer = lazyWithRetry(() => import('./pages/admin/AdminImageOptimizer'));

function SitePreloader() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#060606] overflow-hidden">
      <div className="relative flex items-center justify-center w-32 h-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-white/5 border-t-[#D4A017]/80"
          style={{ borderWidth: '1px' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 rounded-full border border-white/5 border-b-[#E8B423]/60"
          style={{ borderWidth: '1px' }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-6 rounded-full border border-white/5 border-r-[#F5C542]/40"
          style={{ borderWidth: '1px' }}
        />
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-[#D4A017] to-[#F5C542] shadow-[0_0_20px_rgba(212,160,23,0.8)]"
        />
      </div>
      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="mt-8 text-[11px] font-bold uppercase tracking-[0.4em] text-[#D4A017]/80"
      >
        Initializing
      </motion.div>
    </div>
  );
}

/**
 * VisitorGateway: Handles push notification subscription on first visit.
 */
function VisitorGateway({ children }: { children: React.ReactNode }) {
  const [hasEntered, setHasEntered] = useState(() => sessionStorage.getItem('orbit_gate_passed') === 'true');

  useEffect(() => {
    if (hasEntered) return;

    const handleEnter = async () => {
      try {
        if ('Notification' in window && 'serviceWorker' in navigator && localStorage.getItem('orbit_push_subscribed') !== 'true') {
          let permission = Notification.permission;
          if (permission === 'default') {
            permission = await Notification.requestPermission();
          }

          if (permission === 'granted') {
            (async () => {
              try {
                const registration = await navigator.serviceWorker.ready;
                const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) return;

                const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
                const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                const rawData = atob(base64);
                const applicationServerKey = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; i++) applicationServerKey[i] = rawData.charCodeAt(i);

                const subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey,
                });

                const sub = subscription.toJSON();
                const API_BASE = import.meta.env.VITE_API_URL || '';
                await fetch(`${API_BASE}/api/notifications?action=subscribe`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys }),
                });

                localStorage.setItem('orbit_push_subscribed', 'true');
              } catch (err) {
                console.error('Push subscription failed:', err);
              }
            })();
          }
        }
      } catch { /* ignore */ }

      setHasEntered(true);
      sessionStorage.setItem('orbit_gate_passed', 'true');
    };

    handleEnter();
  }, [hasEntered]);

  return <>{children}</>;
}

function PublicSite() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let sessionId = localStorage.getItem('orbit_visitor_session_id');
    if (!sessionId) {
      sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'session-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('orbit_visitor_session_id', sessionId);
    }
    const API_BASE = import.meta.env.VITE_API_URL || '';
    fetch(`${API_BASE}/api/leads?action=visitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    }).catch(err => console.error("Visitor logging failed", err));
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    // Signal pre-renderer
    setTimeout(() => {
      document.dispatchEvent(new Event('custom-render-trigger'));
    }, 1500);
  }, []);

  // Handle direct navigation to routes via anchor scrolling
  useEffect(() => {
    if (!isLoaded) return;

    // Map existing paths to section IDs
    const routeToId: Record<string, string> = {
      '/services': 'services',
      '/process': 'process',
      '/techstack': 'techstack',
      '/why-us': 'why-us',
      '/proj': 'projects',
      '/project': 'projects',
      '/achievements': 'achievements',
      '/reviews': 'reviews',
      '/leadership': 'leadership',
      '/contact': 'contact'
    };

    // Handle trailing slashes gracefully
    const normalizedPath = location.pathname.endsWith('/') && location.pathname.length > 1 
      ? location.pathname.slice(0, -1) 
      : location.pathname;

    const targetId = routeToId[normalizedPath];
    if (targetId) {
      // Use polling to wait until the Suspense component actually renders its children
      let attempts = 0;
      const interval = setInterval(() => {
        const el = document.getElementById(targetId);
        // Ensure the element has actually rendered the lazy-loaded content
        if (el && el.children.length > 0 && el.offsetHeight > 50) {
          // Check if all previous sections have loaded by looking for empty sibling divs
          const previousEmptySections = Array.from(document.querySelectorAll('div.section-wrapper:empty'));
          if (previousEmptySections.length === 0 || attempts > 20) {
            el.scrollIntoView({ behavior: 'smooth' });
            clearInterval(interval);
          }
        }
        attempts++;
        if (attempts > 100) clearInterval(interval); // Give up after 10 seconds
      }, 100);

      return () => clearInterval(interval);
    } else if (normalizedPath === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => setShowChatbot(true), 2000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  return (
    <div className="flex flex-col w-full min-h-screen">
      <div id="hero" className="w-full !border-none section-wrapper"><Home /></div>
      <div id="services" className="w-full !border-none section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><ServicesSection /></Suspense></div>
      <div id="process" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><ProcessSection /></Suspense></div>
      <div id="techstack" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><TechStackSection /></Suspense></div>
      <div id="why-us" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><WhyUsSection /></Suspense></div>
      <div id="projects" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><ProjectsSection /></Suspense></div>
      <div id="achievements" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><AchievementsSection /></Suspense></div>
      <div id="reviews" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><ReviewsSection /></Suspense></div>
      <div id="leadership" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><LeadershipSection /></Suspense></div>
      <div id="contact" className="w-full section-wrapper empty:min-h-[100dvh]"><Suspense fallback={null}><ContactSection /><div className="block md:hidden"><MobileFooter /></div><div className="hidden md:block"><OrbitFooter /></div></Suspense></div>

      {isLoaded && (
        <Suspense fallback={null}>
          <LeadMagnetPopup />
        </Suspense>
      )}
      {showChatbot && (
        <Suspense fallback={null}>
          <Chatbot />
        </Suspense>
      )}
    </div>
  );
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function NavbarVisibilityWrapper() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { phase } = useOrchestration();

  // Don't render navbar until orchestration phase 3 (after title + subtitle)
  if (isAdmin || phase < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />
    </motion.div>
  );
}

export default function App() {
  useEffect(() => {
    sessionStorage.removeItem('chunk-reload-occurred');
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ContentProvider>
          <OrchestrationProvider>
            <LanguageProvider>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <CustomScrollbar />
                <ScrollToTop />
                <CustomCursor />
                <SEOHead />
                <Toaster position="top-right" theme="dark" richColors closeButton />
                <NavbarVisibilityWrapper />
                <Suspense fallback={<SitePreloader />}>
                  <Routes>
                    {/* Public Core Pages with PageFlip Transitions - Consolidated to prevent unmount/flicker */}
                    <Route element={
                      <VisitorGateway>
                        <StructuredData />
                        <PublicSite />
                      </VisitorGateway>
                    }>
                      {['/', '/services', '/process', '/techstack', '/why-us', '/proj', '/project', '/achievements', '/reviews', '/leadership', '/contact'].map(path => (
                        <Route key={path} path={path} element={null} />
                      ))}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                    <Route path="/privacy" element={
                      <VisitorGateway>
                        <StructuredData />
                        <PrivacyPolicy />
                      </VisitorGateway>
                    } />
                    <Route path="/terms" element={
                      <VisitorGateway>
                        <StructuredData />
                        <TermsOfService />
                      </VisitorGateway>
                    } />
                    <Route path="/project/:id" element={
                      <VisitorGateway>
                        <StructuredData />
                        <ProjectDetail />
                      </VisitorGateway>
                    } />
                    <Route path="/achievement/:id" element={
                      <VisitorGateway>
                        <StructuredData />
                        <AchievementDetail />
                      </VisitorGateway>
                    } />

                    {/* Admin Area */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="/admin/hero" replace />} />
                      <Route path="hero" element={<AdminHero />} />
                      <Route path="stats" element={<AdminStats />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="process" element={<AdminProcess />} />
                      <Route path="tech-stack" element={<AdminTechStack />} />
                      <Route path="why-us" element={<AdminWhyUs />} />
                      <Route path="project" element={<AdminProjects />} />
                      <Route path="leadership" element={<AdminLeadership />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="achievements" element={<AdminAchievements />} />
                      <Route path="contact" element={<AdminContact />} />
                      <Route path="footer" element={<AdminFooter />} />
                      <Route path="chatbot" element={<AdminChatbot />} />
                      <Route path="links" element={<AdminLinks />} />
                      <Route path="navbar" element={<AdminNavbar />} />
                      <Route path="seo" element={<AdminSEO />} />
                      <Route path="leads" element={<AdminLeads />} />
                      <Route path="backup" element={<AdminBackup />} />
                      <Route path="legal" element={<AdminLegal />} />
                      <Route path="notifications" element={<AdminNotifications />} />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="finance" element={<AdminFinanceDashboard />} />
                      <Route path="finance/transactions" element={<AdminFinanceTransactions />} />
                      <Route path="audit" element={<AdminAuditLog />} />
                      <Route path="optimizer" element={<AdminImageOptimizer />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </LanguageProvider>
          </OrchestrationProvider>
        </ContentProvider>
      </QueryClientProvider>
    </>
  );
}
