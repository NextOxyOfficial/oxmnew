'use client';

/**
 * Utility functions to detect and handle browser extensions that might
 * cause hydration mismatches by modifying the DOM.
 */

/**
 * Detects if Grammarly extension is present
 */
export function hasGrammarlyExtension(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(
    document.querySelector('[data-gr-ext-installed]') ||
    document.querySelector('[data-new-gr-c-s-check-loaded]') ||
    (window as any).grammarly
  );
}

/**
 * Detects common browser extensions that modify the DOM
 */
export function hasBrowserExtensions(): boolean {
  if (typeof window === 'undefined') return false;
  
  const extensionIndicators = [
    '[data-gr-ext-installed]', // Grammarly
    '[data-new-gr-c-s-check-loaded]', // Grammarly
    '[data-lastpass-icon-root]', // LastPass
    '[data-honey-extension]', // Honey
    '[class*="adblock"]', // AdBlockers
    '[id*="extension"]', // Generic extensions
  ];
  
  return extensionIndicators.some(selector => 
    document.querySelector(selector) !== null
  );
}

/**
 * Removes browser extension attributes from elements to prevent hydration mismatches
 * Note: This is not recommended for production use as it might break extension functionality
 */
export function cleanupExtensionAttributes(element: HTMLElement): void {
  if (typeof window === 'undefined') return;
  
  const attributesToRemove = [
    'data-gr-ext-installed',
    'data-new-gr-c-s-check-loaded',
    'data-lastpass-icon-root',
    'data-honey-extension',
  ];
  
  attributesToRemove.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
  });
}
