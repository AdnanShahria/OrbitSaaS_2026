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
import { ensureAbsoluteUrl } from '@/lib/utils';

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
  <div className="h-[0.5px] w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent my-2.5 select-none" />
);

export function OrbitFooter() {
  const { content } = useContent();
  const { lang } = useLang();
  const t = (content[lang] as any)?.footer;
  const services = (content[lang] as any)?.services;
  const nav = (content[lang] as any)?.nav;

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
        body: JSON.stringify({ email, source: 'footer_newsletter' }),
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
    { label: nav?.whyUs || 'Why Us', href: '/why-us' },
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
    <footer className="relative overflow-hidden bg-[#0B0B0F] border-t border-white/[0.08] rounded-t-[40px] md:rounded-t-[50px] shadow-[0_-15px_40px_rgba(0,0,0,0.5)] pt-10 pb-6 w-full animate-fade-in">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] opacity-10" />
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")' }} 
        />
      </div>

      {/* Subtle glow highlight on top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-5 mb-0">
          
          {/* Box 1: Brand Info (Left / Dynamic) */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#121218]/90 border border-white/[0.06] rounded-[24px] p-5 hover:bg-[#151522] hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-3.5 group">
                <div className="relative">
                  <img
                    src={orbitLogo}
                    alt="Orbit"
                    className="w-10 h-10 object-contain transition-transform duration-500 group-hover:scale-110 rounded-lg"
                  />
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {t?.brandName || 'Orbit SaaS'}
                </span>
              </Link>
              <p className="text-xs mb-3.5 leading-relaxed text-white/50">
                {t?.tagline || 'Full-Service Software & AI Agency — Web, AI, Mobile & Beyond.'}
              </p>

              {/* NAP Address / Phone / Email list */}
              <div className="space-y-2 mb-3.5">
                {t?.location && (
                  <a 
                    href={t?.mapLink || 'https://www.google.com/maps'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2.5 group/item text-xs transition-colors hover:text-primary text-white/50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/[0.05] border border-primary/[0.1] flex items-center justify-center text-primary group-hover/item:bg-primary/[0.1] transition-all">
                      <MapPin size={13} />
                    </div>
                    <span>{t.location}</span>
                  </a>
                )}
                {t?.location && (t?.phone || t?.email) && <GoldenArrowSeparator />}
                {t?.phone && (
                  <a 
                    href={`tel:${t.phone.replace(/\s+/g, '')}`} 
                    className="flex items-center gap-2.5 group/item text-xs transition-colors hover:text-primary text-white/50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/[0.05] border border-primary/[0.1] flex items-center justify-center text-primary group-hover/item:bg-primary/[0.1] transition-all">
                      <Phone size={13} />
                    </div>
                    <span>{t.phone}</span>
                  </a>
                )}
                {t?.phone && t?.email && <GoldenArrowSeparator />}
                {t?.email && (
                  <a 
                    href={`mailto:${t.email}`} 
                    className="flex items-center gap-2.5 group/item text-xs transition-colors hover:text-primary text-white/50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/[0.05] border border-primary/[0.1] flex items-center justify-center text-primary group-hover/item:bg-primary/[0.1] transition-all">
                      <Mail size={13} />
                    </div>
                    <span>{t.email}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Copyright */}
            <div className="text-[10px] text-white/40 mb-3 select-none">
              {t?.rights || '© 2026 ORBIT SaaS. All rights reserved.'}
            </div>

            {/* Social icons */}
            {displaySocials.length > 0 && (
              <div className="flex gap-2 pt-3 border-t border-white/[0.05]">
                {displaySocials.map((social: any, i: number) => {
                  const IconComponent = socialIconComponents[social.platform];
                  return (
                    <a
                      key={i}
                      href={ensureAbsoluteUrl(social.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-500"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                      }}
                      title={social.platform}
                    >
                      {IconComponent ? <IconComponent size={13} /> : <span className="text-[10px]">{social.platform.charAt(0).toUpperCase()}</span>}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Box 2: Quick Links */}
          <div className="lg:col-span-2 bg-[#121218]/90 border border-white/[0.06] rounded-[24px] p-5 hover:bg-[#151522] hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3.5 pb-1.5 border-b border-amber-500/20">
              {lang === 'bn' ? 'কুইক লিংক' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              {footerNavLinks.map((link, i) => (
                <div key={i}>
                  {i > 0 && <GoldenArrowSeparator />}
                  <li>
                    <Link
                      to={link.href}
                      className="text-xs font-medium text-white/50 transition-all duration-300 hover:text-amber-500 hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                </div>
              ))}
            </ul>
          </div>

          {/* Box 3: Services (Playpen Categories style) */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-[#121218]/90 border border-white/[0.06] rounded-[24px] p-5 hover:bg-[#151522] hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3.5 pb-1.5 border-b border-amber-500/20">
                {lang === 'bn' ? 'সেবাসমূহ' : 'Services'}
              </h4>
              <ul className="space-y-2 mb-4">
                {displayServices.length > 0 ? (
                  displayServices.map((service: any, i: number) => (
                    <div key={i}>
                      {i > 0 && <GoldenArrowSeparator />}
                      <li className="text-xs font-medium text-white/50 transition-colors hover:text-white">
                        {service.title}
                      </li>
                    </div>
                  ))
                ) : (
                  fallbackServices.map((serviceName: string, i: number) => (
                    <div key={i}>
                      {i > 0 && <GoldenArrowSeparator />}
                      <li className="text-xs font-medium text-white/50 transition-colors hover:text-white">
                        {serviceName}
                      </li>
                    </div>
                  ))
                )}
              </ul>
            </div>

            {/* VIEW ALL PROJECTS -> Link */}
            <div className="pt-3 border-t border-white/[0.05]">
              <Link 
                to="/proj" 
                className="group flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider transition-all duration-300 hover:opacity-85"
              >
                <span>{lang === 'bn' ? 'সকল প্রজেক্ট দেখুন' : 'View Projects'}</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Box 4: Newsletter */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-[#121218]/90 border border-white/[0.06] rounded-[24px] p-5 hover:bg-[#151522] hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3.5 pb-1.5 border-b border-amber-500/20">
                {lang === 'bn' ? 'নিউজলেটার' : 'Newsletter'}
              </h4>
              <p className="text-[11px] text-white/50 mb-3.5 leading-relaxed">
                {lang === 'bn' 
                  ? 'সর্বশেষ আপডেট এবং টেকনোলজি বিষয়ক তথ্য পেতে সাবস্ক্রাইব করুন।' 
                  : 'Get exclusive updates & high-performance tech insights delivered to your inbox.'}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার ইমেইল লিখুন' : 'your@email.com'}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-white/[0.02] border border-white/5 text-white outline-none focus:border-amber-500/30 transition-all placeholder:text-white/20"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10 cursor-pointer"
                >
                  <span>{lang === 'bn' ? (isSubmitting ? 'প্রসেসিং...' : 'সাবস্ক্রাইব করুন') : (isSubmitting ? 'Subscribing...' : 'Subscribe')}</span>
                  <ArrowRight size={12} />
                </button>
              </form>

              {/* Legal Links inside Newsletter card */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.05] text-[10px] text-white/40 justify-center">
                {displayLegalLinks.map((link: any, i: number) => (
                  <span key={i} className="flex items-center gap-3">
                    {i > 0 && <span className="text-white/10">/</span>}
                    {link.url.startsWith('http') ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors cursor-pointer">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.url} className="hover:text-primary transition-colors cursor-pointer">
                        {link.label}
                      </Link>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar Section Removed */}

      </div>
    </footer>
  );
}

export default OrbitFooter;
