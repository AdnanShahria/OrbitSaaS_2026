import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowLeft } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import orbitLogo from '@/assets/OrbitLogo.png';

const NAV_SECTIONS = [
  { path: '/', label: 'Home' },
  { path: '/services', label: 'Services' },
  { path: '/why-us', label: 'Why Us' },
  { path: '/proj', label: 'Projects' },
  { path: '/achievements', label: 'Achievements' },
  { path: '/reviews', label: 'Reviews' },
  { path: '/leadership', label: 'Team' },
  { path: '/contact', label: 'Contact' },
];

const PATH_TO_SECTION: Record<string, string> = {
  '/': 'hero',
  '/services': 'services',
  '/techstack': 'tech',
  '/why-us': 'why-us',
  '/proj': 'project',
  '/project': 'project',
  '/achievements': 'achievements',
  '/reviews': 'reviews',
  '/leadership': 'leadership',
  '/contact': 'contact',
};

// ── WhatsApp Icon Component ──
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);



export function Navbar() {
  const { content } = useContent();
  const { lang, toggleLang } = useLang();
  const t = content[lang] as any;
  const [isPending, startTransition] = useTransition();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isProjectPage = location.pathname.startsWith('/project/');
  const isAchievementPage = location.pathname.startsWith('/achievement/');
  
  // Find project title if on project page
  const projectId = isProjectPage ? location.pathname.split('/').pop() : null;
  const projectTitle = isProjectPage ? (() => {
      const items = (content[lang] as any).projects?.items || [];
      const item = items.find((p: any, i: number) => p.id === projectId || String(i) === projectId);
      return item?.title || 'Project';
  })() : null;

  // Find achievement title if on achievement page
  const achievementId = isAchievementPage ? location.pathname.split('/').pop() : null;
  const achievementTitle = isAchievementPage ? (() => {
      const items = (content[lang] as any).achievements?.items || [];
      const item = items.find((a: any, i: number) => a.id === achievementId || String(i) === achievementId);
      return item?.title || 'Milestone';
  })() : null;

  // Default to the correct matched section, fallback to hero
  const matchedSection = isProjectPage ? 'project' : isAchievementPage ? 'achievements' : PATH_TO_SECTION[location.pathname] || 'hero';
  const [activeSection, setActiveSection] = useState(matchedSection);
  
  const whatsappNumber = t?.contact?.whatsapp || '+8801853452264';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  // Handle scroll state for subtle elevation change & Scroll Spy
  useEffect(() => {
    let rafPending = false;

    const handleScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        setScrolled(window.scrollY > 20);

        // Skip homepage section scroll spy on dedicated subpages
        if (isProjectPage || isAchievementPage) return;

        // Scroll Spy Logic
        const sections = ['hero', 'services', 'why-us', 'projects', 'achievements', 'reviews', 'leadership', 'contact'];
        for (let i = sections.length - 1; i >= 0; i--) {
          const id = sections[i];
          const element = document.getElementById(id);
          if (element && element.offsetHeight > 0) {
            const rect = element.getBoundingClientRect();
            // Adjust offset as needed (150px from top)
            if (rect.top <= 150 && rect.bottom > 150) {
              // Map the internal DOM ID back to our route-based activeSection identifier
              const virtualSection = id === 'projects' ? 'project' : id === 'techstack' ? 'tech' : id;
              if (activeSection !== virtualSection) {
                 startTransition(() => {
                   setActiveSection(virtualSection);
                   
                   // Optionally update URL gracefully based on mapped path, avoiding reload
                   const pathRecord = Object.entries(PATH_TO_SECTION).find(([path, sec]) => sec === virtualSection && path !== '/project' && path !== '/proj');
                   if (pathRecord && window.location.pathname !== pathRecord[0]) {
                     window.history.replaceState(null, '', pathRecord[0]);
                   }
                 });
              }
              break;
            }
          }
        }
      });
    };
    
    // Check eagerly on mount in case they loaded halfway down
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  // Sync with Chatbot state to hide navbar on mobile
  useEffect(() => {
    const handleChatbotState = (e: any) => {
      setIsChatbotOpen(e.detail?.isOpen ?? false);
    };
    window.addEventListener('orbit-chatbot-state-change', handleChatbotState);
    return () => window.removeEventListener('orbit-chatbot-state-change', handleChatbotState);
  }, []);

  // Sections that use Light Mode (All sections on main landing page except hero, plus detail pages)
  const isLightMode = activeSection !== 'hero';

  // Theme Variables
  const theme = {
    bg: isLightMode
        ? scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.85)'
        : scrolled ? 'rgba(6, 6, 8, 0.85)' : 'rgba(10, 10, 12, 0.35)',
    border: isLightMode
        ? scrolled ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.09)'
        : scrolled ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.10)',
    text: isLightMode ? '#09090B' : '#FFFFFF',
    textMuted: isLightMode ? 'rgba(24, 24, 27, 0.7)' : 'rgba(255, 255, 255, 0.65)',
    accent: '#10B981', // Emerald 500
    glass: isLightMode ? 'backdrop-blur-xl' : 'backdrop-blur-2xl',
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ease-out flex justify-center ${isChatbotOpen ? 'md:translate-y-0 opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'translate-y-0 opacity-100'
          }`}
      >
        {/* Cinematic Glass Shell with Left-to-Right clip-path sweep */}
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.5 }}
          animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full py-1.5 border-b rounded-b-2xl ${theme.glass} backdrop-saturate-[180%] transition-colors duration-500`}
          style={{
            backgroundColor: theme.bg,
            borderColor: theme.border,
            boxShadow: isLightMode
              ? '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)'
              : '0 10px 30px -15px rgba(0,0,0,0.5)'
          }}
        >
          {/* Subtle Apple Liquid Glass bottom hairline accent */}
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent pointer-events-none" />

          {/* Premium Emerald Shimmer Sweep (Left to Right) */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '100%', opacity: [0, 0.4, 0] }}
            transition={{ delay: 0.1, duration: 1.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981]/20 to-transparent pointer-events-none z-0 rounded-b-2xl"
          />

          <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full px-6 lg:px-8 relative z-10">
            {/* Logo area - Lefty side fade and slide in */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="flex items-center"
            >
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 group px-1 py-1 rounded-full transition-all duration-500 hover:bg-white/5"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <img
                    src={orbitLogo}
                    alt="ORBIT SaaS — Custom Web Development & AI Agency"
                    className="h-7 sm:h-8 w-auto object-contain relative z-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[5deg] rounded-lg"
                  />
                  {/* Premium Shimmer Effect */}
                  <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-lg">
                    <motion.div
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 -skew-x-12"
                    />
                  </div>
                </div>
                <span
                  className="font-black tracking-tight text-lg sm:text-xl transition-all duration-500 relative"
                  style={{ color: theme.text, fontFamily: "var(--font-display)" }}
                >
                  OrbitSaaS
                  <motion.div
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    className="absolute -bottom-1 left-0 h-[1.5px] bg-primary/50 rounded-full"
                  />
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation - Staggered from Left to Right */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-6 transition-all duration-300">
              {(isProjectPage || isAchievementPage) ? (
                <AnimatePresence>
                  {scrolled && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-[11px] font-bold text-emerald-600 tracking-tighter uppercase truncate max-w-[400px]" style={{ fontFamily: "var(--font-body)" }}>
                        {projectTitle || achievementTitle}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                NAV_SECTIONS.filter(s => s.path !== '/').map((item, idx) => {
                  const sectionId = PATH_TO_SECTION[item.path];
                  const visibility = t?.nav?.visibility?.[sectionId] !== false;
                  if (!visibility) return null;

                  const isActive = activeSection === sectionId;
                  const label = t?.nav?.[sectionId === 'tech' ? 'techStack' : sectionId === 'project' ? 'projects' : sectionId] || item.label;
                  const customUrl = t?.nav?.urls?.[sectionId];
                  const isExternal = customUrl && (customUrl.startsWith('http') || customUrl.startsWith('mailto:'));
                  const isContact = item.path === '/contact';

                  // Calculate index-based stagger delay
                  const itemDelay = 0.2 + idx * 0.05;

                  const innerContent = isExternal ? (
                    <a
                      href={customUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative z-10 ${isContact ? 'px-6 py-2.5 bg-[#059669] rounded-full shadow-[0_4px_15px_rgba(5,150,105,0.3)] hover:scale-105 transition-transform' : 'px-2 py-2'}`}
                    >
                      <motion.span
                        className={`relative z-10 transition-colors duration-500 text-[10px] font-medium tracking-tighter uppercase`}
                        style={{
                          fontFamily: "var(--font-body)",
                          color: isContact ? '#FFFFFF' : theme.textMuted
                        }}
                      >
                        {label}
                      </motion.span>
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        const targetId = sectionId === 'hero' ? 'hero' : sectionId === 'project' ? 'projects' : sectionId;
                        const el = document.getElementById(targetId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                          window.history.pushState(null, '', customUrl || item.path);
                        } else {
                          if (customUrl && customUrl.startsWith('http')) {
                            window.location.href = customUrl;
                          } else {
                            navigate(customUrl || item.path);
                          }
                        }
                      }}
                      className="relative flex items-center justify-center z-10 px-3 py-1 transition-all duration-300"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          className="absolute -bottom-1 w-1/2 h-[2px] bg-[#059669] rounded-full"
                          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        />
                      )}
                      <motion.span 
                        className={`relative z-10 transition-colors duration-500 text-[10px] sm:text-[11px] font-bold tracking-tighter uppercase whitespace-nowrap flex overflow-hidden`}
                        style={{ 
                          fontFamily: "var(--font-body)",
                          color: isActive 
                            ? '#059669' // Emerald for active text
                            : theme.textMuted
                        }}
                      >
                        {sectionId === 'project' && !isActive ? (
                          <span className="nav-projects-gradient">
                            {label}
                          </span>
                        ) : (
                          label
                        )}
                      </motion.span>
                    </button>
                  );

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: itemDelay, ease: [0.22, 1, 0.36, 1] }}
                      className="relative flex items-center justify-center"
                    >
                      {innerContent}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Right Side Actions - Premium sequence at the end of sweep */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Back Navigation (Desktop only, beside toggle) */}
              {(isProjectPage || isAchievementPage) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="hidden lg:flex items-center gap-3 mr-1"
                >
                  <button
                    onClick={() => navigate(isProjectPage ? '/#projects' : '/#achievements')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all group shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span className="text-[9px] font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-body)" }}>
                      Back
                    </span>
                  </button>
                </motion.div>
              )}

              {/* Language Switcher - Premium Toggle */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => toggleLang()}
                className={`hidden sm:flex items-center justify-center min-w-[2.8rem] h-7 sm:h-8 px-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xs active:scale-95 ${
                  isLightMode
                    ? 'border-zinc-200/90 bg-white/90 text-zinc-800 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700'
                    : 'border-emerald-500/30 bg-[#10B981]/5 text-[#10B981] hover:bg-[#10B981] hover:border-[#10B981] hover:text-white'
                }`}
                style={{
                  fontFamily: "var(--font-display)"
                }}
              >
                {lang === 'en' ? 'BN' : 'EN'}
              </motion.button>

              {/* Separated Active Page & Call Action */}
              <div className="flex items-center gap-2">
                {/* Active Page Indicator (Shown only on relevant subpages) */}
                <AnimatePresence mode="wait">
                  {activeSection !== 'hero' && !isProjectPage && !isAchievementPage && (
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex lg:hidden items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full border backdrop-blur-md"
                      style={{ 
                        backgroundColor: isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                        borderColor: isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span
                        className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter truncate max-w-[80px]"
                        style={{ color: theme.text, fontFamily: "var(--font-body)" }}
                      >
                        {isProjectPage ? projectTitle : isAchievementPage ? achievementTitle : (t?.nav?.[activeSection === 'tech' ? 'techStack' : activeSection === 'project' ? 'projects' : activeSection] || activeSection)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Glowing Green WhatsApp Button with Pop Spring entrance */}
                <motion.button
                  initial={{ opacity: 0, scale: 0, rotate: -25 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.8
                  }}
                  onClick={() => {
                    window.open(whatsappLink, '_blank');
                  }}
                  className={`group relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all duration-300 shadow-xs ${
                    isLightMode
                      ? 'border-emerald-500/40 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                      : 'backdrop-blur-md hover:text-white border-white/10'
                  }`}
                >
                  {/* Outer pulsating ring */}
                  <div className={`absolute inset-0 rounded-full border animate-ping opacity-20 ${isLightMode ? 'border-emerald-500' : 'whatsapp-ping-anim'}`} style={{ animationDuration: '3s' }} />

                  {/* Button Background Base (to receive animation on dark mode) */}
                  {!isLightMode && <div className="absolute inset-0 rounded-full whatsapp-theme-anim transition-all duration-300" />}

                  {/* Subtle inner wiggle on hover */}
                  <WhatsAppIcon className={`relative z-10 w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 ${!isLightMode ? 'whatsapp-theme-anim' : ''}`} />
                </motion.button>
              </div>

              {/* Mobile Burger - Custom Animated Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:hidden relative z-[1001] w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ color: mobileOpen ? (isLightMode ? '#09090B' : '#FFFFFF') : theme.text }}
              >
                <div className="flex flex-col gap-1.5 items-end">
                  <motion.span
                    animate={mobileOpen ? { rotate: 45, y: 7.5, width: 24 } : { rotate: 0, y: 0, width: 24 }}
                    className="h-[2px] bg-current rounded-full"
                  />
                  <motion.span
                    animate={mobileOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0, width: 18 }}
                    className="h-[2px] bg-current rounded-full"
                  />
                  <motion.span
                    animate={mobileOpen ? { rotate: -45, y: -7.5, width: 24 } : { rotate: 0, y: 0, width: 12 }}
                    className="h-[2px] bg-current rounded-full"
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Mobile Menu Overhaul */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'circle(30px at calc(100% - 60px) 40px)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at calc(100% - 60px) 40px)' }}
            exit={{ opacity: 0, clipPath: 'circle(30px at calc(100% - 60px) 40px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[999] flex flex-col p-8 sm:p-12"
            style={{
              backgroundColor: isLightMode ? 'rgba(255,255,255,0.98)' : 'rgba(6,6,8,0.98)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Background Texture for Mobile Menu */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="mt-16 flex flex-col gap-3 flex-grow overflow-y-auto custom-scrollbar pr-4">
              {isProjectPage ? (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <button
                    onClick={() => {
                      navigate('/proj');
                      setMobileOpen(false);
                    }}
                    className="group flex items-center gap-4 w-full text-left"
                  >
                    <ArrowLeft className="w-6 h-6 text-emerald-500 group-hover:-translate-x-2 transition-transform" />
                    <span
                      className="text-2xl sm:text-4xl transition-all duration-300 hover:translate-x-4"
                      style={{
                        color: isLightMode ? '#1a1a1a' : '#ffffff',
                        fontFamily: "var(--font-display)"
                      }}
                    >
                      Projects
                    </span>
                  </button>
                </motion.div>
              ) : (
                NAV_SECTIONS.map((item, i) => {
                  const sectionId = PATH_TO_SECTION[item.path];
                  const visibility = t?.nav?.visibility?.[sectionId] !== false;
                  if (!visibility) return null;

                  const isActive = activeSection === sectionId;
                  const customUrl = t?.nav?.urls?.[sectionId];
                  const isExternal = customUrl && (customUrl.startsWith('http') || customUrl.startsWith('mailto:'));
                  const label = t?.nav?.[sectionId === 'tech' ? 'techStack' : sectionId === 'project' ? 'projects' : sectionId] || item.label;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                    >
                      {isExternal ? (
                        <a
                          href={customUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-baseline gap-4"
                        >
                          <span className="text-xs font-black text-emerald-500/40 tabular-nums">0{i + 1}</span>
                          <span
                            className={`text-2xl sm:text-4xl transition-all duration-300 hover:translate-x-4`}
                            style={{
                              color: theme.text,
                              fontFamily: "var(--font-display)"
                            }}
                          >
                            {label}
                          </span>
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            const targetId = sectionId === 'hero' ? 'hero' : sectionId === 'project' ? 'projects' : sectionId;
                            const el = document.getElementById(targetId);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                              window.history.pushState(null, '', customUrl || item.path);
                            } else {
                              if (customUrl && customUrl.startsWith('http')) {
                                window.location.href = customUrl;
                              } else {
                                navigate(customUrl || item.path);
                              }
                            }
                            setMobileOpen(false);
                          }}
                          className="group flex items-baseline gap-4 w-full text-left"
                        >
                          <span className="text-xs font-black text-emerald-500/40 tabular-nums">0{i + 1}</span>
                          <span
                            className={`text-2xl sm:text-4xl transition-all duration-300 ${isActive ? 'text-emerald-500' : 'hover:translate-x-4'}`}
                            style={{
                              color: !isActive ? (isLightMode ? '#1a1a1a' : '#ffffff') : undefined,
                              fontFamily: "var(--font-display)"
                            }}
                          >
                            {label}
                          </span>
                        </button>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions for Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-auto pb-12"
            >
              <button
                onClick={() => { toggleLang(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center p-4 rounded-2xl border border-current text-xs font-black uppercase tracking-widest transition-all"
                style={{ color: isLightMode ? '#1a1a1a' : '#ffffff', borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
              >
                Switch to {lang === 'en' ? 'বাংলা' : 'English'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
