'use client';

import { useEffect, useState } from 'react';

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * NoSSR component that prevents server-side rendering of its children.
 * This is useful for components that rely on browser-only APIs or have
 * hydration mismatches due to external factors like browser extensions.
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and initial client render, show fallback
  if (!isMounted) {
    return <>{fallback}</>;
  }

  // After hydration is complete, show children
  return <>{children}</>;
}
