import { useLang } from '@/contexts/LanguageContext';

export function StructuredData() {
    const { t } = useLang();

    // Dynamic WhatsApp info from admin settings
    const whatsappRaw = (t.contact as any).whatsapp || '+8801853452264';
    const whatsappClean = whatsappRaw.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${whatsappClean}`;
    const today = new Date().toISOString().split('T')[0];

    const graphSchema = {
        "@context": "https://schema.org",
        "@graph": [
            // ── Organization ──
            {
                "@type": "Organization",
                "@id": "https://orbitsaas.cloud/#organization",
                "name": "ORBIT SaaS",
                "alternateName": ["Orbit SaaS Agency", "ORBIT SaaS Software Agency", "ORBIT Software & AI Agency", "Orbot SaaS", "OrbitSaaS", "Orbit Sass", "Orbit SAS", "Orbot", "Assa", "orboit", "orboit saas", "orboit assa", "orbit sasa", "orbit assa", "orbt saas", "obit saas", "orbir saas", "orbit saass", "orbot sas", "orbot assa", "Orbit Cloud", "orbit development", "orbit web agency", "orbit software agency", "orbit ai agency"],
                "url": "https://orbitsaas.cloud",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://orbitsaas.cloud/favicon.png",
                    "width": 512,
                    "height": 512
                },
                "image": "https://orbitsaas.cloud/og-banner-v2.png",
                "description": "ORBIT SaaS is a full-service web development and AI agency offering custom websites, SaaS platforms, AI chatbot integration, mobile app development, eCommerce & enterprise solutions.",
                "slogan": "Build Smarter — Web, AI, Mobile & Automation Solutions That Scale",
                "foundingDate": "2022",
                "founders": [
                    { "@type": "Person", "name": "Muhammed Nisar Uddin", "jobTitle": "Founder & CTO" },
                    { "@type": "Person", "name": "Mohammed Adnan Shahria", "jobTitle": "Co-Founder & CEO" }
                ],
                "numberOfEmployees": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 10 },
                "address": { "@type": "PostalAddress", "addressLocality": "Rajshahi", "addressCountry": "BD" },
                "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "sales",
                    "url": whatsappUrl,
                    "telephone": whatsappRaw,
                    "availableLanguage": ["English", "Bengali"]
                },
                "knowsAbout": [
                    "Web Development", "Custom Web Application Development", "Full Stack Web Development",
                    "Custom Website Development", "AI Chatbot Development", "Custom AI Chatbot Integration",
                    "Conversational AI", "LLM Technology", "AI Automation", "Agentic AI",
                    "Mobile App Development", "Flutter App Development", "React Native App Development",
                    "eCommerce Development", "Enterprise Software Development",
                    "Progressive Web Apps", "SaaS Development",
                    "React", "Next.js", "Node.js", "TypeScript", "Cloud Infrastructure"
                ],
                "sameAs": ["https://orbitsaas.cloud"]
            },
            // ── WebSite ──
            {
                "@type": "WebSite",
                "@id": "https://orbitsaas.cloud/#website",
                "name": "ORBIT SaaS — Custom Web Development, AI & SaaS Agency",
                "alternateName": "ORBIT SaaS",
                "url": "https://orbitsaas.cloud",
                "description": "ORBIT SaaS is a full-service web development company and AI agency. We build custom websites, AI chatbots, SaaS platforms, mobile apps, eCommerce stores & enterprise solutions.",
                "publisher": { "@id": "https://orbitsaas.cloud/#organization" },
                "inLanguage": ["en", "bn"],
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://orbitsaas.cloud/?s={search_term_string}",
                    "query-input": "required name=search_term_string"
                }
            },
            // ── WebPage with Speakable (AEO) ──
            {
                "@type": "WebPage",
                "@id": "https://orbitsaas.cloud/#webpage",
                "url": "https://orbitsaas.cloud",
                "name": "ORBIT SaaS | Custom Software, AI & Web Development Agency",
                "isPartOf": { "@id": "https://orbitsaas.cloud/#website" },
                "about": { "@id": "https://orbitsaas.cloud/#organization" },
                "description": "Hire ORBIT SaaS for custom web development, AI chatbot integration, SaaS platforms, mobile apps, and enterprise solutions. Expert full-stack team serving clients worldwide.",
                "dateModified": today,
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": ["h1", ".hero-description", "article"]
                },
                "breadcrumb": { "@id": "https://orbitsaas.cloud/#breadcrumb" }
            },
            // ── ProfessionalService ──
            {
                "@type": "ProfessionalService",
                "@id": "https://orbitsaas.cloud/#service",
                "name": "ORBIT SaaS — Web Development, AI Chatbot, Mobile App & Automation Agency",
                "url": "https://orbitsaas.cloud",
                "image": "https://orbitsaas.cloud/og-banner-v2.png",
                "description": "Full-service web development and AI agency specializing in custom websites, web applications, AI chatbot integration, SaaS development, mobile apps (Flutter, React Native), eCommerce & enterprise solutions.",
                "priceRange": "$$",
                "address": { "@type": "PostalAddress", "addressLocality": "Rajshahi", "addressCountry": "BD" },
                "telephone": whatsappRaw,
                "areaServed": [
                    { "@type": "Country", "name": "Bangladesh" },
                    { "@type": "GeoCircle", "geoMidpoint": { "@type": "GeoCoordinates", "latitude": 23.8103, "longitude": 90.4125 }, "geoRadius": "50000" }
                ],
                "serviceType": [
                    "Web Development", "Custom Web Application Development",
                    "Custom AI Chatbot Integration", "AI Automation & Agentic AI",
                    "Mobile App Development", "eCommerce & Enterprise Solutions",
                    "PWA & Advanced Web Apps", "SaaS Development", "Custom Software Development"
                ],
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Web Development, AI & Mobile App Services",
                    "itemListElement": [
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Full Stack Web Development", "description": "End-to-end custom websites and web applications — pixel-perfect UI/UX design, responsive layouts, dynamic animations, and robust backend systems built with React, Next.js, Node.js, and TypeScript." } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Custom AI Chatbot Integration", "description": "Custom-trained conversational AI chatbots powered by OpenAI and LangChain — automating support, qualifying leads, and delivering 24/7 intelligent assistance." } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "AI Automation & Agentic AI", "description": "Intelligent automation pipelines and multi-step agentic AI agents that streamline workflows, eliminate repetitive tasks, and enable real-time decision-making." } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Mobile App Development", "description": "Native and cross-platform mobile apps for Android and iOS using Flutter, React Native, and Java — from MVP to enterprise-grade production apps." } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "eCommerce & Enterprise Solutions", "description": "Scalable eCommerce websites and enterprise web applications with payment gateways, real-time analytics, and secure high-performance infrastructure." } },
                        { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "SaaS & PWA Development", "description": "Custom SaaS platforms and Progressive Web Apps — offline-capable, installable, instant-loading applications with complex dashboards and multi-tenant architectures." } }
                    ]
                }
            },
            // ── Breadcrumb ──
            {
                "@type": "BreadcrumbList",
                "@id": "https://orbitsaas.cloud/#breadcrumb",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://orbitsaas.cloud" },
                    { "@type": "ListItem", "position": 2, "name": "Web Development Services", "item": "https://orbitsaas.cloud/#services" },
                    { "@type": "ListItem", "position": 3, "name": "Our Projects", "item": "https://orbitsaas.cloud/#projects" },
                    { "@type": "ListItem", "position": 4, "name": "Contact Us", "item": "https://orbitsaas.cloud/#contact" }
                ]
            },
            // ── FAQ ──
            {
                "@type": "FAQPage",
                "@id": "https://orbitsaas.cloud/#faq",
                "mainEntity": [
                    { "@type": "Question", "name": "What is the best web development company for custom projects?", "acceptedAnswer": { "@type": "Answer", "text": "ORBIT SaaS is a top-rated web development company specializing in custom websites, SaaS platforms, AI-powered web applications, and enterprise solutions. We use React, Next.js, Node.js, and TypeScript to deliver high-performance, scalable applications." } },
                    { "@type": "Question", "name": "Can ORBIT SaaS build an AI chatbot for my website?", "acceptedAnswer": { "@type": "Answer", "text": "Yes! ORBIT SaaS builds custom AI chatbots powered by OpenAI and LangChain. Our chatbots automate customer support, qualify leads, and provide 24/7 intelligent assistance with a human-like touch — fully customized for your business." } },
                    { "@type": "Question", "name": "Does ORBIT SaaS develop mobile apps?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. ORBIT SaaS builds native and cross-platform mobile apps for Android and iOS using Flutter, React Native, and Java — from MVP to enterprise-grade production apps." } },
                    { "@type": "Question", "name": "What technologies does ORBIT SaaS use for web development?", "acceptedAnswer": { "@type": "Answer", "text": "We use React, Next.js, TypeScript, Node.js, Express, PostgreSQL, MongoDB, Flutter, React Native, OpenAI API, LangChain, Docker, AWS, Cloudflare, and modern cloud infrastructure." } },
                    { "@type": "Question", "name": "How much does custom web development cost?", "acceptedAnswer": { "@type": "Answer", "text": "Custom web development costs vary based on project complexity. ORBIT SaaS offers competitive pricing — simple websites start from $299, complex SaaS platforms or AI integrations from $999. Contact us for a free consultation and detailed quote." } },
                    { "@type": "Question", "name": "How long does web development take?", "acceptedAnswer": { "@type": "Answer", "text": "Simple websites take 1–2 weeks. Complex web applications, SaaS platforms, or AI integrations take 4–12 weeks. We provide detailed timelines during our free consultation." } },
                    { "@type": "Question", "name": "Where is ORBIT SaaS located?", "acceptedAnswer": { "@type": "Answer", "text": "ORBIT SaaS is headquartered in Rajshahi, Bangladesh, and serves clients worldwide with remote-first web development, AI, and software engineering services." } },
                    { "@type": "Question", "name": "How can I hire ORBIT SaaS for my project?", "acceptedAnswer": { "@type": "Answer", "text": `Book a free web development consultation via WhatsApp at ${whatsappRaw} or visit orbitsaas.cloud. We work with businesses of all sizes — startups to enterprises — delivering custom web, AI, mobile, and automation solutions.` } }
                ]
            },
            // ── ItemList (Services) ──
            {
                "@type": "ItemList",
                "name": "ORBIT SaaS Web Development & AI Services",
                "description": "Complete list of web development, AI, and mobile app services offered by ORBIT SaaS",
                "numberOfItems": 6,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Full Stack Web Development", "url": "https://orbitsaas.cloud/#services", "description": "End-to-end custom websites and web apps with React, Next.js, Node.js, TypeScript" },
                    { "@type": "ListItem", "position": 2, "name": "Custom AI Chatbot Integration", "url": "https://orbitsaas.cloud/#services", "description": "Custom AI chatbots powered by OpenAI and LangChain for 24/7 intelligent support" },
                    { "@type": "ListItem", "position": 3, "name": "AI Automation & Agentic AI", "url": "https://orbitsaas.cloud/#services", "description": "Intelligent automation pipelines with multi-step agentic AI agents" },
                    { "@type": "ListItem", "position": 4, "name": "Mobile App Development", "url": "https://orbitsaas.cloud/#services", "description": "Native and cross-platform apps for Android and iOS using Flutter and React Native" },
                    { "@type": "ListItem", "position": 5, "name": "eCommerce & Enterprise Solutions", "url": "https://orbitsaas.cloud/#services", "description": "Scalable eCommerce stores and enterprise web apps with payment gateways" },
                    { "@type": "ListItem", "position": 6, "name": "SaaS & PWA Development", "url": "https://orbitsaas.cloud/#services", "description": "Custom SaaS platforms & Progressive Web Apps with complex dashboards" }
                ]
            },
            // ── WebApplication ──
            {
                "@type": "WebApplication",
                "name": "ORBIT SaaS",
                "url": "https://orbitsaas.cloud",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "description": "ORBIT SaaS — custom web development, AI chatbot, SaaS, mobile app, eCommerce, and enterprise solution agency. Explore our services and portfolio.",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "description": "Free consultation for web development, AI, and mobile app projects"
                }
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graphSchema) }}
        />
    );
}
