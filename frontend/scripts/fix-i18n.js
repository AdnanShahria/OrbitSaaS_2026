import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const content = `export type Lang = 'en' | 'bn';

export const translations = {
  en: {
    nav: {
      services: 'Services',
      techStack: 'Tech Stack',
      whyUs: 'Why Us',
      leadership: 'Leadership',
      contact: 'Contact',
      projects: 'Projects',
      bookCall: 'Book an Appointment',
      defaultSoundMuted: false,
      defaultVolume: 40,
    },
    hero: {
      title: 'We Build What Others Dream',
      tagline: 'Where Ideas Meet Execution',
      tagline2: '',
      subtitle: 'Web apps, AI chatbots, agentic automation, mobile apps, eCommerce & PWAs — end-to-end solutions powered by cutting-edge technology.',
      cta: 'Book an Appointment',
      learnMore: 'Explore Services',
    },
    stats: {
      items: [
        { value: 24, suffix: '+', label: 'Live Projects' },
        { value: 5, suffix: '+', label: 'Countries' },
        { value: 120, suffix: '+', label: 'Users Served' },
        { value: 3, suffix: '+', label: 'Years Experience' },
      ],
    },
    services: {
      title: 'Our Core Services',
      subtitle: 'What We Build',
      items: [
        { title: 'Full Stack Web Design & Development', desc: 'End-to-end websites and web apps — from pixel-perfect UI/UX design to robust backend systems. We build dynamic, animated, multilayered, and multi-panel experiences that are fast, responsive, and built to scale.', color: '#d63384', bg: '#fff0f6', border: '#f9c8d9' },
        { title: 'Custom AI Chatbot Integration & Support', desc: 'Custom-trained Conversational AI that understands your business — automating customer support, qualifying leads, and delivering 24/7 assistance with a human-like touch powered by the latest LLM technology.', color: '#ffb300', bg: '#fffbec', border: '#f5e4a0' },
        { title: 'AI Automation & Agentic AI', desc: 'Intelligent automation pipelines that work autonomously on your behalf — streamlining workflows, eliminating repetitive tasks, and enabling real-time decision-making with multi-step agentic AI agents.', color: '#3b82f6', bg: '#eef4ff', border: '#c3d8fa' },
        { title: 'Mobile App Development', desc: 'Native and cross-platform apps for Android, iOS, and beyond — built with Flutter, React Native or Java. We deliver smooth, performant mobile experiences from MVP to enterprise-grade production apps.', color: '#8b5cf6', bg: '#f3f0ff', border: '#d0c7f9' },
        { title: 'eCommerce & Enterprise Solutions', desc: 'Scalable online stores and enterprise web applications with payment gateways, real-time analytics, inventory systems, and secure high-performance infrastructure — built for growth from day one.', color: '#10b981', bg: '#edfaf4', border: '#b8ead4' },
        { title: 'PWA & Advanced Web Apps', desc: 'Progressive Web Apps that work offline, install like native apps, and load instantly. We also build SaaS platforms, educational tools, and complex multi-panel dashboards using modern React and Next.js.', color: '#f97316', bg: '#fff5ee', border: '#f9d4b6' }
      ] as any[],
    },
    links: {
      title: 'Important Links',
      items: [] as { title: string; link: string }[],
    },
    techStack: {
      title: 'Our Expertise',
      subtitle: 'Technologies We Power Your Vision With',
      categories: [
        {
          name: 'Frontend Development',
          color: '#3b82f6',
          items: ['React 18', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Redux ToolKit', 'Zustand', 'Ant Design', 'Shadcn UI', 'GraphQL', 'Socket.io']
        },
        {
          name: 'Backend & Database',
          color: '#10b981',
          items: ['Node.js', 'Express.js', 'PostgreSQL', 'Prisma ORM', 'Redis', 'MongoDB', 'Supabase', 'Firebase', 'MySQL', 'Mongoose']
        },
        {
          name: 'Cloud & DevOps',
          color: '#f97316',
          items: ['Vercel', 'AWS', 'Docker', 'GitHub Actions', 'Cloudinary', 'ImgBB', 'Kubernetes', 'Nginx', 'CI/CD Pipelines', 'DigitalOcean', 'Cloudflare']
        },
        {
          name: 'AI/ML Stack',
          color: '#d63384',
          items: ['OpenAI API', 'LangChain', 'Pinecone (Vector DB)', 'PyTorch', 'TensorFlow', 'Hugging Face']
        },
        {
          name: 'Mobile App Development',
          color: '#8b5cf6',
          items: ['Flutter', 'React Native', 'Java', 'Kotlin', 'Swift', 'Android', 'iOS']
        }
      ] as any[],
    },
    whyUs: {
      title: 'The ORBIT Advantage',
      subtitle: 'We don\\'t just build products — we become your technology partner, engineering for maximum ROI, global scale, and future-proof innovation.',
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
      ] as any[],
      benefits: [
        { title: 'Global Delivery', desc: 'Deploy your vision to users worldwide with sub-second latency and high availability.' },
        { title: 'Enterprise Security', desc: 'Bank-grade encryption and compliance come standard with every line of code we write.' },
        { title: 'Elite Talent', desc: 'Access a dedicated team of world-class engineers, designers, and AI researchers.' }
      ]
    },
    projects: {
      title: 'Featured Projects',
      subtitle: 'Real solutions we\\'ve built for real businesses.',
      items: [] as { title: string; desc: string; tags: string[]; link: string; image: string }[],
    },
    leadership: {
      title: 'Meet Our Team',
      subtitle: 'The minds behind ORBIT SaaS — building the future of software.',
      members: [] as any[],
    },
    reviews: {
      title: 'Client Reviews',
      subtitle: 'What our clients say about working with us',
      items: [] as any[],
    },
    contact: {
      title: 'Ready to Build Something Great?',
      subtitle: 'Let\\'s discuss your next web, AI, or mobile project — book a free consultation today.',
      cta: 'Book a Free Consultation',
      whatsapp: '+8801853452264',
    },
    footer: {
      brandName: 'ORBIT SaaS',
      rights: '© 2025 ORBIT SaaS. All rights reserved.',
      tagline: 'Full-Service Software & AI Agency — Web, AI, Mobile & Beyond.',
      socials: [
        { platform: 'facebook', url: '', enabled: false },
        { platform: 'instagram', url: '', enabled: false },
        { platform: 'linkedin', url: '', enabled: false },
        { platform: 'telegram', url: '', enabled: false },
        { platform: 'twitter', url: '', enabled: false },
        { platform: 'youtube', url: '', enabled: false },
        { platform: 'github', url: '', enabled: false },
        { platform: 'whatsapp', url: '', enabled: false },
      ],
    },
    chatbot: {
      title: 'ORBIT AI Assistant',
      placeholder: 'Ask about our services...',
      greeting: 'Hi! I\\'m ORBIT\\'s AI assistant. How can I help you today?',
      systemPrompt: '',
      qaPairs: [] as { question: string; answer: string }[],
    },
    process: {
      subtitle: 'Our Methodology',
      title: 'How We Transform Your Vision',
      steps: [
        {
          id: '01',
          title: 'Discovery',
          desc: 'We dive deep into your vision, target audience, and business goals to lay a solid foundation for success.',
        },
        {
          id: '02',
          title: 'Planning',
          desc: 'Developing technical architecture, wireframes, and a comprehensive roadmap to guide the build.',
        },
        {
          id: '03',
          title: 'Development',
          desc: 'Bringing ideas to life with high-performance code, scalable solutions, and iterative milestones.',
        },
        {
          id: '04',
          title: 'Testing',
          desc: 'Rigorous QA and performance optimization ensuring your product is flawless and ready for launch.',
        },
        {
          id: '05',
          title: 'Delivery',
          desc: 'Your project is live! We ensure a smooth handover and provide ongoing support for continued success.',
        },
      ],
    },
  },
  bn: {
    nav: {
      services: 'সেবাসমূহ',
      techStack: 'টেক স্ট্যাক',
      whyUs: 'কেন আমরা',
      leadership: 'নেতৃত্ব',
      contact: 'যোগাযোগ',
      projects: 'প্রকল্পসমূহ',
      bookCall: 'অ্যাপয়েন্টমেন্ট বুক করুন',
      defaultSoundMuted: false,
      defaultVolume: 40,
    },
    hero: {
      title: 'আমরা তৈরি করি যা অন্যরা স্বপ্ন দেখে',
      tagline: 'যেখানে ধারণা বাস্তবায়নে রূপ নেয়',
      tagline2: '',
      subtitle: 'ওয়েব অ্যাপস, এআই চ্যাটবট, এজেন্টিক অটোমেশন, মোবাইল অ্যাপস, ই-কমার্স ও PWA — অত্যাধুনিক প্রযুক্তি দিয়ে এন্ড-টু-এন্ড সলিউশন।',
      cta: 'অ্যাপয়েন্টমেন্ট বুক করুন',
      learnMore: 'সেবাসমূহ দেখুন',
    },
    stats: {
      items: [
        { value: 24, suffix: '+', label: 'লাইভ প্রজেক্ট' },
        { value: 5, suffix: '+', label: 'দেশ' },
        { value: 120, suffix: '+', label: 'ব্যবহারকারী' },
        { value: 3, suffix: '+', label: 'বছরের অভিজ্ঞতা' },
      ],
    },
    services: {
      title: 'আমাদের মূল সেবাসমূহ',
      subtitle: 'আমরা যা তৈরি করি',
      items: [
        { title: 'ফুল স্ট্যাক ওয়েব ডিজাইন ও ডেভেলপমেন্ট', desc: 'এন্ড-টু-এন্ড ওয়েবসাইট এবং ওয়েব অ্যাপস — পিক্সেল-পারফেক্ট UI/UX ডিজাইন থেকে শক্তিশালী ব্যাকএন্ড সিস্টেম। আমরা ডাইনামিক, অ্যানিমেটেড এবং রেস্পন্সিভ অভিজ্ঞতা তৈরি করি।', color: '#d63384', bg: '#fff0f6', border: '#f9c8d9' },
        { title: 'কাস্টম এআই চ্যাটবট ইন্টিগ্রেশন', desc: 'কাস্টম-ট্রেইনড এআই যা আপনার ব্যবসা বোঝে — কাস্টমার সাপোর্ট অটোমেশন এবং ২৪/৭ সাহায্য প্রদান করে লেটেস্ট LLM টেকনোলজির মাধ্যমে।', color: '#ffb300', bg: '#fffbec', border: '#f5e4a0' },
        { title: 'এআই অটোমেশন এবং এজেন্টিক এআই', desc: 'ইন্টেলিজেন্ট অটোমেশন পাইপলাইন যা আপনার হয়ে কাজ করে — ওয়ার্কফ্লো সহজ করে, পুনরাবৃত্তিমূলক কাজ দূর করে এবং রিয়েল-টাইম সিদ্ধান্ত নেয়।', color: '#3b82f6', bg: '#eef4ff', border: '#c3d8fa' },
        { title: 'মোবাইল অ্যাপ ডেভেলপমেন্ট', desc: 'অ্যান্ড্রয়েড এবং আইওএস-এর জন্য নেটিভ ও ক্রস-প্ল্যাটফর্ম অ্যাপস — ফ্লাটার, রিঅ্যাক্ট নেটিভ বা জাভা দিয়ে তৈরি। স্মুথ এবং পারফর্ম্যান্ট মোবাইল অভিজ্ঞতা।', color: '#8b5cf6', bg: '#f3f0ff', border: '#d0c7f9' },
        { title: 'ই-কমার্স ও এন্টারপ্রাইজ সলিউশন', desc: 'স্কেলেবল অনলাইন স্টোর এবং এন্টারপ্রাইজ ওয়েব অ্যাপ্লিকেশন — পেমেন্ট গেটওয়ে, রিয়েল-টাইম অ্যানালিটিক্স এবং সুরক্ষিত হাই-পারফরম্যান্স ইনফ্রাস্ট্রাকচার।', color: '#10b981', bg: '#edfaf4', border: '#b8ead4' },
        { title: 'PWA এবং উন্নত ওয়েব অ্যাপস', desc: 'প্রগ্রেসিভ ওয়েব অ্যাপস যা অফলাইনে কাজ করে, ইনস্টল করা যায় এবং দ্রুত লোড হয়। আমরা আধুনিক রিঅ্যাক্ট এবং নেক্সটজেএস-এর সাহায্যে তৈরি করি সাআস প্ল্যাটফর্ম।', color: '#f97316', bg: '#fff5ee', border: '#f9d4b6' }
      ] as any[],
    },
    links: {
      title: 'গুরুত্বপূর্ণ লিংক',
      items: [] as { title: string; link: string }[],
    },
    techStack: {
      title: 'আমাদের দক্ষতা',
      subtitle: 'যে প্রযুক্তিগুলো দিয়ে আমরা আপনার ভিশন বাস্তবায়ন করি',
      categories: [
        {
          name: 'ফ্রন্টএন্ড ডেভেলপমেন্ট',
          color: '#3b82f6',
          items: ['React 18', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Redux ToolKit', 'Zustand', 'Ant Design', 'Shadcn UI', 'GraphQL', 'Socket.io']
        },
        {
          name: 'ব্যাকএন্ড ও ডাটাবেস',
          color: '#10b981',
          items: ['Node.js', 'Express.js', 'PostgreSQL', 'Prisma ORM', 'Redis', 'MongoDB', 'Supabase', 'Firebase', 'MySQL', 'Mongoose']
        },
        {
          name: 'ক্লাউড ও ডেভঅপস',
          color: '#f97316',
          items: ['Vercel', 'AWS', 'Docker', 'GitHub Actions', 'Cloudinary', 'ImgBB', 'Kubernetes', 'Nginx', 'CI/CD Pipelines', 'DigitalOcean', 'Cloudflare']
        },
        {
          name: 'এআই এবং এমএল স্ট্যাক',
          color: '#d63384',
          items: ['OpenAI API', 'LangChain', 'Pinecone (Vector DB)', 'PyTorch', 'TensorFlow', 'Hugging Face']
        },
        {
          name: 'মোবাইল অ্যাপ ডেভেলপমেন্ট',
          color: '#8b5cf6',
          items: ['Flutter', 'React Native', 'Java', 'Kotlin', 'Swift', 'Android', 'iOS']
        }
      ] as any[],
    },
    whyUs: {
      title: 'ORBIT-এর সুবিধাগুলো লুফে নিন',
      subtitle: 'আমরা শুধু প্রোডাক্ট তৈরি করি না — আমরা আপনার প্রযুক্তি অংশীদার হিসেবে কাজ করি, যা সর্বোচ্চ আরআইও (ROI), গ্লোবাল স্কেল এবং ভবিষ্যৎ-মুখী উদ্ভাবন নিশ্চিত করে।',
      items: [
        { 
          title: 'সরাসরি আরআইও (ROI) প্রভাব', 
          desc: 'আমাদের এআই-চালিত সリューションগুলো এমনভাবে তৈরি করা হয়েছে যাতে সেগুলো নিজেরাই নিজেদের খরচ মিটিয়ে দেয়। আমরা উচ্চ-মূল্যের কাজগুলো অটোমেট করার দিকে মনোযোগ দিই যা সরাসরি আপনার ব্যবসার মুনাফা বৃদ্ধি করে।', 
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
          benefit: 'আপনার ব্যবসার ডেটার ওপর ভিত্তি করে তৈরি করা এআই মডেল의 মাধ্যমে প্রতিযোগিতায় বড় সুবিধা অর্জন করুন।',
          bg: '#fff0f6', 
          color: '#db2777' 
        }
      ] as any[],
      benefits: [
        { title: 'গ্লোবাল ডেলিভারি', desc: 'বিশ্বজুড়ে ব্যবহারকারীদের কাছে অত্যন্ত দ্রুত গতিতে এবং উচ্চ নির্ভযোগ্যতায় আপনার ভিশন পৌঁছে দিন।' },
        { title: 'এন্টারপ্রাইজ সিকিউরিটি', desc: 'আমাদের লেখা প্রতিটি কোড লাইনের সাথে ব্যাংক-গ্রেড এনক্রিপশন এবং কমপ্লায়েন্স নিশ্চিত করা হয়।' },
        { title: 'অভিজাত প্রতিভা', desc: 'বিশ্বমানের ইঞ্জিনিয়ার, ডিজাইনার এবং এআই গবেষকদের একটি নিবেদিত দলের অভিজ্ঞতা উপভোগ করুন।' }
      ]
    },
    projects: {
      title: 'আমাদের প্রকল্পসমূহ',
      subtitle: 'বাস্তব ব্যবসার জন্য আমাদের তৈরি করা বাস্তব সলিউশন।',
      items: [] as { title: string; desc: string; tags: string[]; link: string; image: string }[],
    },
    leadership: {
      title: 'আমাদের টিম',
      subtitle: 'ORBIT SaaS-এর পেছনের মানুষ — সফটওয়্যারের ভবিষ্যৎ নির্মাণ করছি।',
      members: [] as any[],
    },
    reviews: {
      title: 'ক্লায়েন্ট রিভিউ',
      subtitle: 'আমাদের সাথে কাজ করার অভিজ্ঞতা',
      items: [] as any[],
    },
    contact: {
      title: 'দারুণ কিছু তৈরি করতে প্রস্তুত?',
      subtitle: 'আপনার পরবর্তী ওয়েব, এআই বা মোবাইল প্রজেক্ট নিয়ে আলোচনা করুন — আজই ফ্রি কনসালটেশন বুক করুন।',
      cta: 'ফ্রি কনসালটেশন বুক করুন',
      whatsapp: '+8801853452264',
    },
    footer: {
      brandName: 'ORBIT SaaS',
      rights: '© 2026 ORBIT SaaS। সমস্ত অধিকার সংরক্ষিত।',
      tagline: 'ফুল-সার্ভিস সফটওয়্যার ও এআই এজেন্সি — ওয়েব, এআই, মোবাইল এবং আরও অনেক কিছু।',
      socials: [
        { platform: 'facebook', url: '', enabled: false },
        { platform: 'instagram', url: '', enabled: false },
        { platform: 'linkedin', url: '', enabled: false },
        { platform: 'telegram', url: '', enabled: false },
        { platform: 'twitter', url: '', enabled: false },
        { platform: 'youtube', url: '', enabled: false },
        { platform: 'github', url: '', enabled: false },
        { platform: 'whatsapp', url: '', enabled: false },
      ],
    },
    chatbot: {
      title: 'ORBIT এআই সহকারী',
      placeholder: 'আমাদের সেবা সম্পর্কে জিজ্ঞাসা করুন...',
      greeting: 'হ্যালো! আমি ORBIT-এর এআই সহকারী। আমি কীভাবে সাহায্য করতে পারি?',
      systemPrompt: '',
      qaPairs: [] as { question: string; answer: string }[],
    },
    process: {
      subtitle: 'কার্যপ্রণালী',
      title: 'আমরা যেভাবে আপনার লক্ষ্য পূরণ করি',
      steps: [
        {
          id: '০১',
          title: 'আবিষ্কার (Discovery)',
          desc: 'আপনার লক্ষ্য, টার্গেট অডিয়েন্স এবং ব্যবসায়িক লক্ষ্যগুলো গভীরভাবে বিশ্লেষণ করে আমরা একটি মজবুত ভিত্তি তৈরি করি।',
        },
        {
          id: '০২',
          title: 'পরিকল্পনা (Planning)',
          desc: 'প্রজেক্ট রোডের ম্যাপ, টেকনিক্যাল আর্কিটেকচার এবং ওয়্যারফ্রেম তৈরির মাধ্যমে সঠিক দিকনির্দেশনা নিশ্চিত করি।',
        },
        {
          id: '০৩',
          title: 'উন্নয়ন (Development)',
          desc: 'পরিচ্ছন্ন কোড এবং স্কেলেবল আর্কিটেকচারের মাধ্যমে আপনার ভাবনাকে বাস্তবে রূপ দান করি।',
        },
        {
          id: '০৪',
          title: 'পরীক্ষণ (Testing)',
          desc: 'লঞ্চ করার আগে প্রতিটি ফিচার নিখুঁতভাবে পরীক্ষা এবং পারফরম্যান্স অপ্টিমাইজেশন নিশ্চিত করি।',
        },
        {
          id: '০৫',
          title: 'ডেলিভারি (Delivery)',
          desc: 'আপনার প্রজেক্ট সফলভাবে লাইভ! আমরা একটি মসৃণ হ্যান্ডওভার এবং প্রজেক্ট পরবর্তী সাপোর্ট নিশ্চিত করি।',
        },
      ],
    },
  },
} as const;

export type Translations = typeof translations['en'] | typeof translations['bn'];
`;

const outputPath = path.join(__dirname, '../src/lib/i18n.ts');
fs.writeFileSync(outputPath, content, 'utf8');
console.log('Successfully wrote i18n.ts');
