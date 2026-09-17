import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        // Skip scrollTo(0, 0) if visiting an in-page section or deep-linking to a member
        const isSectionRoute = ['/services', '/why-us', '/proj', '/project', '/achievements', '/reviews', '/leadership', '/contact'].includes(pathname);
        const hasMemberParam = new URLSearchParams(search).has('member') || hash.includes('member');
        if (isSectionRoute || hasMemberParam || hash) {
            return;
        }
        window.scrollTo(0, 0);
    }, [pathname, search, hash]);

    return null;
}
