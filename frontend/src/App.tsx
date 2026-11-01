import { lazy, Suspense, useEffect, useState, createContext, useContext, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
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
const lazyWithRetry = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | any>
) => {
  return lazy(async () => {
    const pageKey = 'chunk_reload_' + window.location.pathname;
    try {
      const comp = await importFunc();
      sessionStorage.removeItem(pageKey);
      return comp;
    } catch (error: any) {
      console.error("[ChunkLoad] Failed to load module chunk, attempting reload:", error);
      const hasReloaded = sessionStorage.getItem(pageKey);
      const lastGlobalReload = Number(sessionStorage.getItem('chunk_reload_timestamp') || 0);
      const now = Date.now();

      // Avoid infinite loops: only reload once per route and at most once every 10 seconds
      if (!hasReloaded && now - lastGlobalReload > 10000) {
        sessionStorage.setItem(pageKey, 'true');
        sessionStorage.setItem('chunk_reload_timestamp', String(now));
        window.location.reload();
        return new Promise(() => {}); // Keep in loading state while browser reloads
      }
      throw error;
    }
  });
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[SectionErrorBoundary] Caught section render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

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
  advanceTo: (phase: number) => void;
  isReady: boolean;
}

const OrchestrationContext = createContext<OrchestrationContextValue>({
  phase: 0,
  advanceTo: () => {},
  isReady: false,
});

export const useOrchestration = () => useContext(OrchestrationContext);

