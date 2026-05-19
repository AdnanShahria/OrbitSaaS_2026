import { Helmet } from 'react-helmet-async';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';

export function SEOHead() {
    const { content } = useContent();
    const { lang } = useLang();

    // Get SEO data from content context or fallback to defaults
    const seoData = content[lang] as Record<string, any> || {};

    // Keyword-optimized defaults
    const defaultTitle = "ORBIT SaaS | Custom Web Development, AI Chatbot & SaaS Agency";
    const defaultDesc = "ORBIT SaaS is a full-service web development and AI agency based in Bangladesh. We build custom websites, SaaS platforms, AI chatbots, mobile apps, and enterprise solutions for businesses worldwide.";
    const defaultKeywords = "web development, web development company, custom web development, best web development company, hire web developers, full stack web development, custom website development, web application development, website design and development, responsive web design, frontend development, backend development, React development, Node.js development, Next.js development, TypeScript development, web development agency, web development Bangladesh, best web development company Bangladesh, software development agency, custom software development, SaaS development, custom SaaS platform, AI chatbot development, custom AI chatbot, chatbot integration, conversational AI, AI automation, agentic AI, mobile app development, Flutter app development, React Native app development, eCommerce website development, enterprise web application, PWA development, progressive web app, orbit, ORBIT SaaS, orbit saas, orbot saas, OrbitSaaS, orbitsaas, orbit sass, orbit sas, Orbot, Assa, orbit software, orbit agency, orbit ai, orbitsaas.cloud, orboit, orboit saas, orboit assa, orbit sasa, orbit assa, orbt saas, obit saas, orbir saas, orbit saass, orbot sas, orbot assa, orbit cloud, orbit development, orbit web agency, orbit software agency, orbit ai agency";

    // Data from DB (saved via AdminSEO)
    const title = (content[lang]?.['seo_title'] as string) || defaultTitle;
    const description = (content[lang]?.['seo_description'] as string) || defaultDesc;
    const keywords = (content[lang]?.['seo_keywords'] as string) || defaultKeywords;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://orbitsaas.cloud';
    const canonicalUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://orbitsaas.cloud';
    const image = 'https://orbitsaas.cloud/og-banner-v2.png';

    return (
        <Helmet>
            {/* Basic */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:image" content={image} />
            <meta property="og:image:alt" content="ORBIT SaaS" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="ORBIT SaaS" />
            <meta property="og:locale" content={lang === 'bn' ? 'bn_BD' : 'en_US'} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:image:alt" content="ORBIT SaaS" />

            {/* Canonical */}
            <link rel="canonical" href={canonicalUrl} />

            {/* AEO / Googlebot Directives */}
            <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

            {/* Language alternates */}
            <link rel="alternate" hrefLang="en" href="https://orbitsaas.cloud/" />
            <link rel="alternate" hrefLang="bn" href="https://orbitsaas.cloud/?lang=bn" />
            <link rel="alternate" hrefLang="x-default" href="https://orbitsaas.cloud/" />

            {/* Additional SEO meta */}
            <meta name="language" content={lang === 'bn' ? 'Bengali' : 'English'} />

            {/* Google Search Console verification */}
            <meta name="google-site-verification" content="google686da8116d698aaf" />
        </Helmet>
    );
}
