'use client';

import { useEffect } from 'react';

export function DirectionFixProvider() {
  useEffect(() => {
    function forceEnglishLTR() {
      // ULTRA SPECIFIC: Only target English LABELS and SPANS in checkbox/radio fields
      const englishLabels = document.querySelectorAll(
        'label[data-language="english"], span[data-language="english"]',
      );

      englishLabels.forEach((element) => {
        const htmlElement = element as HTMLElement;
        // Only set direction on the label/span itself, nothing else
        htmlElement.style.setProperty('direction', 'ltr', 'important');
        htmlElement.style.setProperty('text-align', 'left', 'important');
      });

      // DON'T TOUCH ANYTHING ELSE - let Hebrew work naturally
    }

    // Removed all event-based intervention to avoid button interference

    // Run immediately
    forceEnglishLTR();

    // Run very rarely - every 10 seconds to avoid interfering
    const interval = setInterval(forceEnglishLTR, 10000);

    // No MutationObserver to avoid any interference

    // NO event listeners - they interfere with buttons
    // Let CSS and interval handle everything

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}
