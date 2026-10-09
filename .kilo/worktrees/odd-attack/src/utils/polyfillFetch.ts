/**
 * Polyfill / Patch for "Cannot set property fetch of #<Window> which has only a getter"
 * This error occurs in sandboxed iframes or browser environments where `window.fetch`
 * is defined with only a getter on Window.prototype or window proxy, causing errors
 * when libraries or devtools attempt to monkey-patch or reassign `fetch`.
 */
export function ensureFetchSetter(): void {
  if (typeof window === 'undefined') return;

  try {
    let rawFetch = window.fetch;
    let currentFetch: typeof window.fetch = typeof rawFetch === 'function'
      ? function (this: any, ...args: Parameters<typeof window.fetch>) {
          return rawFetch.apply(this || window, args);
        }
      : rawFetch;

    const descriptor: PropertyDescriptor = {
      get: function () {
        return currentFetch;
      },
      set: function (newFetch: any) {
        currentFetch = newFetch;
      },
      configurable: true,
      enumerable: true,
    };

    try {
      Object.defineProperty(window, 'fetch', descriptor);
    } catch {}

    try {
      if (typeof Window !== 'undefined' && Window.prototype) {
        Object.defineProperty(Window.prototype, 'fetch', descriptor);
      }
    } catch {}

    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any) !== window) {
        Object.defineProperty(globalThis, 'fetch', descriptor);
      }
    } catch {}
  } catch {}

  // Prevent uncaught errors from crashing the applet if triggered asynchronously
  window.addEventListener(
    'error',
    (event) => {
      if (
        event &&
        event.message &&
        typeof event.message === 'string' &&
        event.message.includes('Cannot set property fetch of')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    },
    true
  );
}

// Execute immediately upon module import
ensureFetchSetter();
