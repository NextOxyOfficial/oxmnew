'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that returns true only after the component has mounted on the client.
 * Useful for preventing hydration mismatches when using browser-only APIs.
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook that safely handles hydration by only returning true after mount.
 * Provides a loading state during the hydration process.
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return { isHydrated, isLoading: !isHydrated };
}
