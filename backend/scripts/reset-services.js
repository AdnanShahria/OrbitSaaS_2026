import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || '',
    authToken: authToken || '',
});

const servicesEn = {
    title: 'Our Core Services',
    subtitle: 'What We Build',
    items: [
        { title: 'Full Stack Web Design & Development', desc: 'End-to-end websites and web apps — from pixel-perfect UI/UX design to robust backend systems. We build dynamic, animated, multilayered, and multi-panel experiences that are fast, responsive, and built to scale.', color: '#d63384', bg: '#fff0f6', border: '#f9c8d9' },
        { title: 'Custom AI Chatbot Integration & Support', desc: 'Custom-trained Conversational AI that understands your business — automating customer support, qualifying leads, and delivering 24/7 assistance with a human-like touch powered by the latest LLM technology.', color: '#ffb300', bg: '#fffbec', border: '#f5e4a0' },
        { title: 'AI Automation & Agentic AI', desc: 'Intelligent automation pipelines that work autonomously on your behalf — streamlining workflows, eliminating repetitive tasks, and enabling real-time decision-making with multi-step agentic AI agents.', color: '#3b82f6', bg: '#eef4ff', border: '#c3d8fa' },
        { title: 'Mobile App Development', desc: 'Native and cross-platform apps for Android, iOS, and beyond — built with Flutter, React Native or Java. We deliver smooth, performant mobile experiences from MVP to enterprise-grade production apps.', color: '#8b5cf6', bg: '#f3f0ff', border: '#d0c7f9' },
        { title: 'eCommerce & Enterprise Solutions', desc: 'Scalable online stores and enterprise web applications with payment gateways, real-time analytics, inventory systems, and secure high-performance infrastructure — built for growth from day one.', color: '#10b981', bg: '#edfaf4', border: '#b8ead4' },
        { title: 'PWA & Advanced Web Apps', desc: 'Progressive Web Apps that work offline, install like native apps, and load instantly. We also build SaaS platforms, educational tools, and complex multi-panel dashboards using modern React and Next.js.', color: '#f97316', bg: '#fff5ee', border: '#f9d4b6' }
    ]
};

const servicesBn = {
    title: 'আমাদের মূল সেবাসমূহ',
    subtitle: 'আমরা যা তৈরি করি',
    items: [
        { title: 'ফুল স্ট্যাক ওয়েব ডিজাইন ও ডেভেলপমেন্ট', desc: 'এন্ড-টু-এন্ড ওয়েবসাইট এবং ওয়েব অ্যাপস — পিক্সেল-পারফেক্ট UI/UX ডিজাইন থেকে শক্তিশালী ব্যাকএন্ড সিস্টেম। আমরা ডাইনামিক, অ্যানিমেটেড এবং রেস্পন্সিভ অভিজ্ঞতা তৈরি করি।', color: '#d63384', bg: '#fff0f6', border: '#f9c8d9' },
        { title: 'কাস্টম এআই চ্যাটবট ইন্টিগ্রেশন', desc: 'কাস্টম-ট্রেইনড এআই যা আপনার ব্যবসা বোঝে — কাস্টমার সাপোর্ট অটোমেশন এবং ২৪/৭ সাহায্য প্রদান করে লেটেস্ট LLM টেকনোলজির মাধ্যমে।', color: '#ffb300', bg: '#fffbec', border: '#f5e4a0' },
        { title: 'এআই অটোমেশন এবং এজেন্টিক এআই', desc: 'ইন্টেলিজেন্ট অটোমেশন পাইপলাইন যা আপনার হয়ে কাজ করে — ওয়ার্কফ্লো সহজ করে, পুনরাবৃত্তিমূলক কাজ দূর করে এবং রিয়েল-টাইম সিদ্ধান্ত নেয়।', color: '#3b82f6', bg: '#eef4ff', border: '#c3d8fa' },
        { title: 'মোবাইল অ্যাপ ডেভেলপমেন্ট', desc: 'অ্যান্ড্রয়েড এবং আইওএস-এর জন্য নেটিভ ও ক্রস-প্ল্যাটফর্ম অ্যাপস — ফ্লাটার, রিঅ্যাক্ট নেটিভ বা জাভা দিয়ে তৈরি। স্মুথ এবং পারফর্ম্যান্ট মোবাইল অভিজ্ঞতা।', color: '#8b5cf6', bg: '#f3f0ff', border: '#d0c7f9' },
        { title: 'ই-কমার্স ও এন্টারপ্রাইজ সলিউশন', desc: 'স্কেলেবল অনলাইন স্টোর এবং এন্টারপ্রাইজ ওয়েব অ্যাপ্লিকেশন — পেমেন্ট গেটওয়ে, রিয়েল-টাইম অ্যানালিটিক্স এবং সুরক্ষিত হাই-পারফরম্যান্স ইনফ্রাস্ট্রাকচার।', color: '#10b981', bg: '#edfaf4', border: '#b8ead4' },
        { title: 'PWA এবং উন্নত ওয়েব অ্যাপস', desc: 'প্রগ্রেসিভ ওয়েব অ্যাপস যা অফলাইনে কাজ করে, ইনস্টল করা যায় এবং দ্রুত লোড হয়। আমরা আধুনিক রিঅ্যাক্ট এবং নেক্সটজেএস-এর সাহায্যে তৈরি করি সাআস প্ল্যাটফর্ম।', color: '#f97316', bg: '#fff5ee', border: '#f9d4b6' }
    ]
};

async function run() {
    try {
        console.log("Starting DB update for services...");

        // English
        let res = await db.execute({
            sql: `UPDATE site_content SET data = ? WHERE section = 'services' AND lang = 'en'`,
            args: [JSON.stringify(servicesEn)]
        });
        if (res.rowsAffected === 0) {
            await db.execute({
                sql: `INSERT INTO site_content (section, lang, data) VALUES ('services', 'en', ?)`,
                args: [JSON.stringify(servicesEn)]
            });
            console.log(`Inserted services for en`);
        } else {
            console.log(`Updated services for en`);
        }

        // Bangla
        res = await db.execute({
            sql: `UPDATE site_content SET data = ? WHERE section = 'services' AND lang = 'bn'`,
            args: [JSON.stringify(servicesBn)]
        });
        if (res.rowsAffected === 0) {
            await db.execute({
                sql: `INSERT INTO site_content (section, lang, data) VALUES ('services', 'bn', ?)`,
                args: [JSON.stringify(servicesBn)]
            });
            console.log(`Inserted services for bn`);
        } else {
            console.log(`Updated services for bn`);
        }

        console.log("Successfully updated services in the database.");
        process.exit(0);
    } catch (err) {
        console.error("Database update failed:", err);
        process.exit(1);
    }
}

run();
