/**
 * Detect in-app route changes (SPA) and fire a callback.
 * Location: packages/guest/src/navigation-watch.ts
 */

export function watchNavigation(onNavigate: () => void): () => void {
  let lastHref = location.href;

  const fire = (): void => {
    const href = location.href;
    if (href === lastHref) return;
    lastHref = href;
    onNavigate();
  };

  const onPopState = (): void => fire();
  const onHashChange = (): void => fire();

  window.addEventListener('popstate', onPopState);
  window.addEventListener('hashchange', onHashChange);

  const historyRef = window.history;
  const origPush = historyRef.pushState.bind(historyRef);
  const origReplace = historyRef.replaceState.bind(historyRef);

  historyRef.pushState = (...args: Parameters<History['pushState']>) => {
    origPush(...args);
    queueMicrotask(fire);
  };
  historyRef.replaceState = (...args: Parameters<History['replaceState']>) => {
    origReplace(...args);
    queueMicrotask(fire);
  };

  return () => {
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener('hashchange', onHashChange);
    historyRef.pushState = origPush;
    historyRef.replaceState = origReplace;
  };
}
