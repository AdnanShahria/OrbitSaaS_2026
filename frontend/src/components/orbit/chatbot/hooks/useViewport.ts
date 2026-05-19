import { useState, useRef, useEffect } from 'react';

export function useViewport(open: boolean) {
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let resizeTimer: ReturnType<typeof setTimeout>;

    const updateViewport = () => {
      if (window.visualViewport) {
        const isKbOpen = window.visualViewport.height < window.innerHeight * 0.75;
        setIsKeyboardOpen(isKbOpen);

        if (window.innerWidth < 768) {
          if (isKbOpen) {
            const vvHeight = window.visualViewport.height;
            setViewportStyle({
              height: `${vvHeight}px`,
              top: '0px',
              bottom: 'auto',
              transition: 'height 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
            });
          } else {
            setViewportStyle({});
          }

          if (open) {
            window.scrollTo(0, 0);
          }
        } else {
          // Account for Navbar (~80px) and bottom spacing (~84px + margin)
          const availableHeight = window.visualViewport.height - 180;
          const maxH = Math.min(availableHeight, window.innerHeight * 0.80);
          setViewportStyle({
            maxHeight: `${maxH}px`,
          });
        }
      }
    };

    const debouncedUpdateViewport = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateViewport, 100);
    };

    updateViewport();
    window.visualViewport?.addEventListener('resize', debouncedUpdateViewport);
    window.visualViewport?.addEventListener('scroll', debouncedUpdateViewport);
    window.addEventListener('resize', debouncedUpdateViewport);

    return () => {
      clearTimeout(resizeTimer);
      window.visualViewport?.removeEventListener('resize', debouncedUpdateViewport);
      window.visualViewport?.removeEventListener('scroll', debouncedUpdateViewport);
      window.removeEventListener('resize', debouncedUpdateViewport);
    };
  }, [open]);

  // Body lock effect for mobile when chatbot is open
  const scrollYRef = useRef(0);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const preventScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.chatbot-messages-area') || target.closest('.chatbot-input-area')) return;
      e.preventDefault();
    };

    if (open && isMobile) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.documentElement.style.touchAction = 'none';
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      const savedY = scrollYRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.touchAction = '';
      if (savedY) {
        window.scrollTo(0, savedY);
      }
    }
    return () => {
      document.removeEventListener('touchmove', preventScroll);
      const savedY = scrollYRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.touchAction = '';
      if (savedY) {
        window.scrollTo(0, savedY);
      }
    };
  }, [open]);

  return { viewportStyle, isKeyboardOpen };
}
