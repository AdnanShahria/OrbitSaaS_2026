import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Send, 
  Twitter, 
  Youtube, 
  Github, 
  MessageCircle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import orbitLogo from '@/assets/OrbitLogo.png';

// Social icons map using Lucide components
const socialIconComponents: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  telegram: Send,
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  whatsapp: MessageCircle,
};

const GoldenArrowSeparator = () => (
  <div className="h-[0.5px] w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent my-2 select-none" />
);

export function MobileFooter() {
  const { content } = useContent();
  const { lang } = useLang();
  const t = (content[lang] as any)?.footer;
  const nav = (content[lang] as any)?.nav;
  const services = (content[lang] as any)?.services;

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/leads?action=submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer_newsletter_mobile' }),
      });
      if (res.ok) {
        toast.success('Subscribed successfully!');
        setEmail('');
      } else {
        toast.error('Failed to subscribe');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSocials = (t?.socials || []).filter((s: any) => s.enabled && s.url);
  const defaultSocials = [
    { platform: 'github', url: 'https://github.com/orbitsaas', enabled: true },
    { platform: 'linkedin', url: 'https://linkedin.com/company/orbitsaas', enabled: true },
    { platform: 'whatsapp', url: 'https://wa.me/8801853452264', enabled: true },
    { platform: 'twitter', url: 'https://twitter.com/orbitsaas', enabled: true }
  ];
  const displaySocials = activeSocials.length > 0 ? activeSocials : defaultSocials;

  const footerNavLinks = [
    { label: nav?.services || 'Services', href: '/services' },
    { label: nav?.techStack || 'Tech Stack', href: '/techstack' },
    { label: nav?.projects || 'Projects', href: '/proj' },
    { label: nav?.leadership || 'Team', href: '/leadership' },
    { label: nav?.contact || 'Contact', href: '/contact' },
  ];

  const displayLegalLinks = t?.legalLinks || [
    { label: lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy', url: '/privacy' },
    { label: lang === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Service', url: '/terms' }
  ];

  const displayServices = (services?.items || []).slice(0, 4);
  const fallbackServices = lang === 'bn' ? [
    'ফুল স্ট্যাক ওয়েব ডেভেলপমেন্ট',
    'কাস্টম এআই চ্যাটবট ইন্টিগ্রেশন',
    'এআই অটোমেশন ও এজেন্টিক এআই',
    'মোবাইল অ্যাপ ডেভেলপমেন্ট'
  ] : [
    'Full Stack Web Design & Dev',
    'Custom AI Chatbot Integration',
    'AI Automation & Agentic AI',
    'Mobile App Development'
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0B0B0F] border-t border-white/[0.08] rounded-t-[28px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-5 pt-7 w-full animate-fade-in">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] bg-emerald-600/5 rounded-full blur-[80px] opacity-10" />
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }} 
        />
      </div>

      {/* Subtle glow highlight on top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="px-4 relative z-10 flex flex-col gap-4">
        
        {/* Box 1: Brand Info */}
        <div className="bg-[#121218]/90 border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-2.5 mb-2 group">
              <img
                src={orbitLogo}
                alt="Orbit"
                className="w-8 h-8 object-contain rounded-lg"
              />
              <span className="text-lg font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t?.brandName || 'Orbit SaaS'}
              </span>
            </Link>
            <p className="text-[11px] text-white/50 leading-relaxed px-1">
              {t?.tagline || 'Full-Service Software & AI Agency — Web, AI, Mobile & Beyond.'}
            </p>
          </div>

          {/* NAP Contacts */}
          <div className="flex flex-col gap-2.5 border-t border-white/[0.04] pt-3.5">
            {t?.location && (
              <a 
                href={t?.mapLink || 'https://www.google.com/maps'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2.5 text-xs text-white/50 active:text-amber-500"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/[0.05] border border-primary/[0.1] flex items-center justify-center text-primary">
                  <MapPin size={13} />
                </div>
                <span>{t.location}</span>
              </a>
            )}
            {t?.location && (t?.phone || t?.email) && <GoldenArrowSeparator />}
            {t?.phone && (
              <a 
                href={`tel:${t.phone.replace(/\s+/g, '')}`} 
                className="flex items-center gap-2.5 text-xs text-white/50 active:text-amber-500"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/[0.05] border border-primary/[0.1] flex items-center justify-center text-primary">
                  <Phone size={13} />
                </div>
                <span>{t.phone}</span>
              </a>
            )}
            {t?.phone && t?.email && <GoldenArrowSeparator />}
            {t?.email && (
              <a 
                href={`mailto:${t.email}`} 
                className="flex items-center gap-2.5 text-xs text-white/50 active:text-amber-500"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/[0.05] border border-primary/[0.1] flex items-center justify-center text-primary">
                  <Mail size={13} />
                </div>
                <span>{t.email}</span>
              </a>
            )}
          </div>

          {/* Copyright */}
          <div className="text-[10px] text-white/40 text-center pt-3.5 border-t border-white/[0.04] select-none">
            {t?.rights || '© 2026 ORBIT SaaS. All rights reserved.'}
          </div>

          {/* Socials */}
          {displaySocials.length > 0 && (
            <div className="flex justify-center gap-2 pt-3 border-t border-white/[0.04]">
              {displaySocials.map((social: any, i: number) => {
                const IconComponent = socialIconComponents[social.platform];
                return (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center active:bg-amber-500/15 active:border-amber-500/40"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'var(--text-secondary)',
                    }}
                    title={social.platform}
                  >
                    {IconComponent ? <IconComponent size={12} /> : <span className="text-[9px]">{social.platform.charAt(0).toUpperCase()}</span>}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Box 2 & 3 Combined in a 2-Column Row for Space Saving */}
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* Quick Links Card */}
          <div className="bg-[#121218]/90 border border-white/[0.06] rounded-[20px] p-4 flex flex-col shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-amber-500/20">
              {lang === 'bn' ? 'লিংক' : 'Links'}
            </h4>
            <ul className="space-y-2">
              {footerNavLinks.map((link, i) => (
                <div key={i}>
                  {i > 0 && <GoldenArrowSeparator />}
                  <li>
                    <Link to={link.href} className="text-xs text-white/50 active:text-amber-500">
                      {link.label}
                    </Link>
                  </li>
                </div>
              ))}
            </ul>
          </div>

          {/* Services Card */}
          <div className="bg-[#121218]/90 border border-white/[0.06] rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-amber-500/20">
                {lang === 'bn' ? 'সেবা' : 'Services'}
              </h4>
              <ul className="space-y-2">
                {displayServices.length > 0 ? (
                  displayServices.slice(0, 3).map((service: any, i: number) => (
                    <div key={i}>
                      {i > 0 && <GoldenArrowSeparator />}
                      <li className="text-xs text-white/50 truncate">
                        {service.title.split(' & ')[0]}
                      </li>
                    </div>
                  ))
                ) : (
                  fallbackServices.slice(0, 3).map((serviceName: string, i: number) => (
                    <div key={i}>
                      {i > 0 && <GoldenArrowSeparator />}
                      <li className="text-xs text-white/50 truncate">
                        {serviceName.split(' & ')[0]}
                      </li>
                    </div>
                  ))
                )}
              </ul>
            </div>

            {/* View Projects Link */}
            <div className="pt-2 border-t border-white/[0.04] mt-3">
              <Link to="/proj" className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                <span>{lang === 'bn' ? 'প্রজেক্টস' : 'Projects'}</span>
                <ArrowRight size={10} />
              </Link>
            </div>
          </div>

        </div>

        {/* Box 4: Newsletter */}
        <div className="bg-[#121218]/90 border border-white/[0.06] rounded-[20px] p-4 flex flex-col gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] pb-1 border-b border-amber-500/20">
            {lang === 'bn' ? 'নিউজলেটার' : 'Newsletter'}
          </h4>
          <p className="text-[11px] text-white/50 leading-relaxed">
            {lang === 'bn' 
              ? 'সর্বশেষ আপডেট এবং টেকনোলজি তথ্য পেতে সাবস্ক্রাইব করুন।' 
              : 'Get exclusive updates & tech insights in your inbox.'}
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={lang === 'bn' ? 'আপনার ইমেইল লিখুন' : 'your@email.com'}
              className="w-full px-3 py-2.5 rounded-lg text-xs bg-white/[0.02] border border-white/5 text-white outline-none focus:border-amber-500/30 placeholder:text-white/20"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-black shadow-md active:scale-[0.98] transition-transform cursor-pointer"
            >
              <span>{lang === 'bn' ? (isSubmitting ? 'প্রসেসিং...' : 'সাবস্ক্রাইব') : (isSubmitting ? 'Subscribing...' : 'Subscribe')}</span>
              <ArrowRight size={11} />
            </button>
          </form>

          {/* Legal Links inside mobile Newsletter card */}
          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/[0.05] text-[10px] text-white/40 justify-center">
            {displayLegalLinks.map((link: any, i: number) => (
              <span key={i} className="flex items-center gap-3">
                {i > 0 && <span className="text-white/10">/</span>}
                {link.url.startsWith('http') ? (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary active:text-primary transition-colors cursor-pointer">
                    {link.label}
                  </a>
                ) : (
                  <Link to={link.url} className="hover:text-primary active:text-primary transition-colors cursor-pointer">
                    {link.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar Section Removed */}

      </div>
    </footer>
  );
}

export default MobileFooter;
