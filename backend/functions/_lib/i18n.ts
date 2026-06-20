export type Lang = 'en' | 'bn';

export interface LeadershipMember {
  name: string;
  role: string;
  bio?: string;
  image?: string;
  order: number;
  hidden?: boolean;
  socials?: {
    google?: { enabled: boolean; url: string };
    whatsapp?: { enabled: boolean; url: string };
    instagram?: { enabled: boolean; url: string };
    facebook?: { enabled: boolean; url: string };
    threads?: { enabled: boolean; url: string };
    twitter?: { enabled: boolean; url: string };
    fiverr?: { enabled: boolean; url: string };
    upwork?: { enabled: boolean; url: string };
    telegram?: { enabled: boolean; url: string };
    linkedin?: { enabled: boolean; url: string };
    github?: { enabled: boolean; url: string };
    email?: { enabled: boolean; url: string };
  };
}

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
      feature1Steps: ['DISCOVERY', 'AGENT_INIT', 'EXECUTION', 'OPTIMIZE'],
      feature2Query: 'How can I automate my business workflow?',
      feature2Response: 'I can deploy Multi-Agent systems to...',
      feature2FooterLeft: 'Custom Trained LLM',
      feature2FooterRight: 'Active',
      feature3UptimeLabel: 'Uptime',
      feature3UptimeValue: '99.9%',
      feature3Latency: 'Latency: 0.8ms',
      feature3Edge: 'Global Edge',
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
          name: 'AI Automation & Agents',
          color: '#d63384',
          items: ['n8n', 'Agentic AI', 'Chatbot', 'OmniChannel', 'Automation']
        },
        {
          name: 'AI & Machine Learning',
          color: '#8b5cf6',
          items: ['OpenAI API', 'LangChain', 'Pinecone (Vector DB)', 'PyTorch', 'TensorFlow', 'Hugging Face']
        },
        {
          name: 'Mobile App Development',
          color: '#8b5cf6',
          items: ['Flutter', 'React Native', 'Java', 'Kotlin', 'Swift', 'Android', 'iOS']
        },
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
        }
      ] as any[],
    },
    whyUs: {
      title: 'The ORBIT Advantage',
      badge: 'Why Choose Us',
      heading: 'The ORBIT Advantage',
      subtitle: 'We don\'t just build products — we become your technology partner, engineering for maximum ROI, global scale, and future-proof innovation.',
      cta: 'Explore Our Projects',
      ctaSub: 'High-Impact Engineering',
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
        { title: '24/7 Human Assistance', desc: 'Expert human support available around the clock to guide your vision and resolve complex challenges.' }
      ]
    },
    projects: {
      title: 'Featured Projects',
      subtitle: 'Real solutions we\'ve built for real businesses.',
      items: [] as { title: string; desc: string; tags: string[]; link: string; image: string }[],
    },
    achievements: {
      title: 'Our Achievements',
      subtitle: 'Milestones & Appreciations',
      items: [
        {
          id: "hackathon-winner-2025",
          title: "Global AI Hackathon Winners",
          desc: "Secured 1st place in the Global AI Innovation Hackathon, showcasing our custom multi-agent orchestration framework. The judges praised the system's ability to autonomously resolve complex workflows with 99.9% accuracy.",
          image: "/placeholder.png",
          category: "Hackathon",
          date: "August 2025"
        },
        {
          id: "partnership-gourmet",
          title: "Strategic Partnership with Gourmet Haven",
          desc: "Successfully deployed our enterprise management SaaS across 50+ Gourmet Haven restaurant chains. Our system streamlined their inventory management and reduced food waste by 30%.",
          image: "/placeholder.png",
          category: "Partnership",
          date: "October 2025"
        },
        {
          id: "client-appreciation-fintech",
          title: "Outstanding Deliverable Award - FinTech Pro",
          desc: "Received direct appreciation and the 'Outstanding Technical Partner' award from FinTech Pro for delivering their highly secure, low-latency trading platform two months ahead of schedule.",
          image: "/placeholder.png",
          category: "Client Appreciation",
          date: "December 2025"
        }
      ] as any[],
    },
    leadership: {
      title: 'Meet Our Team',
      subtitle: 'The minds behind ORBIT SaaS — building the future of software.',
      members: [] as LeadershipMember[],
    },
    reviews: {
      title: 'Client Reviews',
      subtitle: 'What our clients say about working with us',
      items: [] as any[],
    },
    contact: {
      badge: 'Launch your vision',
      title: 'Ready to put your idea into ORBIT?',
      subtitle: 'Join the elite businesses scaling with our high-performance AI & web ecosystems. Let’s build the future, together.',
      cta: 'Schedule Strategy Call',
      secondaryCta: 'Direct Inquiry',
      whatsapp: '+8801853452264',
    },
    footer: {
      brandName: 'ORBIT SaaS',
      rights: '© 2025 ORBIT SaaS. All rights reserved.',
      tagline: 'Full-Service Software & AI Agency — Web, AI, Mobile & Beyond.',
      email: 'contact@orbitsaas.com',
      phone: '+8801853452264',
      location: 'Rajshahi, Bangladesh',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=24.36545054786298,88.62639818383883',
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
      greeting: 'Hi! I\'m ORBIT\'s AI assistant. How can I help you today?',
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
      techStack: 'প্রযুক্তি ও টুলস',
      whyUs: 'কেন আমরা',
      leadership: 'নেতৃত্ব',
      contact: 'যোগাযোগ',
      projects: 'প্রকল্পসমূহ',
      bookCall: 'পরামর্শের জন্য বুক করুন',
      defaultSoundMuted: false,
      defaultVolume: 40,
    },
    hero: {
      title: 'আমরা নির্মাণ করি যা অন্যরা কেবল স্বপ্ন দেখে',
      tagline: 'যেখানে ধারণার সাথে বাস্তবায়নের মিলন ঘটে',
      tagline2: '',
      subtitle: 'ওয়েব অ্যাপস, এআই চ্যাটবট, এজেন্টিক অটোমেশন, মোবাইল অ্যাপস, ই-কমার্স এবং PWA — উন্নত প্রযুক্তিনির্ভর এন্ড-টু-এন্ড সমাধান।',
      cta: 'পরামর্শের জন্য বুক করুন',
      learnMore: 'সেবাসমূহ দেখুন',
      feature1Steps: ['বিশ্লেষণ', 'পরিকল্পনা', 'বাস্তবায়ন', 'উন্নয়ন'],
      feature2Query: 'আমি কীভাবে আমার ব্যবসার কাজগুলো স্বয়ংক্রিয় করব?',
      feature2Response: 'আমি এআই সিস্টেম ব্যবহার করে...',
      feature2FooterLeft: 'কাস্টম ট্রেইনড এআই',
      feature2FooterRight: 'সক্রিয়',
      feature3UptimeLabel: 'আপটাইম',
      feature3UptimeValue: '৯৯.৯%',
      feature3Latency: 'ল্যাটেন্সি: ০.৮ মিলি সেকেন্ড',
      feature3Edge: 'গ্লোবাল নেটওয়ার্ক',
    },
    stats: {
      items: [
        { value: 24, suffix: '+', label: 'সফল প্রজেক্ট' },
        { value: 5, suffix: '+', label: 'দেশ' },
        { value: 120, suffix: '+', label: 'সন্তুষ্ট গ্রাহক' },
        { value: 3, suffix: '+', label: 'বছরের অভিজ্ঞতা' },
      ],
    },
    services: {
      title: 'আমাদের মূল সেবাসমূহ',
      subtitle: 'আমরা যা তৈরি করি',
      items: [
        { title: 'ফুল স্ট্যাক ওয়েব ডিজাইন ও ডেভেলপমেন্ট', desc: 'পিক্সেল-পারফেক্ট UI/UX ডিজাইন থেকে শুরু করে শক্তিশালী ব্যাকএন্ড সিস্টেম সমৃদ্ধ ওয়েবসাইট ও ওয়েব অ্যাপস। আমরা এমন ডাইনামিক এবং রেস্পন্সিভ অভিজ্ঞতা তৈরি করি, যা অত্যন্ত দ্রুতগতি সম্পন্ন এবং স্কেলেবল।', color: '#d63384', bg: '#fff0f6', border: '#f9c8d9' },
        { title: 'কাস্টম এআই চ্যাটবট ইন্টিগ্রেশন ও সাপোর্ট', desc: 'কাস্টম-ট্রেইনড কথোপকথনমূলক এআই যা আপনার ব্যবসার ধরন বোঝে — এটি গ্রাহক সেবা স্বয়ংক্রিয় করে, লিড সংগ্রহ করে এবং আধুনিক এআই প্রযুক্তির মাধ্যমে মানুষের মতো ২৪/৭ সহায়তা প্রদান করে।', color: '#ffb300', bg: '#fffbec', border: '#f5e4a0' },
        { title: 'এআই অটোমেশন এবং এজেন্টিক এআই', desc: 'ইন্টেলিজেন্ট অটোমেশন প্রক্রিয়া যা আপনার হয়ে স্বয়ংক্রিয়ভাবে কাজ করে — এটি কাজের জটিলতা কমায়, পুনরাবৃত্তিমূলক কাজ দূর করে এবং মাল্টি-স্টেপ এজেন্টিক এআইয়ের সাহায্যে অতি দ্রুত সিদ্ধান্ত গ্রহণ সক্ষম করে।', color: '#3b82f6', bg: '#eef4ff', border: '#c3d8fa' },
        { title: 'মোবাইল অ্যাপ ডেভেলপমেন্ট', desc: 'অ্যান্ড্রয়েড এবং আইওএস উভয় প্ল্যাটফর্মের জন্যই ফ্লাটার, রিঅ্যাক্ট নেটিভ বা নেটিভ ল্যাঙ্গুয়েজ দিয়ে তৈরি অ্যাপস। আপনার ব্যবসার প্রয়োজনে সহজ থেকে শুরু করে এন্টারপ্রাইজ-গ্রেড হাই-পারফরম্যান্স মোবাইল অ্যাপ আমরা তৈরি করি।', color: '#8b5cf6', bg: '#f3f0ff', border: '#d0c7f9' },
        { title: 'ই-কমার্স ও এন্টারপ্রাইজ সলিউশন', desc: 'পেমেন্ট গেটওয়ে, রিয়েল-টাইম ডেটা অ্যানালিটিক্স, ইনভেন্টরি সিস্টেম এবং সুরক্ষিত ইনফ্রাস্ট্রাকচার সহ স্বয়ংসম্পূর্ণ অনলাইন স্টোর এবং এন্টারপ্রাইজ অ্যাপ্লিকেশন — যা আপনার ব্যবসার প্রসারে সাহায্য করে।', color: '#10b981', bg: '#edfaf4', border: '#b8ead4' },
        { title: 'PWA এবং উন্নত ওয়েব অ্যাপস', desc: 'প্রগ্রেসিভ ওয়েব অ্যাপস যা ইন্টারনেট ছাড়াও কাজ করে, অ্যাপের মতো ইনস্টল করা যায় এবং মুহূর্তের মধ্যে লোড হয়। এছাড়াও আমরা অত্যাধুনিক প্রযুক্তি ব্যবহার করে সাআস (SaaS) প্ল্যাটফর্ম ও ড্যাশবোর্ড তৈরি করি।', color: '#f97316', bg: '#fff5ee', border: '#f9d4b6' }
      ] as any[],
    },
    links: {
      title: 'প্রয়োজনীয় লিংক',
      items: [] as { title: string; link: string }[],
    },
    techStack: {
      title: 'আমাদের দক্ষতা',
      subtitle: 'যেসব প্রযুক্তির মাধ্যমে আমরা আপনার স্বপ্নকে বাস্তবে রূপ দিই',
      categories: [
        {
          name: 'এআই অটোমেশন ও এজেন্টস',
          color: '#d63384',
          items: ['n8n', 'Agentic AI', 'Chatbot', 'OmniChannel', 'Automation']
        },
        {
          name: 'এআই ও মেশিন লার্নিং',
          color: '#8b5cf6',
          items: ['OpenAI API', 'LangChain', 'Pinecone (Vector DB)', 'PyTorch', 'TensorFlow', 'Hugging Face']
        },
        {
          name: 'মোবাইল অ্যাপ ডেভেলপমেন্ট',
          color: '#8b5cf6',
          items: ['Flutter', 'React Native', 'Java', 'Kotlin', 'Swift', 'Android', 'iOS']
        },
        {
          name: 'ফ্রন্টএন্ড ডেভেলপমেন্ট',
          color: '#3b82f6',
          items: ['React 18', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Redux ToolKit', 'Zustand', 'Ant Design', 'Shadcn UI', 'GraphQL', 'Socket.io']
        },
        {
          name: 'ব্যাকএন্ড ও ডেটাবেস',
          color: '#10b981',
          items: ['Node.js', 'Express.js', 'PostgreSQL', 'Prisma ORM', 'Redis', 'MongoDB', 'Supabase', 'Firebase', 'MySQL', 'Mongoose']
        },
        {
          name: 'ক্লাউড ও ডেভঅপস',
          color: '#f97316',
          items: ['Vercel', 'AWS', 'Docker', 'GitHub Actions', 'Cloudinary', 'ImgBB', 'Kubernetes', 'Nginx', 'CI/CD Pipelines', 'DigitalOcean', 'Cloudflare']
        }
      ] as any[],
    },
    whyUs: {
      title: 'কেন অরবিট সেরা',
      badge: 'কেন আমরা অন্যদের চেয়ে আলাদা',
      heading: 'অরবিট অ্যাডভান্টেজ',
      subtitle: 'আমরা কেবল সফটওয়্যার তৈরি করি না — আমরা আপনার প্রযুক্তিগত অংশীদার হিসেবে কাজ করি, যা আপনার ব্যবসার উন্নতি, নিরাপত্তা ও ভবিষ্যৎ সাফল্যের নিশ্চয়তা দেয়।',
      cta: 'আমাদের পূর্ববর্তী কাজগুলো দেখুন',
      ctaSub: 'উচ্চ-মানসম্পন্ন ইঞ্জিনিয়ারিং',
      items: [
        {
          title: 'সরাসরি মুনাফা (ROI) বৃদ্ধি',
          desc: 'আমাদের এআই ও অন্যান্য সলিউশনগুলো এমনভাবে তৈরি করা হয়, যা সরাসরি ব্যবসার খরচ কমিয়ে মুনাফা বাড়াতে সাহায্য করে। আমরা গুরুত্বপূর্ণ স্বয়ংক্রিয় কাজগুলোর দিকে মনোযোগ দিই।',
          benefit: 'ডিপ্লয়মেন্টের প্রথম বছরের মধ্যেই বিনিয়োগের ওপর গড়ে ৩.৫ গুণ রিটার্ন পাওয়ার সম্ভাবনা থাকে।',
          bg: '#eef2ff',
          color: '#4f46e5' 
        },
        { 
          title: 'যেকোনো স্কেলে মানিয়ে নেওয়ার ক্ষমতা', 
          desc: 'একবার তৈরি করুন, চিরকাল ব্যবহার করুন। আমাদের সার্ভারলেস ও এজ-রেডি আর্কিটেকচার নিশ্চিত করে যে আপনার তৈরি অ্যাপ্লিকেশন কোনো ল্যাগ ছাড়াই লক্ষ লক্ষ ব্যবহারকারী সামলাতে পারে।', 
          benefit: 'কোনো ম্যানুয়াল কাজ ছাড়াই স্বয়ংক্রিয়ভাবে সার্ভার ও ইনফ্রাস্ট্রাকচার স্কেল হয়।',
          bg: '#f0fdf4', 
          color: '#16a34a' 
        },
        { 
          title: 'দীর্ঘমেয়াদী সমৃদ্ধি', 
          desc: 'আমরা ভবিষ্যৎ চিন্তা করে কাজ করি। আমাদের মডুলার সিস্টেম আপনার ব্যবসার প্রসারের সাথে সাথে নিজেদের আপডেট করে নেয়, যাতে আপনাকে পুরোনো প্রযুক্তির ওপর নির্ভর করতে না হয়।', 
          benefit: 'নিয়মিত মেইনটেনেন্স এবং নতুন ফিচারের সংযোজন আপনাকে সব সময় প্রতিযোগিতায় এগিয়ে রাখে।',
          bg: '#fffbeb', 
          color: '#d97706' 
        },
        { 
          title: 'এআই-ফার্স্ট ডেভেলপমেন্ট', 
          desc: 'সফটওয়্যারের অন্যতম গুরুত্বপূর্ণ অংশ হিসেবে আমরা বুদ্ধিমত্তাকে গুরুত্ব দিই। আপনার সফটওয়্যারের মূলে স্বয়ংক্রিয় এআই এবং ডেটা অ্যানালিটিক্স ব্যবহার করে কাজকে আরও সহজ করা হয়।', 
          benefit: 'আপনার ব্যবসার নিজস্ব ডেটার ওপর ভিত্তি করে এআই তৈরি করে আপনি অভাবনীয় সুবিধা অর্জন করতে পারেন।',
          bg: '#fff0f6', 
          color: '#db2777' 
        }
      ] as any[],
      benefits: [
        { title: 'গ্লোবাল ডেলিভারি সার্ভিস', desc: 'বিশ্বের যেকোনো প্রান্তের ব্যবহারকারীর কাছে অত্যন্ত দ্রুতগতি এবং কোনো বাধা ছাড়াই আপনার সেবাগুলো পৌঁছে যায়।' },
        { title: 'এন্টারপ্রাইজ-গ্রেড নিরাপত্তা', desc: 'আমাদের লেখা প্রতিটি কোডে ব্যাংক-গ্রেড এনক্রিপশন এবং সর্বাধিক ডেটা নিরাপত্তা নিশ্চিত করা হয়।' },
        { title: '২৪/৭ সার্বক্ষণিক সহায়তা', desc: 'যেকোনো প্রযুক্তিগত সমস্যা সমাধানে বা নির্দেশনার জন্য আমাদের বিশেষজ্ঞ দল সব সময় আপনার পাশে রয়েছে।' }
      ]
    },
    projects: {
      title: 'আমাদের উল্লেখযোগ্য প্রজেক্ট',
      subtitle: 'প্রকৃত ব্যবসার জন্য আমাদের তৈরি বাস্তব সলিউশন।',
      items: [] as { title: string; desc: string; tags: string[]; link: string; image: string }[],
    },
    achievements: {
      title: 'আমাদের অর্জনসমূহ',
      subtitle: 'মাইলফলক ও প্রশংসা',
      items: [
        {
          id: "hackathon-winner-2025",
          title: "গ্লোবাল এআই হ্যাকাথন বিজয়ী",
          desc: "আমাদের কাস্টম মাল্টি-এজেন্ট অর্কেস্ট্রেশন ফ্রেমওয়ার্ক প্রদর্শন করে গ্লোবাল এআই ইনোভেশন হ্যাকাথনে ১ম স্থান অর্জন করেছি। বিচারকগণ সিস্টেমের ৯৯.৯% নির্ভুলতার সাথে জটিল কাজের গতিপথ স্বায়ত্তশাসিতভাবে সমাধান করার ক্ষমতার প্রশংসা করেছেন।",
          image: "/placeholder.png",
          category: "হ্যাকাথন",
          date: "আগস্ট ২০২৫"
        },
        {
          id: "partnership-gourmet",
          title: "গুরমে হেভেনের সাথে কৌশলগত অংশীদারিত্ব",
          desc: "৫০+ গুরমে হেভেন রেস্তোরাঁ চেইনে আমাদের এন্টারপ্রাইজ ম্যানেজমেন্ট সাআস (SaaS) সফলভাবে স্থাপন করেছি। আমাদের সিস্টেম তাদের ইনভেন্টরি পরিচালন সহজতর করেছে এবং খাবারের অপচয় ৩০% কমিয়েছে।",
          image: "/placeholder.png",
          category: "অংশীদারিত্ব",
          date: "অক্টোবর ২০২৫"
        },
        {
          id: "client-appreciation-fintech",
          title: "অসামান্য ডেলিভারি পুরস্কার - ফিনটেক প্রো",
          desc: "নির্ধারিত সময়ের দুই মাস আগে অত্যন্ত নিরাপদ, কম-ল্যাটেন্সি ট্রেডিং প্ল্যাটফর্ম সরবরাহ করার জন্য ফিনটেক প্রো থেকে সরাসরি প্রশংসা এবং 'অসামান্য প্রযুক্তিগত অংশীদার' পুরস্কার পেয়েছি।",
          image: "/placeholder.png",
          category: "ক্লায়েন্ট প্রশংসা",
          date: "ডিসেম্বর ২০২৫"
        }
      ] as any[],
    },
    leadership: {
      title: 'আমাদের টিমের সাথে পরিচিত হোন',
      subtitle: 'অরবিট সাস (ORBIT SaaS) এর পেছনের মস্তিষ্কসমূহ — যারা সফটওয়্যারের ভবিষ্যৎ নির্মাণ করছে।',
      members: [] as LeadershipMember[],
    },
    reviews: {
      title: 'ক্লায়েন্ট রিভিউ',
      subtitle: 'আমাদের কাজ সম্পর্কে ক্লায়েন্টরা যা বলেন',
      items: [] as any[],
    },
    contact: {
      badge: 'আপনার স্বপ্ন ডানা মেলুক',
      title: 'আপনার আইডিয়াকে সফলতায় রূপ দিতে প্রস্তুত?',
      subtitle: 'আমাদের হাই-পারফরম্যান্স এআই এবং ওয়েব সিস্টেমের মাধ্যমে আপনার ব্যবসাকে পরবর্তী ধাপে নিয়ে যান। আসুন, একসাথে সামনে এগিয়ে যাই।',
      cta: 'স্ট্র্যাটেজি কলের জন্য শিডিউল করুন',
      secondaryCta: 'সরাসরি মেসেজ দিন',
      whatsapp: '+8801853452264',
    },
    footer: {
      brandName: 'ORBIT SaaS',
      rights: '© ২০২৬ অরবিট সাস (ORBIT SaaS)। সকল অধিকার সংরক্ষিত।',
      tagline: 'ফুল-সার্ভিস সফটওয়্যার ও এআই এজেন্সি — ওয়েব, এআই, মোবাইল অ্যাপস এবং আরও অনেক কিছু।',
      email: 'contact@orbitsaas.com',
      phone: '+8801853452264',
      location: 'রাজশাহী, বাংলাদেশ',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=24.36545054786298,88.62639818383883',
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
      title: 'অরবিট এআই অ্যাসিস্ট্যান্ট',
      placeholder: 'আমাদের সেবাসমূহ সম্পর্কে জিজ্ঞাসা করুন...',
      greeting: 'হ্যালো! আমি অরবিটের এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
      systemPrompt: '',
      qaPairs: [] as { question: string; answer: string }[],
    },
    process: {
      subtitle: 'আমাদের কর্মপদ্ধতি',
      title: 'আমরা যেভাবে আপনার ধারণাকে বাস্তবে রূপ দিই',
      steps: [
        {
          id: '০১',
          title: 'বিশ্লেষণ ও অনুসন্ধান',
          desc: 'আমরা আপনার লক্ষ্য, টার্গেট অডিয়েন্স এবং ব্যবসার মূল উদ্দেশ্যগুলো নিয়ে গভীরভাবে বিশ্লেষণ করে একটি মজবুত ভিত্তি তৈরি করি।',
        },
        {
          id: '০২',
          title: 'পরিকল্পনা ও রূপরেখা',
          desc: 'টেকনিক্যাল আর্কিটেকচার, ওয়্যারফ্রেম এবং প্রজেক্টের সম্পূর্ণ রোডম্যাপ তৈরির মাধ্যমে সঠিক দিকনির্দেশনা নিশ্চিত করি।',
        },
        {
          id: '০৩',
          title: 'ডিজাইন ও ডেভেলপমেন্ট',
          desc: 'উন্নতমানের কোডিং এবং মানানসই আর্কিটেকচারের মাধ্যমে আপনার ভাবনাকে অত্যাধুনিক টেকনোলজি দিয়ে বাস্তবে রূপ দিই।',
        },
        {
          id: '০৪',
          title: 'মান নিয়ন্ত্রণ ও টেস্টিং',
          desc: 'প্রজেক্ট লাইভ করার আগে প্রতিটি ফিচারের নির্ভুলতা যাচাই এবং সব ধরনের বাগ বা সমস্যা দূর করে পারফরম্যান্স নিশ্চিত করি।',
        },
        {
          id: '০৫',
          title: 'হস্তান্তর ও সাপোর্ট',
          desc: 'সফলভাবে প্রজেক্ট লাইভ হওয়ার পর সবকিছু বুঝিয়ে দেওয়া এবং পরবর্তীতে যেকোনো প্রয়োজনে আমরা সব সময় সাপোর্ট দিয়ে থাকি।',
        },
      ],
    },
  },
} as const;

export type Translations = typeof translations['en'] | typeof translations['bn'];
