import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

// Default sections if no admin content exists yet
const DEFAULT_SECTIONS = [
    { heading: '1. Information We Collect', content: 'When you visit our website or use our services, we may collect personal information such as name, email address, phone number, and other contact details you voluntarily provide. We also collect anonymous usage data including page visits, browser type, and device information.' },
    { heading: '2. How We Use Your Information', content: 'We use your information to respond to inquiries, provide requested services, send project updates (if opted in), improve our website and user experience, and comply with legal obligations.' },
    { heading: '3. Data Sharing', content: 'We do not sell, rent, or trade your personal information to third parties. We may share data with trusted service providers who assist us in operating our website and services, subject to confidentiality agreements.' },
    { heading: '4. Data Security', content: 'We implement industry-standard security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.' },
    { heading: '5. Your Rights', content: 'You have the right to access, correct, or delete your personal data. You may also opt out of marketing communications at any time. To exercise these rights, please contact us using the information provided on our website.' },
    { heading: '6. Third-Party Services', content: 'Our website may contain links to third-party services. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies before providing any personal information.' },
    { heading: '7. Changes to This Policy', content: 'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. Continued use of our website after changes constitutes acceptance of the modified policy.' },
    { heading: '8. Contact Us', content: 'If you have any questions about this Privacy Policy, please reach out to us through our website\'s contact section.' },
];

export default function PrivacyPolicy() {
    const { content, loading } = useContent();

    const pageData = (content.en as any)?.privacy || {};
    const title = pageData.title || 'Privacy Policy';
    const lastUpdated = pageData.lastUpdated || 'March 2, 2026';
    const sections = pageData.sections?.length > 0 ? pageData.sections : DEFAULT_SECTIONS;

    return (
        <>
            <Helmet>
                <title data-rh="true">{title} | ORBIT SaaS</title>
                <meta data-rh="true" name="description" content={`${title} for ORBIT SaaS — how we collect, use, and protect your data.`} />
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
