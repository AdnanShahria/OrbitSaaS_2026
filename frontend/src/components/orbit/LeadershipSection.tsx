import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { Users, Linkedin, Twitter, Mail, Instagram, Facebook, Github, Send } from 'lucide-react';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { ensureAbsoluteUrl } from '@/lib/utils';

// ─── Custom SVG Icons for platforms not in lucide ───

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const ThreadsIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.732 2.07-1.128 3.446-1.147.964-.013 1.862.098 2.692.333-.052-1.13-.348-1.983-.882-2.536-.604-.625-1.568-.942-2.865-.942h-.033c-1.038.007-1.858.258-2.51.768l-1.29-1.612c.998-.8 2.251-1.227 3.73-1.273h.05c1.826 0 3.225.533 4.159 1.584.848.954 1.292 2.292 1.322 3.98.364.199.713.42 1.045.664 1.096.807 1.908 1.873 2.353 3.088.773 2.112.555 4.854-1.404 6.77-1.81 1.77-4.127 2.534-7.291 2.556zM11.924 17.2c.077 0 .155-.002.232-.007.962-.052 1.7-.378 2.194-.97.375-.448.648-1.04.822-1.736a7.66 7.66 0 00-2.005-.282c-1.548.02-3.15.558-3.03 2.108.064.835.753 1.501 2.283 1.64.165.028.334.047.504.047z" />
  </svg>
);

const FiverrIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M23.004 15.588a.995.995 0 1 0 .002-1.99.995.995 0 0 0-.002 1.99zm-.996-3.705h-.85c-.546 0-.84.41-.84 1.092V16h-2.004v-3.404c0-.678-.304-1.092-.84-1.092h-.856c-.536 0-.84.41-.84 1.092V16h-2.004v-6.716h2.004v.608c.396-.476.936-.756 1.636-.756.732 0 1.328.28 1.724.808.456-.528 1.1-.808 1.864-.808 1.42 0 2.41 1.012 2.41 2.588V16h-2.004v-3.404c0-.678-.304-1.092-.84-1.092l.04.38zm-8.163-3.567a1.217 1.217 0 1 0-.002-2.434 1.217 1.217 0 0 0 .002 2.434zM12.843 16h-2.004V9.284h2.004V16zM7.92 16H5.528v-4.584H3.852v-2.132h1.676V7.932c0-1.98 1.012-3.18 3.312-3.18H10.4v2.164H9.536c-.744 0-.976.324-.976.904v1.464h1.828v2.132H8.56V16h-.64z" />
  </svg>
);

const UpworkIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.795-3.057 2.838-3.057 1.205 0 2.184.977 2.184 2.184 0 1.206-.979 2.218-2.184 2.218zm0-6.467c-2.258 0-3.893 1.428-4.594 3.627-.898-1.357-1.586-2.977-1.984-4.342h-2.16v5.479c0 1.143-.936 2.074-2.078 2.074S5.666 12.598 5.666 11.455V5.976H3.506v5.479c0 2.342 1.9 4.256 4.256 4.256s4.256-1.914 4.256-4.256V9.939c.398.842.893 1.682 1.506 2.396l-1.275 5.998h2.219l.918-4.32c1.063.678 2.258 1.145 3.475 1.145 2.41 0 4.361-1.963 4.361-4.393s-1.963-4.076-4.361-4.076z" />
  </svg>
);

// ─── Platform config for rendering ───

