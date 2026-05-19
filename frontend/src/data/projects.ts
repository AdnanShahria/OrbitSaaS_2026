export interface FallbackProject {
  id: string;
  title: string;
  desc: string;
  category: string;
  categories: string[];
  tags: string[];
  featured: boolean;
  images: string[];
  order: number;
}

export const fallbackProjects: FallbackProject[] = [
  {
    id: 'techno-tech',
    title: 'Techno-Tech Engineering Ltd. — Corporate Website',
    desc: 'Dark-themed industrial corporate website for a leading Bangladeshi engineering company. Built with Next.js, Tailwind CSS, and Framer Motion. Delivered in 2 weeks. Fully responsive, SEO-optimized, and production-deployed.',
    category: 'Enterprise',
    categories: ['Enterprise'],
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    featured: true,
    images: ['/placeholder.webp'],
    order: 0,
  },
];
