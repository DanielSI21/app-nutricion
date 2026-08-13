import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function ModalLayer({ children }: { children: ReactNode }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    document.body.classList.add('modal-open');
    root?.setAttribute('inert', '');

    const dialog = layerRef.current?.querySelector<HTMLElement>('[role="dialog"]');
    if (dialog) {
      dialog.setAttribute('tabindex', '-1');
      dialog.focus({ preventScroll: true });
    }

    return () => {
      document.body.classList.remove('modal-open');
      root?.removeAttribute('inert');
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<div className="modal-layer" ref={layerRef}>{children}</div>, document.body);
}