const SOCIAL_PLATFORMS: { key: string; icon: any; label: string; isMailto?: boolean }[] = [
  { key: 'google', icon: GoogleIcon, label: 'Google' },
  { key: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp' },
  { key: 'instagram', icon: Instagram, label: 'Instagram' },
  { key: 'facebook', icon: Facebook, label: 'Facebook' },
  { key: 'threads', icon: ThreadsIcon, label: 'Threads' },
  { key: 'twitter', icon: Twitter, label: 'Twitter' },
  { key: 'fiverr', icon: FiverrIcon, label: 'Fiverr' },
  { key: 'upwork', icon: UpworkIcon, label: 'Upwork' },
  { key: 'telegram', icon: Send, label: 'Telegram' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { key: 'github', icon: Github, label: 'GitHub' },
  { key: 'email', icon: Mail, label: 'Email', isMailto: true },
];

export function LeadershipSection() {
  const { content } = useContent();
  const { lang } = useLang();
  const t = (content[lang] as any)?.leadership;
  const members = (t?.members || []).filter((m: any) => !m.hidden);

  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const isHoveredRef = useRef(false);
  const memberRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop outline rotational animation — uses ref for hover to avoid interval recreation
  useEffect(() => {
    if (isMobile || members.length === 0) return;
    
    // Set initial active index
    setActiveIndex(prev => prev === -1 ? 0 : prev);

    const interval = setInterval(() => {
      if (!isHoveredRef.current) {
        setActiveIndex(prev => (prev + 1) % members.length);
      }
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isMobile, members.length]);

  // Mobile focused glow logic
  useEffect(() => {
    if (!isMobile || members.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = memberRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx !== -1) setActiveIndex(idx);
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: "-20% 0px -20% 0px"
    });

    memberRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isMobile, members.length]);

  // Get enabled socials for a member (max 4, respecting admin toggles)
  const getEnabledSocials = useCallback((member: any) => {
    if (!member.socials) return [];
    const enabled = SOCIAL_PLATFORMS.filter(p => {
      const social = member.socials[p.key];
      return social?.enabled && social?.url;
    });
    return enabled.slice(0, 4); // enforce max 4 on render
  }, []);

  return (
    <section id="leadership" className="relative overflow-hidden min-h-[100dvh] flex flex-col justify-center bg-[#FAFAFA]">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Radial Gradient */}
        <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-amber-100/30 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-emerald-100/20 rounded-full blur-[100px] translate-y-1/2" />
        
        {/* Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] noise-overlay pointer-events-none" />
        
        {/* Subtle Line Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4A017" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <span className="px-4 py-1.5 rounded-full bg-white border border-amber-200 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 shadow-sm flex items-center gap-2">
              <Users size={12} className="text-amber-600" />
              {t?.pill || 'Our Leadership'}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-normal tracking-tight text-[#1A1A1A] mb-6 mb-16"
            style={{ fontFamily: "'Abril Fatface', serif" }}
          >
            {t?.title || 'Meet Our Team'}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-slate-600/90 leading-relaxed font-medium"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {t?.subtitle || 'Bringing together decades of expertise in Cloudflare architectures, SaaS scalability, and high-conversion design.'}
          </motion.p>
        </div>

        {/* Members grid */}
        {members.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {members.map((member: any, i: number) => {
              const isActive = activeIndex === i;
              const enabledSocials = getEnabledSocials(member);
              
              const isDesktopBreak = () => {
                const total = members.length;
                if (total === 5 && i === 2) return true;
                if (total === 7 && i === 3) return true;
                if (total === 8 && i === 3) return true;
                if (total === 9 && (i === 2 || i === 5)) return true; // 3+3+3
                if (total > 9 && (i + 1) % 4 === 0 && i !== total - 1) return true;
                return false;
              };

              const card = (
                <motion.div
                  key={`card-${i}`}
                  ref={(el) => { memberRefs.current[i] = el; }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-[calc(50%-0.5rem)] sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] group relative flex flex-col items-center p-4 sm:p-8 rounded-3xl backdrop-blur-md border border-amber-900/5 transition-all duration-500 hover:bg-white/60 hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-2 ${isActive ? 'bg-white/60 shadow-2xl shadow-amber-900/5 -translate-y-2' : 'bg-white/40'}`}
                  onMouseEnter={() => {
                    if (!isMobile) {
                      setActiveIndex(i);
                      isHoveredRef.current = true;
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile) {
                      isHoveredRef.current = false;
                    }
                  }}
                >
                  {/* Rising Aura Effect */}
                  <div className={`absolute inset-0 rounded-3xl transition-opacity duration-700 pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl" />
                  </div>

                  {/* Avatar Container */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4 sm:mb-8 z-10">
                    {/* Rotating Border */}
                    <div className={`absolute -inset-2 rounded-full border border-dashed transition-all duration-1000 ${isActive ? 'border-amber-500/40 rotate-[30deg]' : 'border-amber-500/0 group-hover:border-amber-500/40 group-hover:rotate-[30deg]'}`} />
                    
                    <div className={`w-full h-full rounded-full overflow-hidden ring-4 ring-white shadow-xl transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                      {member.image || member.avatar ? (
                        <img
                          src={member.image || member.avatar}
                          alt={member.name}
                          className={`w-full h-full object-cover transition-all duration-700 ${isActive ? 'grayscale-0 scale-110' : 'grayscale scale-100 group-hover:grayscale-0 group-hover:scale-110'}`}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold text-3xl"
                          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}
                        >
                          {member.name?.charAt(0) || 'M'}
                        </div>
                      )}
                    </div>
                  </div>

                <h3 className="text-lg sm:text-2xl text-[#1A1A1A] mb-1 sm:mb-2 text-center leading-tight" style={{ fontFamily: "'Abril Fatface', serif" }}>
                  {member.name}
                </h3>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700 font-bold mb-2 sm:mb-3 text-center">
                  {member.role || member.position}
                </p>
                {member.bio && (
                  <p className="text-[10px] sm:text-xs text-slate-500 text-center leading-relaxed mb-3 sm:mb-4 line-clamp-3 px-1">
                    {member.bio}
                  </p>
                )}

                {/* Social links — only show admin-enabled contacts, centered */}
                {enabledSocials.length > 0 && (
                  <div className="flex justify-center gap-3 mt-auto flex-wrap">
                    {enabledSocials.map((platform) => {
                      const social = member.socials[platform.key];
                      const url = ensureAbsoluteUrl(social.url);
                      const href = platform.isMailto ? `mailto:${social.url}` : url;
                      const IconComponent = platform.icon;
                      // Check if icon is a lucide component (function) or custom SVG component
                      const isLucide = IconComponent.render || IconComponent.$$typeof;
                      return (
                        <a
                          key={platform.key}
                          href={href}
                          target={platform.isMailto ? undefined : '_blank'}
                          rel={platform.isMailto ? undefined : 'noopener noreferrer'}
                          className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-300"
                          title={platform.label}
                        >
                          {isLucide ? <IconComponent size={16} /> : <IconComponent size={16} />}
                        </a>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
            
            return isDesktopBreak() ? [card, <div key={`break-${i}`} className="hidden lg:block w-full" />] : card;
          })}
          </div>
        )}

        {/* Tagline */}
        {t?.tagline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16 sm:mt-24 text-center max-w-4xl mx-auto px-4 relative z-10"
          >
            <p 
              className="text-xl md:text-3xl font-medium text-amber-900/80 leading-relaxed italic" 
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              "{t.tagline}"
            </p>
          </motion.div>
        )}

      </div>
      <WaveDivider fill="#050505" />
    </section>
  );
}

export default LeadershipSection;
