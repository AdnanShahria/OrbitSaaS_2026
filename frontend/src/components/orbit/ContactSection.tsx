import React from 'react';
import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowRight, Mail, MapPin, ExternalLink, Globe2, Facebook, Instagram, Linkedin, Send, Twitter, Youtube, Github, MessageCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { ensureAbsoluteUrl } from '@/lib/utils';

const RichText = ({ text }: { text: string }) => (
  <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }} />
);

// ── WhatsApp Icon Component ──
const WhatsAppIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Social icons map ──
const socialIconComponents: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  telegram: Send,
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  whatsapp: WhatsAppIcon,
};

// ── Contact Card Component ──
const ContactCard = ({ icon: Icon, title, value, href, delay }: { icon: any, title: string, value: string, href?: string, delay: number }) => {
  const CardWrapper = href ? 'a' : 'div';
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
    >
      <CardWrapper
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="group relative flex items-center gap-3.5 p-4 rounded-2xl bg-white/90 border border-zinc-200/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-emerald-500/40 transition-all duration-400 block"
      >
        <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300">
          <Icon size={18} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{title}</span>
          <span className="text-sm text-zinc-900 font-semibold group-hover:text-emerald-700 transition-colors truncate">
            {value}
          </span>
        </div>
      </CardWrapper>
    </motion.div>
  );
};

export function ContactSection() {
  const { content } = useContent();
  const { lang } = useLang();

  const t = (content[lang] as any)?.contact || {};
  const footerData = (content[lang] as any)?.footer || {};
  const socials = footerData.socials || [];
  const activeSocials = socials.filter((s: any) => s.enabled && s.url);
 
  const whatsappNumber = footerData.phone || t?.whatsapp || '+8801853452264';
  const emailAddress = footerData.email || t?.email || 'contact@orbitsaas.com';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <section id="contact" className="relative min-h-[100dvh] flex flex-col justify-center py-20 lg:py-28 overflow-hidden bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">

      {/* ── Ambient Apple Lighting Effect ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-100/30 via-zinc-50/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-tr from-amber-100/30 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 w-full relative z-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Center Column: Copy & CTAs */}
          <div className="lg:col-span-8 lg:col-start-3 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase shadow-xs">
                <Globe2 size={14} className="text-emerald-600 animate-spin-slow" />
                {t?.badge || 'Launch your vision'}
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-950 leading-[1.1] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <RichText text={t?.title || 'Ready to put your idea into ORBIT?'} />
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-lg md:text-xl text-zinc-600 leading-relaxed mb-10 max-w-2xl px-4 font-normal"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {t?.subtitle || 'Join the elite businesses scaling with our high-performance AI & web ecosystems.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -2, boxShadow: "0 14px 36px rgba(16, 185, 129, 0.28)" }}
                whileTap={{ scale: 0.97 }}
                className="relative px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center gap-3 overflow-hidden group shadow-lg shadow-emerald-600/20 transition-all duration-300 cursor-pointer"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <WhatsAppIcon size={24} className="animate-pulse" />
                <span>{t?.cta || 'Book a Free Consultation'}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </motion.div>

            {/* Social Links Matrix */}
            {activeSocials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-12 w-full max-w-md"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold mb-6 flex items-center justify-center gap-4">
                  <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-zinc-300" />
                  Connect With Us
                  <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-zinc-300" />
                </p>
                <div className="flex flex-wrap justify-center gap-3.5">
                  {activeSocials.map((social: any, idx: number) => {
                    const IconComponent = socialIconComponents[social.platform];
                    return (
                      <motion.a
                        key={idx}
                        href={ensureAbsoluteUrl(social.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -4, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 rounded-full border border-zinc-200/80 bg-zinc-50 text-zinc-600 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 shadow-xs flex items-center justify-center transition-all duration-300 group"
                        title={social.platform}
                      >
                        {IconComponent ? <IconComponent size={20} className="group-hover:text-emerald-700 transition-colors" /> : <ExternalLink size={18} />}
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Cards: Secondary Contact Info */}
          <div className="lg:col-span-10 lg:col-start-2 grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 sm:mt-20">
            <ContactCard
              icon={Mail}
              title="Email Us"
              value={emailAddress}
              href={`mailto:${emailAddress}`}
              delay={0.4}
            />
            {whatsappNumber && (
              <ContactCard
                icon={WhatsAppIcon}
                title="WhatsApp / Phone"
                value={whatsappNumber}
                href={whatsappLink}
                delay={0.5}
              />
            )}
            <ContactCard
              icon={MapPin}
              title="Global HQ"
              value={footerData.location || t?.address || "Rajshahi, Bangladesh"}
              href={footerData.mapLink || t?.mapLink || "https://www.google.com/maps/search/?api=1&query=24.36545054786298,88.62639818383883"}
              delay={0.6}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default ContactSection;
