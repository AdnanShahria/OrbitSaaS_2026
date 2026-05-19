import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || '',
    authToken: authToken || '',
});

const whyUsEn = {
    title: 'The ORBIT Advantage',
    subtitle: 'We don\'t just build products — we become your technology partner, engineering for maximum ROI, global scale, and future-proof innovation.',
    items: [
        { 
          title: 'Direct ROI Impact', 
          desc: 'Our AI-driven solutions are engineered to pay for themselves. We focus on automating high-value tasks that directly influence your bottom line.', 
          benefit: 'Typical 3.5x return on investment within the first year of deployment.',
          bg: '#eef2ff', 
          color: '#4f46e5' 
        },
        { 
          title: 'Scalability', 
          desc: 'Build once, scale forever. Our serverless, edge-ready architecture ensures your application handles millions of users without breaking a sweat.', 
          benefit: 'Infrastructure that scales horizontally with zero manual intervention required.',
          bg: '#f0fdf4', 
          color: '#16a34a' 
        },
        { 
          title: 'Long-term Growth', 
          desc: 'We build for your future. Our modular systems evolve with your business, ensuring you never outgrow your technology stack.', 
          benefit: 'Proactive maintenance and feature evolution that keeps you ahead of competitors.',
          bg: '#fffbeb', 
          color: '#d97706' 
        },
        { 
          title: 'AI-First Development', 
          desc: 'Intelligence is never an afterthought. We bake agentic AI and predictive analytics into the core of your software for a truly modern experience.', 
          benefit: 'Gain a decisive edge with proprietary AI models tailored to your business data.',
          bg: '#fff0f6', 
          color: '#db2777' 
        }
    ],
    benefits: [
        { title: 'Global Delivery', desc: 'Deploy your vision to users worldwide with sub-second latency and high availability.' },
        { title: 'Enterprise Security', desc: 'Bank-grade encryption and compliance come standard with every line of code we write.' },
        { title: 'Elite Talent', desc: 'Access a dedicated team of world-class engineers, designers, and AI researchers.' }
    ]
};

const whyUsBn = {
    title: 'ORBIT-এর সুবিধাগুলো লুফে নিন',
    subtitle: 'আমরা শুধু প্রোডাক্ট তৈরি করি না — আমরা আপনার প্রযুক্তি অংশীদার হিসেবে কাজ করি, যা সর্বোচ্চ আরআইও (ROI), গ্লোবাল স্কেল এবং ভবিষ্যৎ-মুখী উদ্ভাবন নিশ্চিত করে।',
    items: [
        { 
          title: 'সরাসরি আরআইও (ROI) প্রভাব', 
          desc: 'আমাদের এআই-চালিত সリューションগুলো এমনভাবে তৈরি করা হয়েছে যাতে সেগুলো নিজেরাই নিজেদের খরচ মিটিয়ে দেয়। আমরা উচ্চ-মূল্যের কাজগুলো অটোমেট করার দিকে মনোনিবেশ করি যা সরাসরি আপনার ব্যবসার মুনাফা বৃদ্ধি করে।', 
          benefit: 'স্থাপনের প্রথম বছরের মধ্যেই বিনিয়োগের ওপর ৩.৫ গুণ রিটার্ন পাওয়ার সম্ভাবনা।',
          bg: '#eef2ff', 
          color: '#4f46e5' 
        },
        { 
          title: 'স্কেলেবিলিটি', 
          desc: 'একবার তৈরি করুন, চিরকাল স্কেল করুন। আমাদের সার্ভারলেস আর্কিটেকচার নিশ্চিত করে যে আপনার অ্যাপ্লিকেশন কোনো সমস্যা ছাড়াই লক্ষ লক্ষ ব্যবহারকারী সামলাতে পারে।', 
          benefit: 'ইনফ্রাস্ট্রাকচার যা কোনো ম্যানুয়াল হস্তক্ষেপ ছাড়াই স্বয়ংক্রিয়ভাবে বৃদ্ধি পায়।',
          bg: '#f0fdf4', 
          color: '#16a34a' 
        },
        { 
          title: 'দীর্ঘমেয়াদী প্রবৃদ্ধি', 
          desc: 'আমরা আপনার ভবিষ্যতের জন্য তৈরি করি। আমাদের মডুলার সিস্টেমগুলো আপনার ব্যবসার সাথে সাথে বিবর্তিত হয়, নিশ্চিত করে যে আপনি কখনোই আপনার টেক-স্ট্যাকের সীমাবদ্ধতায় না পড়েন।', 
          benefit: 'প্রোঅ্যাকটিভ মেইনটিনেন্স এবং ফিচার ডেভেলপমেন্ট যা আপনাকে প্রতিযোগিতায় এগিয়ে রাখে।',
          bg: '#fffbeb', 
          color: '#d97706' 
        },
        { 
          title: 'এআই-ফার্স্ট ডেভেলপমেন্ট', 
          desc: 'বুদ্ধিমত্তা কখনোই আমাদের কাছে কেবল একটি বাড়তি অংশ নয়। আমরা সরাসরি আপনার সফটওয়্যারের মূলে এজেন্টিক এআই এবং প্রেডিক্টিভ অ্যানালিটিক্স ব্যবহার করি।', 
          benefit: 'আপনার ব্যবসার ডেটার ওপর ভিত্তি করে তৈরি করা এআই মডেলের মাধ্যমে প্রতিযোগিতায় বড় সুবিধা অর্জন করুন।',
          bg: '#fff0f6', 
          color: '#db2777' 
        }
    ],
    benefits: [
        { title: 'গ্লোবাল ডেলিভারি', desc: 'বিশ্বজুড়ে ব্যবহারকারীদের কাছে অত্যন্ত দ্রুত গতিতে এবং উচ্চ নির্ভযোগ্যতায় আপনার ভিশন পৌঁছে দিন।', icon: 'Globe' },
        { title: 'এন্টারপ্রাইজ সিকিউরিটি', desc: 'আমাদের লেখা প্রতিটি কোড লাইনের সাথে ব্যাংক-গ্রেড এনক্রিপশন এবং কমপ্লায়েন্স নিশ্চিত করা হয়।', icon: 'ShieldCheck' },
        { title: 'অভিজাত প্রতিভা', desc: 'বিশ্বমানের ইঞ্জিনিয়ার, ডিজাইনার এবং এআই গবেষকদের একটি নিবেদিত দলের অভিজ্ঞতা উপভোগ করুন।', icon: 'Sparkles' }
    ]
};

async function run() {
    try {
        console.log("Starting DB reset for whyUs section...");

        // Clear existing
        console.log("Cleaning up site_content and content_cache...");
        await db.execute("DELETE FROM site_content WHERE section = 'whyUs'");
        await db.execute("DELETE FROM content_cache");
        console.log("Deleted old whyUs data and invalidated cache.");

        // Insert English
        await db.execute({
            sql: `INSERT INTO site_content (section, lang, data) VALUES ('whyUs', 'en', ?)`,
            args: [JSON.stringify(whyUsEn)]
        });
        console.log(`Inserted whyUs for en`);

        // Insert Bangla
        await db.execute({
            sql: `INSERT INTO site_content (section, lang, data) VALUES ('whyUs', 'bn', ?)`,
            args: [JSON.stringify(whyUsBn)]
        });
        console.log(`Inserted whyUs for bn`);

        console.log("Successfully reset whyUs details globally.");
        process.exit(0);
    } catch (err) {
        console.error("Database reset failed:", err);
        process.exit(1);
    }
}

run();
