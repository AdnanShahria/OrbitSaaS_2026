import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import {
  Users,
  Droplets,
  X,
  Share2,
  Check,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  Github,
  Send,
  Globe,
  Briefcase,
} from 'lucide-react';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { ensureAbsoluteUrl } from '@/lib/utils';
import { getImageUrl, getFallbackUrl } from '@/lib/imageUrl';
import { toast } from 'sonner';

// ─── Custom SVG Icons ───

const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const GoogleIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const ThreadsIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.732 2.07-1.128 3.446-1.147.964-.013 1.862.098 2.692.333-.052-1.13-.348-1.983-.882-2.536-.604-.625-1.568-.942-2.865-.942h-.033c-1.038.007-1.858.258-2.51.768l-1.29-1.612c.998-.8 2.251-1.227 3.73-1.273h.05c1.826 0 3.225.533 4.159 1.584.848.954 1.292 2.292 1.322 3.98.364.199.713.42 1.045.664 1.096.807 1.908 1.873 2.353 3.088.773 2.112.555 4.854-1.404 6.77-1.81 1.77-4.127 2.534-7.291 2.556zM11.924 17.2c.077 0 .155-.002.232-.007.962-.052 1.7-.378 2.194-.97.375-.448.648-1.04.822-1.736a7.66 7.66 0 00-2.005-.282c-1.548.02-3.15.558-3.03 2.108.064.835.753 1.501 2.283 1.64.165.028.334.047.504.047z" />
  </svg>
);

// ─── Platform Config ───

const SOCIAL_CONFIG: {
  key: string;
  label: string;
  icon: any;
  pillClass: string;
  isMailto?: boolean;
  isTel?: boolean;
}[] = [
  {
    key: 'email',
    label: 'Email',
    icon: Mail,
    pillClass: 'border-emerald-300/90 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100',
    isMailto: true,
  },
  {
    key: 'whatsapp',
    label: 'Phone',
    icon: Phone,
    pillClass: 'border-emerald-300/90 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    pillClass: 'border-sky-300/90 bg-sky-50/80 text-sky-700 hover:bg-sky-100',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    pillClass: 'border-blue-300/90 bg-blue-50/80 text-blue-700 hover:bg-blue-100',
  },
  {
    key: 'twitter',
    label: 'Twitter',
    icon: Twitter,
    pillClass: 'border-slate-300/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: Github,
    pillClass: 'border-slate-300/90 bg-slate-50/80 text-slate-800 hover:bg-slate-100',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: Send,
    pillClass: 'border-sky-300/90 bg-sky-50/80 text-sky-700 hover:bg-sky-100',
  },
  {
    key: 'google',
    label: 'Google',
    icon: GoogleIcon,
    pillClass: 'border-red-300/90 bg-red-50/80 text-red-700 hover:bg-red-100',
  },
  {
    key: 'threads',
    label: 'Threads',
    icon: ThreadsIcon,
    pillClass: 'border-slate-300/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100',
  },
  {
    key: 'upwork',
    label: 'Upwork',
    icon: Globe,
    pillClass: 'border-emerald-300/90 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100',
  },
  {
    key: 'fiverr',
    label: 'Fiverr',
    icon: Briefcase,
    pillClass: 'border-emerald-300/90 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100',
  },
];

