/**
 * Global chunk error handler for production
 * Handles ChunkLoadError by reloading the page
 */

if (typeof window !== 'undefined') {
  // Store the original error handler
  const originalOnError = window.onerror;

  // Override window.onerror to catch chunk loading errors
  window.onerror = function (message, source, lineno, colno, error) {
    // Check if it's a chunk loading error
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      (typeof message === 'string' &&
        (message.includes('Loading chunk') ||
          message.includes('ChunkLoadError') ||
          message.includes('Failed to fetch dynamically imported module')));

    if (isChunkError) {
      console.error('Chunk loading error detected, reloading page...');
      
      // Store a flag to prevent infinite reload loops
      const reloadKey = 'chunk_reload_attempt';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Only reload if we haven't reloaded in the last 10 seconds
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
        return true; // Prevent default error handling
      } else {
        console.error('Multiple chunk errors detected, not reloading to prevent loop');
      }
    }

    // Call the original error handler if it exists
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }

    return false;
  };

  // Also handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      (error?.message &&
        (error.message.includes('Loading chunk') ||
          error.message.includes('ChunkLoadError') ||
          error.message.includes('Failed to fetch dynamically imported module')));

    if (isChunkError) {
      console.error('Chunk loading error in promise, reloading page...');
      event.preventDefault();

      const reloadKey = 'chunk_reload_attempt';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
      }
    }
  });
}

export {};
