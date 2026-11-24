/**
 * A presentational slide-over: give it `open` and it slides its children in from an edge when shown
 * and out when hidden, staying mounted through the exit so the slide-out is seen, then unmounting.
 * Unlike {@link SlidingPanel} it owns no screen stack — it is just the show/hide slide, for a side
 * panel / drawer that is simply toggled on and off.
 *
 * It is positioned and sized by the consumer via `className` (e.g. `absolute inset-y-0 right-0`); the
 * parent must clip (`overflow-hidden` / a positioned container) so the panel is hidden when off the
 * edge. Honours `prefers-reduced-motion` (instant). While hidden it is `aria-hidden` and
 * non-interactive. When closed the children are unmounted; a brief exit still shows the last
 * children, so a `{cond && <Panel/>}` child slides out cleanly as `cond` flips to false.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );
}

export interface SlidePanelProps {
  /** Whether the panel is shown. Toggle this (keep the component mounted) to animate. */
  open: boolean;
  /** Edge the panel slides from. Default `'right'`. */
  slideFrom?: 'right' | 'left' | 'top' | 'bottom';
  /** Slide duration in ms (also the CSS transition). Default 300. */
  slideMs?: number;
  /** Called once the slide-out has finished and the panel has unmounted its children. */
  onHidden?: () => void;
  /** Positioning + sizing for the panel (e.g. `absolute inset-y-0 right-0 w-80`). */
  className?: string;
  children?: ReactNode;
}

export function SlidePanel({
  open,
  slideFrom = 'right',
  slideMs = 300,
  onHidden,
  className,
  children,
}: SlidePanelProps) {
  const reduce = prefersReducedMotion();
  // `mounted` keeps the panel in the DOM through the exit; `shown` drives the transform.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  // The last real children, so an exit still has something to show when the parent already stopped
  // passing children (e.g. `{cond && <Panel/>}` once `cond` is false).
  const lastChildren = useRef<ReactNode>(null);
  if (children != null && children !== false) lastChildren.current = children;
  const onHiddenRef = useRef(onHidden);
  onHiddenRef.current = onHidden;

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (reduce) {
        setShown(true);
        return;
      }
      // Settle on the next frame so the off-screen start paints first, then slide in.
      const raf = window.requestAnimationFrame(() => setShown(true));
      return () => window.cancelAnimationFrame(raf);
    }
    setShown(false);
    if (reduce) {
      setMounted(false);
      onHiddenRef.current?.();
      return;
    }
    const t = window.setTimeout(() => {
      setMounted(false);
      onHiddenRef.current?.();
    }, slideMs);
    return () => window.clearTimeout(t);
  }, [open, reduce, slideMs]);

  if (!mounted) return null;

  const off = {
    right: 'translateX(100%)',
    left: 'translateX(-100%)',
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
  }[slideFrom];

  return (
    <div
      className={cn(!open && 'pointer-events-none', className)}
      aria-hidden={!open}
      style={{
        transform: shown ? 'translate(0, 0)' : off,
        transition: reduce ? undefined : `transform ${slideMs}ms ease-out`,
      }}
    >
      {open ? children : lastChildren.current}
    </div>
  );
}
