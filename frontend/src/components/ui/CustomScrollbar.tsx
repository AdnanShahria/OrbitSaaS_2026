import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export function CustomScrollbar() {
  const [scrollState, setScrollState] = useState({
    thumbHeight: 40,
    thumbTop: 80,
    visible: false,
    isDragging: false,
  });

  const updateScrollPosition = useCallback(() => {
    if (scrollState.isDragging) return;
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollY = window.scrollY;

    if (documentHeight <= windowHeight) {
      setScrollState(prev => ({ ...prev, visible: false }));
      return;
    }

    const trackHeight = windowHeight - 80; // Start under navbar
    
    // Calculate thumb height proportionally
    let thumbHeight = Math.max((windowHeight / documentHeight) * trackHeight, 40);
    
    // Calculate scroll progress (0 to 1)
    const scrollProgress = scrollY / (documentHeight - windowHeight);
    
    // Calculate thumb top position
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = 80 + (scrollProgress * maxThumbTop);

    setScrollState(prev => ({
      ...prev,
      thumbHeight,
      thumbTop,
      visible: true
    }));
  }, [scrollState.isDragging]);

  useEffect(() => {
    updateScrollPosition();
    window.addEventListener('scroll', updateScrollPosition, { passive: true });
    window.addEventListener('resize', updateScrollPosition);
    
    const observer = new MutationObserver(updateScrollPosition);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('scroll', updateScrollPosition);
      window.removeEventListener('resize', updateScrollPosition);
      observer.disconnect();
    };
  }, [updateScrollPosition]);

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent text selection
    setScrollState(prev => ({ ...prev, isDragging: true }));
    
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startScrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const trackHeight = windowHeight - 80;
    const maxThumbTop = trackHeight - scrollState.thumbHeight;

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaY = currentY - startY;
      
      // Convert thumb movement back to scroll movement
      const scrollDelta = (deltaY / maxThumbTop) * (documentHeight - windowHeight);
      window.scrollTo({ top: startScrollY + scrollDelta, behavior: 'instant' as ScrollBehavior });
    };

    const handleDragEnd = () => {
      setScrollState(prev => ({ ...prev, isDragging: false }));
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDragMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
  };

  if (!scrollState.visible) return null;

  return (
    <div 
      className="fixed right-0 w-[5px] bg-transparent z-[9999]"
      style={{
        top: '80px',
        bottom: '0px',
      }}
    >
      <motion.div 
        className="absolute w-full bg-[#22C55E] rounded-full cursor-pointer hover:bg-[#16A34A] transition-colors"
        style={{
          height: `${scrollState.thumbHeight}px`,
          top: `${scrollState.thumbTop - 80}px`
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        animate={{ top: scrollState.thumbTop - 80, height: scrollState.thumbHeight }}
        transition={{ type: 'tween', duration: scrollState.isDragging ? 0 : 0.05 }}
      />
    </div>
  );
}