function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const { loading } = useContent();
  const [phase, setPhase] = useState(0);
  const hasBeenReady = useRef(false);

  // Mark ready once content has loaded at least once (fallback translations are always available)
  if (!loading) hasBeenReady.current = true;
  const isReady = hasBeenReady.current || !loading;

  // Failsafe: Never allow the app to be stuck on a blank/black screen
  // If network queries are slow or lagging, advance to phase 1 within 60ms using local translations
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setPhase(prev => (prev === 0 ? 1 : prev));
    }, 60);
    return () => clearTimeout(fallbackTimer);
  }, []);

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

  // Auto-advance the cascade: 1→2→3→4 with faster staggered timing
  useEffect(() => {
    if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 200);  // subtitle after title words
      return () => clearTimeout(t);
    }
    if (phase === 2) {
      const t = setTimeout(() => setPhase(3), 150);  // navbar after subtitle
      return () => clearTimeout(t);
    }
    if (phase === 3) {
      const t = setTimeout(() => setPhase(4), 150);  // rest
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

// Lazy load public sections with version auto-reload recovery
const StatsSection = lazyWithRetry(() => import('./components/orbit/StatsSection').then(m => ({ default: m.StatsSection })));
const ServicesSection = lazyWithRetry(() => import('./components/orbit/ServicesSection').then(m => ({ default: m.ServicesSection })));
// const ProcessSection = lazyWithRetry(() => import('./components/orbit/ProcessSection').then(m => ({ default: m.ProcessSection })));
const TechStackSection = lazyWithRetry(() => import('./components/orbit/TechStackSection').then(m => ({ default: m.TechStackSection })));
const WhyUsSection = lazyWithRetry(() => import('./components/orbit/WhyUsSection').then(m => ({ default: m.WhyUsSection })));
const ProjectsSection = lazyWithRetry(() => import('./components/orbit/ProjectsSection').then(m => ({ default: m.ProjectsSection })));
const AchievementsSection = lazyWithRetry(() => import('./components/orbit/AchievementsSection').then(m => ({ default: m.AchievementsSection })));
const LeadershipSection = lazyWithRetry(() => import('./components/orbit/LeadershipSection').then(m => ({ default: m.LeadershipSection })));
const ReviewsSection = lazyWithRetry(() => import('./components/orbit/ReviewsSection').then(m => ({ default: m.ReviewsSection })));
const ContactSection = lazyWithRetry(() => import('./components/orbit/ContactSection').then(m => ({ default: m.ContactSection })));
const OrbitFooter = lazyWithRetry(() => import('./components/orbit/OrbitFooter').then(m => ({ default: m.OrbitFooter })));
const MobileFooter = lazyWithRetry(() => import('./components/orbit/MobileFooter').then(m => ({ default: m.MobileFooter })));
const Chatbot = lazyWithRetry(() => import('./components/orbit/chatbot').then(m => ({ default: m.Chatbot })));
const LeadMagnetPopup = lazyWithRetry(() => import('./components/orbit/LeadMagnetPopup').then(m => ({ default: m.LeadMagnetPopup })));

// Lazy load public pages with version auto-reload recovery
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const ProjectDetail = lazyWithRetry(() => import('./pages/ProjectDetail'));
const AchievementDetail = lazyWithRetry(() => import('./pages/AchievementDetail'));

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
const AdminInvoices = lazyWithRetry(() => import('./pages/admin/AdminInvoices'));
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
          const permission = Notification.permission;
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
    // Skip visitor logging during local development to avoid unnecessary API requests
    if (import.meta.env.DEV) return;

    // Only log once per session to avoid duplicate calls on re-renders or navigation
    if (sessionStorage.getItem('orbit_visitor_session_logged')) return;

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
    })
      .then(() => {
        sessionStorage.setItem('orbit_visitor_session_logged', 'true');
      })
      .catch(err => console.error("Visitor logging failed", err));
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

    let targetId = routeToId[normalizedPath];
    const searchParams = new URLSearchParams(location.search);
    if (!targetId && searchParams.has('member')) {
      targetId = 'leadership';
    }

    if (targetId) {
      // Use polling to wait until the target section mounts and renders
      let attempts = 0;
      const interval = setInterval(() => {
        const el = document.getElementById(targetId);
        if (el && el.offsetHeight > 50) {
          const navOffset = 70;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: attempts === 0 ? 'auto' : 'smooth'
          });
          clearInterval(interval);
        }
        attempts++;
        if (attempts > 60) clearInterval(interval); // Give up after 6 seconds
      }, 100);

      return () => clearInterval(interval);
    } else if (normalizedPath === '/' && !searchParams.has('member')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.search, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => setShowChatbot(true), 2000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  return (
    <main id="main-content" className="flex flex-col w-full min-h-screen bg-[#FDFBF7]">
      <div className="w-full !border-none section-wrapper"><Home /></div>
      <div className="w-full !border-none section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><ServicesSection /></Suspense></SectionErrorBoundary></div>
      <div className="w-full section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><WhyUsSection /></Suspense></SectionErrorBoundary></div>
      <div className="w-full section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><ProjectsSection /></Suspense></SectionErrorBoundary></div>
      <div className="w-full section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><AchievementsSection /></Suspense></SectionErrorBoundary></div>
      <div className="w-full section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><ReviewsSection /></Suspense></SectionErrorBoundary></div>
      <div className="w-full section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><LeadershipSection /></Suspense></SectionErrorBoundary></div>
      <div className="w-full section-wrapper"><SectionErrorBoundary><Suspense fallback={null}><ContactSection /><div className="block md:hidden"><MobileFooter /></div><div className="hidden md:block"><OrbitFooter /></div></Suspense></SectionErrorBoundary></div>

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
    </main>
  );
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function NavbarVisibilityWrapper() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { phase } = useOrchestration();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const handleLightboxState = (e: any) => {
      setIsLightboxOpen(e.detail?.isOpen ?? false);
    };
    window.addEventListener('orbit-lightbox-state-change', handleLightboxState);
    return () => window.removeEventListener('orbit-lightbox-state-change', handleLightboxState);
  }, []);

  // Don't render navbar until orchestration phase 3 (after title + subtitle)
  if (isAdmin || phase < 3) return null;

  return (
    <motion.div
      data-orbit-navbar-wrapper="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: isLightboxOpen ? 0 : 1 }}
      style={{ pointerEvents: isLightboxOpen ? 'none' : 'auto' }}
      transition={{ duration: 0.3 }}
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
                      {['/', '/services', '/why-us', '/proj', '/project', '/achievements', '/reviews', '/leadership', '/contact'].map(path => (
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
                      <Route path="invoices" element={<AdminInvoices />} />
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
