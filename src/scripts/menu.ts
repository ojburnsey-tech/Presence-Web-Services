/** Native modal semantics, explicit Tab wrapping and interruptible spring motion. */
export function setupMenu() {
  const dialog = document.querySelector<HTMLDialogElement>('#site-menu');
  const trigger = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  const fallback = document.querySelector<HTMLElement>('[data-menu-fallback]');
  const panel = dialog?.querySelector<HTMLElement>('[data-menu-panel]');
  const scrim = dialog?.querySelector<HTMLElement>('[data-menu-backdrop]');
  const toggle = dialog?.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const label = dialog?.querySelector<HTMLElement>('[data-menu-label]');
  if (
    !dialog ||
    !trigger ||
    !panel ||
    !scrim ||
    !toggle ||
    !label ||
    typeof dialog.showModal !== 'function' ||
    typeof dialog.close !== 'function'
  )
    return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = 0;
  let velocity = 0;
  let target = 0;
  let frame: number | undefined;
  let previousTime = 0;
  // Apple-style response of roughly 0.35s, critical damping and no ornamental bounce.
  const omega = (2 * Math.PI) / 0.35;
  const render = () => {
    // The panel enters from the right, beside the Menu button that opened it.
    panel.style.transform = `translate3d(${(1 - position) * 100}%, 0, 0)`;
    scrim.style.opacity = String(Math.max(0, Math.min(1, position)));
  };
  const cancelFrame = () => {
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    frame = undefined;
  };
  const finish = () => {
    position = target;
    velocity = 0;
    render();
    if (target === 0) {
      dialog.close();
      document.documentElement.classList.remove('menu-open');
      trigger.focus({ preventScroll: true });
    }
  };
  const tick = (now: number) => {
    frame = undefined;
    const dt = Math.min(Math.max((now - previousTime) / 1000, 0), 0.064);
    previousTime = now;
    // Exact critical-spring step, preserving current position AND velocity on retarget.
    const displacement = position - target;
    const decay = Math.exp(-omega * dt);
    const handoff = (velocity + omega * displacement) * dt;
    position = target + (displacement + handoff) * decay;
    velocity = (velocity - omega * handoff) * decay;
    render();
    if (Math.abs(position - target) < 0.001 && Math.abs(velocity) < 0.01) finish();
    else frame = window.requestAnimationFrame(tick);
  };
  const setOpen = (open: boolean) => {
    target = open ? 1 : 0;
    trigger.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Reopen menu');
    label.textContent = open ? 'Close' : 'Menu';
    if (open && !dialog.open) {
      position = 0;
      velocity = 0;
      render();
      dialog.showModal();
      document.documentElement.classList.add('menu-open');
      toggle.focus({ preventScroll: true });
    }
    if (!dialog.open) return;
    if (reduced.matches) {
      cancelFrame();
      finish();
    } else if (frame === undefined) {
      previousTime = window.performance.now();
      frame = window.requestAnimationFrame(tick);
    }
  };
  trigger.addEventListener('click', () => setOpen(true));
  // This stationary control can reverse a closing drawer before it has finished moving.
  toggle.addEventListener('click', () => setOpen(target === 0));
  scrim.addEventListener('click', () => setOpen(false));
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [
      ...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]'),
    ].filter((element) => !element.hidden && element.getClientRects().length > 0);
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    setOpen(false);
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches && dialog.open) setOpen(target === 1);
  });
  window.addEventListener('pagehide', () => {
    cancelFrame();
    target = position = velocity = 0;
    render();
    if (dialog.open) dialog.close();
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
  });
  fallback?.setAttribute('hidden', '');
  trigger.hidden = false;
}
