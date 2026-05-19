export interface AchievementItem {
  id: string;
  title: string;
  desc: string;
  image?: string;
  images?: string[];
  category?: string;
  date?: string;
  tags?: string[];
  link?: string;
  videoPreview?: string;
  hidden?: boolean;
  featured?: boolean;
  order?: number;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const fallbackAchievements: AchievementItem[] = [
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
];