export function LeadershipSection() {
  const { content } = useContent();
  const { lang } = useLang();
  const location = useLocation();
  const t = (content[lang] as any)?.leadership;
  const members = useMemo(() => (t?.members || []).filter((m: any) => !m.hidden), [t?.members]);
  const enMembers = useMemo(() => ((content.en as any)?.leadership?.members || []).filter((m: any) => !m.hidden), [content.en]);
  const shouldReduceMotion = useReducedMotion();

  // Helper to generate a unique, clean slug for each member
  const getMemberSlug = useCallback((member: any, index?: number) => {
    if (!member) return '';
    if (member.id && String(member.id).trim()) {
      return String(member.id).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    }
    // Prefer English name for canonical shareable URL slugs even when browsing in Bengali
    let enName = member.name;
    if (index !== undefined && enMembers[index]?.name) {
      enName = enMembers[index].name;
    } else if (!/^[a-zA-Z0-9\s.-]+$/.test(enName || '')) {
      const foundEn = enMembers.find((em: any, idx: number) =>
        (member.image && em.image === member.image) ||
        (member.order !== undefined && em.order === member.order) ||
        idx === index
      );
      if (foundEn?.name) enName = foundEn.name;
    }

    const cleaned = (enName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (cleaned) return cleaned;
    if (index !== undefined) return `leader-${index + 1}`;
    return 'leader';
  }, [enMembers]);

  // Selected member for the "Read Bio" modal dialog
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpenMember = useCallback((member: any, index?: number) => {
    setSelectedMember(member);
    const slug = getMemberSlug(member, index);
    const url = new URL(window.location.href);
    url.searchParams.set('member', slug);
    window.history.replaceState(null, '', url.toString());
  }, [getMemberSlug]);

  const handleCloseModal = useCallback(() => {
    setSelectedMember(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('member');
    window.history.replaceState(null, '', url.toString());
  }, []);

  // Multi-strategy matcher to support id, slug, English name, Bangla name, or index (e.g. leader-1)
  const findMatchingMember = useCallback((param: string) => {
    if (!param || members.length === 0) return null;
    const normalized = decodeURIComponent(param).trim().toLowerCase();

    // 1. Direct match by member.id
    const byId = members.find((m: any) => m.id && String(m.id).toLowerCase() === normalized);
    if (byId) return byId;

    // 2. Match by computed slug
    for (let i = 0; i < members.length; i++) {
      const slug = getMemberSlug(members[i], i);
      if (slug.toLowerCase() === normalized) return members[i];
    }

    // 3. Match by current language name
    const byName = members.find((m: any) => m.name && m.name.toLowerCase() === normalized);
    if (byName) return byName;

    // 4. Match by English counterpart name
    for (let i = 0; i < members.length; i++) {
      const enM = enMembers[i];
      if (enM?.name && enM.name.toLowerCase() === normalized) {
        return members[i];
      }
    }

    // 5. Match by numeric or leader-N index (e.g. "leader-1", "1", "leader-2")
    const indexMatch = normalized.match(/^(?:leader-)?(\d+)$/);
    if (indexMatch) {
      const idx = parseInt(indexMatch[1], 10) - 1;
      if (idx >= 0 && idx < members.length) {
        return members[idx];
      }
    }

    // 6. Fuzzy / sanitized name matching
    for (let i = 0; i < members.length; i++) {
      const mNameClean = (members[i].name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const enNameClean = (enMembers[i]?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const paramClean = normalized.replace(/[^a-z0-9]/g, '');
      if (paramClean && (mNameClean === paramClean || enNameClean === paramClean)) {
        return members[i];
      }
    }

    return null;
  }, [members, enMembers, getMemberSlug]);

  // Deep linking: redirect/scroll to leadership segment AND automatically open member modal
  useEffect(() => {
    if (members.length === 0) return;

    // Extract member parameter from URL query or hash
    const searchParams = new URLSearchParams(location.search);
    let memberParam = searchParams.get('member');

    if (!memberParam && window.location.hash.includes('member=')) {
      const queryPart = window.location.hash.split('?')[1];
      if (queryPart) {
        const hashParams = new URLSearchParams(queryPart);
        memberParam = hashParams.get('member');
      }
    }

    if (!memberParam) return;

    const match = findMatchingMember(memberParam);
    if (!match) return;

    const scrollToLeadership = () => {
      const el = document.getElementById('leadership');
      if (el) {
        const navOffset = 70;
        const rect = el.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY - navOffset;
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth',
        });
        return true;
      }
      return false;
    };

    // Scroll immediately to the leadership segment
    scrollToLeadership();
    const retryScrollTimer = setTimeout(scrollToLeadership, 250);

    // Automatically open the modal once user arrives at leadership
    const modalTimer = setTimeout(() => {
      setSelectedMember(match);
    }, 350);

    return () => {
      clearTimeout(retryScrollTimer);
      clearTimeout(modalTimer);
    };
  }, [members, location.search, findMatchingMember]);

  const handleShareMember = async (member: any, index?: number) => {
    const slug = getMemberSlug(member, index);
    const shareUrl = `${window.location.origin}/leadership?member=${encodeURIComponent(slug)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success(lang === 'bn' ? 'সিভি ও প্রোফাইল লিংক কপি করা হয়েছে!' : 'Direct CV link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    if (selectedMember) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedMember, handleCloseModal]);

  // Extract enabled contact methods for modal
  const getEnabledContacts = useCallback((member: any) => {
    if (!member) return [];
    const list: { key: string; label: string; href: string; icon: any; pillClass: string }[] = [];

    if (member.socials) {
      for (const config of SOCIAL_CONFIG) {
        const entry = member.socials[config.key];
        if (entry?.enabled && entry?.url) {
          const rawUrl = entry.url.trim();
          let href = ensureAbsoluteUrl(rawUrl);
          if (config.isMailto) {
            href = `mailto:${rawUrl.replace(/^mailto:/i, '')}`;
          } else if (config.key === 'whatsapp') {
            if (/^\+?[0-9\s-]+$/.test(rawUrl)) {
              const cleanNumber = rawUrl.replace(/[^0-9+]/g, '');
              href = `https://wa.me/${cleanNumber.replace(/^\+/, '')}`;
            }
          }
          list.push({
            key: config.key,
            label: config.label,
            href,
            icon: config.icon,
            pillClass: config.pillClass,
          });
        }
      }
    }

    // Default fallback if no socials enabled at all
    if (list.length === 0) {
      list.push({
        key: 'email',
        label: 'Email',
        href: 'mailto:contact@orbitsaas.com',
        icon: Mail,
        pillClass: 'border-emerald-300/90 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100',
      });
    }

    return list;
  }, []);

  // Dynamic card width & column calculation:
  // - 2 columns on mobile (w-[calc(50%-0.45rem)])
  // - 2-3 columns on sm/md
  // - Max 4 columns on desktop
  const getCardWidthClass = () => {
    if (members.length === 5 || members.length <= 3) {
      return 'w-[calc(50%-0.45rem)] sm:w-[calc(50%-0.65rem)] lg:w-[calc(33.333%-0.85rem)] max-w-[300px]';
    }
    return 'w-[calc(50%-0.45rem)] sm:w-[calc(50%-0.65rem)] md:w-[calc(33.333%-0.85rem)] lg:w-[calc(25%-0.9rem)] max-w-[265px]';
  };

  return (
    <section className="relative overflow-hidden pt-3 sm:pt-5 pb-8 sm:pb-12 bg-[#FDFBF7]">
      {/* Decorative Subtle Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-100/25 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-50/30 rounded-full blur-[90px] translate-y-1/2" />
        <div className="absolute inset-0 opacity-[0.025] noise-overlay pointer-events-none" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Header - Ultra Compact Spacing (eliminates dead space circled by user) */}
        <div className="text-center mb-4 sm:mb-6">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="flex justify-center mb-1.5"
          >
            <span className="px-3 py-0.5 rounded-full bg-white border border-amber-200/90 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-800 shadow-xs flex items-center gap-1.5">
              <Users size={12} className="text-amber-600" aria-hidden="true" />
              {t?.pill || 'Our Leadership'}
            </span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t?.title || 'Our Leadership'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="max-w-lg mx-auto text-xs sm:text-sm text-slate-500 leading-relaxed font-normal"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {t?.subtitle || 'Meet the team driving innovation at ORBIT SaaS.'}
          </motion.p>
        </div>

        {/* ─── Members Grid: Dynamic 4-col max with centered row wrapping (2 cols on mobile) ─── */}
        {members.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4.5 max-w-6xl mx-auto w-full">
            {members.map((member: any, i: number) => {
              const photoUrl = member.image || member.avatar;
              const subDetail =
                member.subDetail || (member.department ? `${member.department} · 2024-2025` : 'ORBIT Core · 2024-2025');

              return (
                <motion.div
                  key={`leader-${i}`}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10px' }}
                  transition={{
                    duration: 0.35,
                    delay: shouldReduceMotion ? 0 : i * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`${getCardWidthClass()} group relative flex flex-col h-full bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 p-2.5 sm:p-3.5 overflow-hidden`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 mb-2 sm:mb-2.5 shrink-0 border border-slate-100">
                    {/* Top-Right Status / Tag Pill (only shown if a custom badge is provided in Admin Panel) */}
                    {member.badge && (
                      <div
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-500 text-white text-[8.5px] sm:text-[10px] font-bold flex items-center gap-0.5 shadow-xs"
                        title={member.badge}
                      >
                        <Droplets size={9} className="fill-white shrink-0" aria-hidden="true" />
                        <span className="leading-none">{member.badge}</span>
                      </div>
                    )}

                    {/* Member Photo or Fallback */}
                    {photoUrl ? (
                      <img
                        src={getImageUrl(photoUrl)}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const fallback = getFallbackUrl(photoUrl);
                          if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                        aria-hidden="true"
                      >
                        {member.name?.charAt(0) || 'O'}
                      </div>
                    )}
                  </div>

                  {/* Role / Title (uppercase, bold, emerald) */}
                  <p
                    className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 text-center mb-0.5 line-clamp-1"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {member.role || member.position || 'LEADERSHIP'}
                  </p>

                  {/* Name */}
                  <h3
                    className="text-xs sm:text-sm font-bold text-slate-900 text-center mb-0.5 leading-snug line-clamp-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                    title={member.name}
                  >
                    {member.name}
                  </h3>

                  {/* Sub-Detail (department, batch, session) */}
                  <p
                    className="text-[9px] sm:text-[10.5px] text-slate-500 font-medium text-center mb-2 sm:mb-2.5 line-clamp-1"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {subDetail}
                  </p>

                  {/* Action Button: "Read Bio" & "Share Direct CV Link" */}
                  <div className="flex items-center gap-1.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenMember(member, i)}
                      className="flex-1 py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200/90 active:bg-slate-200 text-slate-700 text-[10.5px] sm:text-xs font-semibold text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    >
                      {lang === 'bn' ? 'জীবনবৃত্তান্ত' : 'Read Bio'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareMember(member, i);
                      }}
                      className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 transition-colors cursor-pointer shrink-0"
                      title={lang === 'bn' ? 'সিভি লিংক কপি করুন' : 'Copy Direct Link for CV'}
                      aria-label="Copy direct CV link"
                    >
                      <Share2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tagline quote - Compact spacing */}
        {t?.tagline && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-6 sm:mt-8 text-center max-w-2xl mx-auto px-4 relative z-10"
          >
            <p
              className="text-xs sm:text-sm font-medium text-amber-900/80 leading-relaxed italic"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              "{t.tagline}"
            </p>
          </motion.div>
        )}
      </div>

      {/* ─── "Read Bio" Modal Dialog ─── */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bio-modal-title"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-auto max-h-[85vh] flex flex-col p-4 sm:p-6 relative border border-slate-100 overflow-hidden"
            >
              {/* Header Action Buttons: Share + Close */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={() => handleShareMember(selectedMember)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/80 transition-colors cursor-pointer text-xs font-medium"
                  title={lang === 'bn' ? 'সিভি লিংক কপি করুন' : 'Copy Direct Link for CV'}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-[11px] text-emerald-600 font-semibold">{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span className="text-[11px]">{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close bio"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Header: Avatar + Role + Name + SubDetail */}
              <div className="flex items-center gap-3 pr-24 sm:pr-28 shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                  {selectedMember.image || selectedMember.avatar ? (
                    <img
                      src={getImageUrl(selectedMember.image || selectedMember.avatar)}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      {selectedMember.name?.charAt(0) || 'O'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 mb-0.5 truncate">
                    {selectedMember.role || selectedMember.position || 'LEADERSHIP'}
                  </p>
                  <h3
                    id="bio-modal-title"
                    className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {selectedMember.name}
                  </h3>
                  <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium truncate">
                    {selectedMember.subDetail ||
                      (selectedMember.department
                        ? `${selectedMember.department} · 2024-2025`
                        : 'ORBIT Core · 2024-2025')}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-3 sm:my-4 shrink-0" />

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 -mr-1 space-y-3 sm:space-y-4">
                {/* About Section */}
                <div>
                  <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    ABOUT
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                    {selectedMember.bio ||
                      'Aim to serve the organization and lead with innovation, architectural excellence, and customer-first value.'}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-2" />

                {/* Connect Section */}
                <div>
                  <div className="flex items-center flex-wrap gap-2 pt-0.5">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                      CONNECT:
                    </span>
                    {getEnabledContacts(selectedMember).map((contact) => {
                      const Icon = contact.icon;
                      return (
                        <a
                          key={contact.key}
                          href={contact.href}
                          target={contact.key === 'email' ? undefined : '_blank'}
                          rel={contact.key === 'email' ? undefined : 'noopener noreferrer'}
                          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-colors shadow-2xs ${contact.pillClass}`}
                        >
                          <Icon size={12} />
                          <span>{contact.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WaveDivider fill="#FFFFFF" />
    </section>
  );
}

export default LeadershipSection;
