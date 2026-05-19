import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

// Default sections if no admin content exists yet
const DEFAULT_SECTIONS = [
    { heading: '1. Acceptance of Terms', content: 'By accessing and using the ORBIT SaaS website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.' },
    { heading: '2. Services', content: 'ORBIT SaaS provides custom software development, AI integration, web and mobile application development, and related digital services. The specific scope, deliverables, and timelines for any project will be defined in a separate agreement or proposal.' },
    { heading: '3. Intellectual Property', content: 'All content on this website — including text, graphics, logos, images, and code — is the property of ORBIT SaaS or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.' },
    { heading: '4. User Conduct', content: 'When using our website and services, you agree not to: use the website for any unlawful purpose, attempt to gain unauthorized access to our systems or data, interfere with the proper functioning of the website, submit false or misleading information, or use automated tools to extract content without permission.' },
    { heading: '5. Project Agreements', content: 'Any development project undertaken by ORBIT SaaS will be governed by a separate project agreement that outlines scope, pricing, payment terms, timelines, and deliverables. These Terms of Service serve as a general framework and do not supersede project-specific agreements.' },
    { heading: '6. Limitation of Liability', content: 'ORBIT SaaS shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or services. Our total liability for any claim shall not exceed the amounts paid by you for the specific service in question.' },
    { heading: '7. Disclaimer', content: 'Our website and services are provided "as is" without warranties of any kind, express or implied. We do not guarantee that the website will be uninterrupted, error-free, or free of harmful components.' },
    { heading: '8. Modifications', content: 'We reserve the right to modify these Terms of Service at any time. Changes will be effective upon posting to this page. Your continued use of the website after modifications constitutes acceptance of the updated terms.' },
    { heading: '9. Governing Law', content: 'These terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through good-faith negotiation or, if necessary, through the appropriate legal channels.' },
    { heading: '10. Contact', content: 'For questions about these Terms of Service, please reach out to us through our website\'s contact section.' },
];

export default function TermsOfService() {
    const { content, loading } = useContent();

    const pageData = (content.en as any)?.terms || {};
    const title = pageData.title || 'Terms of Service';
    const lastUpdated = pageData.lastUpdated || 'March 2, 2026';
    const sections = pageData.sections?.length > 0 ? pageData.sections : DEFAULT_SECTIONS;

    return (
        <>
            <Helmet>
                <title data-rh="true">{title} | ORBIT SaaS</title>
                <meta data-rh="true" name="description" content={`${title} for ORBIT SaaS — the terms and conditions governing your use of our website and services.`} />
            </Helmet>

            <div className="min-h-[100dvh] bg-background text-foreground">
                {/* Header */}
                <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-3">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <article className="max-w-3xl mx-auto px-6 py-12 space-y-8">
                    <header>
                        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                            {title}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Last updated: {lastUpdated}
                        </p>
                    </header>

                    {loading ? (
                        <div className="text-center text-muted-foreground py-12">Loading...</div>
                    ) : (
                        sections.map((section: any, idx: number) => (
                            <section key={idx} className="space-y-4">
                                <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
                            </section>
                        ))
                    )}

                    {/* Back link */}
                    <div className="pt-8 border-t border-border">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Homepage
                        </Link>
                    </div>
                </article>
            </div>
        </>
    );
}
