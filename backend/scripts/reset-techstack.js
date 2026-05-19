import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: url || '',
    authToken: authToken || '',
});

const techStackEn = {
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
    ]
};

const techStackBn = {
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
    ]
};


async function run() {
    try {
        console.log("Starting DB update for tech stack...");

        // English
        let res = await db.execute({
            sql: `UPDATE site_content SET data = ? WHERE section = 'techStack' AND lang = 'en'`,
            args: [JSON.stringify(techStackEn)]
        });
        if (res.rowsAffected === 0) {
            await db.execute({
                sql: `INSERT INTO site_content (section, lang, data) VALUES ('techStack', 'en', ?)`,
                args: [JSON.stringify(techStackEn)]
            });
            console.log(`Inserted tech stack for en`);
        } else {
            console.log(`Updated tech stack for en`);
        }

        // Bangla
        res = await db.execute({
            sql: `UPDATE site_content SET data = ? WHERE section = 'techStack' AND lang = 'bn'`,
            args: [JSON.stringify(techStackBn)]
        });
        if (res.rowsAffected === 0) {
            await db.execute({
                sql: `INSERT INTO site_content (section, lang, data) VALUES ('techStack', 'bn', ?)`,
                args: [JSON.stringify(techStackBn)]
            });
            console.log(`Inserted tech stack for bn`);
        } else {
            console.log(`Updated tech stack for bn`);
        }

        console.log("Successfully updated tech stack in the database.");
        process.exit(0);
    } catch (err) {
        console.error("Database update failed:", err);
        process.exit(1);
    }
}

run();
