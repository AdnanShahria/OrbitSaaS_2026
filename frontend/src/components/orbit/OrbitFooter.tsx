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
  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-200 to-transparent my-2.5 select-none" />
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
    <div className="w-full bg-[#D4A017] relative">
      <footer className="relative overflow-hidden bg-[#F8F9FA] border-t-2 border-[#D4A017] rounded-t-[40px] md:rounded-t-[50px] shadow-[0_-10px_35px_rgba(212,160,23,0.18)] pt-10 pb-6 w-full animate-fade-in text-zinc-900">
        {/* Corner Golden Glow Elements */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-[#D4A017]/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#D4A017]/25 rounded-full blur-2xl pointer-events-none" />

        {/* Premium Ambient Elements */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] opacity-70" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] opacity-60" />
        </div>

        {/* Subtle glow highlight on top border */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
        
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 w-full relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-5 mb-0">
          
          {/* Box 1: Brand Info (Left / Dynamic) */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-white border border-zinc-200/80 rounded-[24px] p-5 hover:border-emerald-500/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-3.5 group">
                <div className="relative">
                  <img
                    src={orbitLogo}
                    alt="Orbit"
                    className="w-10 h-10 object-contain transition-transform duration-500 group-hover:scale-110 rounded-lg"
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xl font-black text-zinc-900 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {t?.brandName || 'Orbit SaaS'}
                </span>
              </Link>
              <p className="text-xs mb-3.5 leading-relaxed text-zinc-500">
                {t?.tagline || 'Full-Service Software & AI Agency — Web, AI, Mobile & Beyond.'}
              </p>

              {/* NAP Address / Phone / Email list */}
              <div className="space-y-2 mb-3.5">
                {t?.location && (
                  <a 
                    href={t?.mapLink || 'https://www.google.com/maps'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2.5 group/item text-xs transition-colors hover:text-emerald-600 text-zinc-600"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover/item:bg-emerald-100/70 transition-all">
                      <MapPin size={13} />
                    </div>
                    <span>{t.location}</span>
                  </a>
                )}
                {t?.location && (t?.phone || t?.email) && <GoldenArrowSeparator />}
                {t?.phone && (
                  <a 
                    href={`tel:${t.phone.replace(/\s+/g, '')}`} 
                    className="flex items-center gap-2.5 group/item text-xs transition-colors hover:text-emerald-600 text-zinc-600"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover/item:bg-emerald-100/70 transition-all">
                      <Phone size={13} />
                    </div>
                    <span>{t.phone}</span>
                  </a>
                )}
                {t?.phone && t?.email && <GoldenArrowSeparator />}
                {t?.email && (
                  <a 
                    href={`mailto:${t.email}`} 
                    className="flex items-center gap-2.5 group/item text-xs transition-colors hover:text-emerald-600 text-zinc-600"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover/item:bg-emerald-100/70 transition-all">
                      <Mail size={13} />
                    </div>
                    <span>{t.email}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Copyright */}
            <div className="text-[10px] text-zinc-400 mb-3 select-none">
              {t?.rights || '© 2026 ORBIT SaaS. All rights reserved.'}
            </div>

            {/* Social icons */}
            {displaySocials.length > 0 && (
              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                {displaySocials.map((social: any, i: number) => {
                  const IconComponent = socialIconComponents[social.platform];
                  return (
                    <a
                      key={i}
                      href={ensureAbsoluteUrl(social.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8.5 h-8.5 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer bg-zinc-50 border border-zinc-200/80 text-zinc-600 hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-700"
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
          <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-[24px] p-5 hover:border-emerald-500/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-3.5 pb-1.5 border-b border-zinc-100">
              {lang === 'bn' ? 'কুইক লিংক' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              {footerNavLinks.map((link, i) => (
                <div key={i}>
                  {i > 0 && <GoldenArrowSeparator />}
                  <li>
                    <Link
                      to={link.href}
                      className="text-xs font-medium text-zinc-500 transition-all duration-300 hover:text-emerald-600 hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                </div>
              ))}
            </ul>
          </div>

          {/* Box 3: Services (Playpen Categories style) */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-white border border-zinc-200/80 rounded-[24px] p-5 hover:border-emerald-500/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div>
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-3.5 pb-1.5 border-b border-zinc-100">
                {lang === 'bn' ? 'সেবাসমূহ' : 'Services'}
              </h4>
              <ul className="space-y-2 mb-4">
                {displayServices.length > 0 ? (
                  displayServices.map((service: any, i: number) => (
                    <div key={i}>
                      {i > 0 && <GoldenArrowSeparator />}
                      <li className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900">
                        {service.title}
                      </li>
                    </div>
                  ))
                ) : (
                  fallbackServices.map((serviceName: string, i: number) => (
                    <div key={i}>
                      {i > 0 && <GoldenArrowSeparator />}
                      <li className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900">
                        {serviceName}
                      </li>
                    </div>
                  ))
                )}
              </ul>
            </div>

            {/* VIEW ALL PROJECTS -> Link */}
            <div className="pt-3 border-t border-zinc-100">
              <Link 
                to="/proj" 
                className="group flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider transition-all duration-300 hover:text-emerald-800"
              >
                <span>{lang === 'bn' ? 'সকল প্রজেক্ট দেখুন' : 'View Projects'}</span>
                <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Box 4: Newsletter */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-white border border-zinc-200/80 rounded-[24px] p-5 hover:border-emerald-500/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div>
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-3.5 pb-1.5 border-b border-zinc-100">
                {lang === 'bn' ? 'নিউজলেটার' : 'Newsletter'}
              </h4>
              <p className="text-[11px] text-zinc-500 mb-3.5 leading-relaxed">
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
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-zinc-50 border border-zinc-200 text-zinc-900 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-zinc-400 shadow-inner/5"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <span>{lang === 'bn' ? (isSubmitting ? 'প্রসেসিং...' : 'সাবস্ক্রাইব করুন') : (isSubmitting ? 'Subscribing...' : 'Subscribe')}</span>
                  <ArrowRight size={12} />
                </button>
              </form>

              {/* Legal Links inside Newsletter card */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-100 text-[10px] text-zinc-400 justify-center">
                {displayLegalLinks.map((link: any, i: number) => (
                  <span key={i} className="flex items-center gap-3">
                    {i > 0 && <span className="text-zinc-200">/</span>}
                    {link.url.startsWith('http') ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors cursor-pointer">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.url} className="hover:text-emerald-600 transition-colors cursor-pointer">
                        {link.label}
                      </Link>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </footer>
  </div>
  );
}

export default OrbitFooter;
