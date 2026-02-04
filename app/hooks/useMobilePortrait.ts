'use client';

import { useState, useEffect } from 'react';

/**
 * Detects if the device is in mobile portrait mode.
 * Returns true for small screens (< 640px width) in portrait orientation.
 */
export function useMobilePortrait(): boolean {
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  useEffect(() => {
    const checkMobilePortrait = () => {
      const isSmallScreen = window.innerWidth < 640;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isSmallScreen && isPortrait);
    };

    // Check on mount
    checkMobilePortrait();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkMobilePortrait);
    window.addEventListener('orientationchange', checkMobilePortrait);

    return () => {
      window.removeEventListener('resize', checkMobilePortrait);
      window.removeEventListener('orientationchange', checkMobilePortrait);
    };
  }, []);

  return isMobilePortrait;
}
