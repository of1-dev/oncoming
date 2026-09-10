/**
 * Oncoming — mobile touch drive pad.
 * Virtual stick (steer + reverse) + gas / brake / boost.
 * Hidden on fine-pointer desktops unless a touch arrives.
 */
export const touch = {
  shown: false,
  steer: 0,
  throttle: 0,
  brake: 0,
  boost: false,
};

function isCoarse() {
  try {
    return (
      matchMedia('(hover: none)').matches ||
      matchMedia('(pointer: coarse)').matches ||
      (navigator.maxTouchPoints || 0) > 0
    );
  } catch {
    return (navigator.maxTouchPoints || 0) > 0;
  }
}

function bindHold(el, on, off) {
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    on(e);
  };
  const up = (e) => {
    e.preventDefault();
    off(e);
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
}

export function setupTouchControls({ onBegin, onMap } = {}) {
  const root = document.getElementById('touch-controls');
  const stick = document.getElementById('touch-stick');
  const knob = document.getElementById('touch-stick-knob');
  const gas = document.getElementById('touch-gas');
  const brake = document.getElementById('touch-brake');
  const boost = document.getElementById('touch-boost');
  const mapBtn = document.getElementById('touch-map');
  const rev = document.getElementById('touch-rev');
  if (!root || !stick) return;

  const show = () => {
    if (touch.shown) return;
    touch.shown = true;
    root.classList.add('show');
    document.body.classList.add('touch-ui');
  };

  if (isCoarse()) show();

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') show();
    },
    { passive: true },
  );

  let stickId = null;
  const stickRect = () => stick.getBoundingClientRect();
  const applyStick = (clientX, clientY) => {
    const r = stickRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const max = Math.min(r.width, r.height) * 0.42;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    if (knob) {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    const nx = dx / max;
    touch.steer = Math.abs(nx) > 0.08 ? Math.max(-1, Math.min(1, nx)) : 0;
  };
  const clearStick = () => {
    stickId = null;
    touch.steer = 0;
    if (knob) knob.style.transform = 'translate(0px, 0px)';
  };

  stick.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    show();
    onBegin?.();
    stickId = e.pointerId;
    try {
      stick.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    applyStick(e.clientX, e.clientY);
  });
  stick.addEventListener('pointermove', (e) => {
    if (stickId !== e.pointerId) return;
    e.preventDefault();
    applyStick(e.clientX, e.clientY);
  });
  const endStick = (e) => {
    if (stickId != null && e.pointerId !== stickId) return;
    e.preventDefault();
    clearStick();
  };
  stick.addEventListener('pointerup', endStick);
  stick.addEventListener('pointercancel', endStick);
  stick.addEventListener('lostpointercapture', endStick);

  bindHold(
    gas,
    () => {
      show();
      onBegin?.();
      gas.classList.add('active');
      touch.throttle = 1;
    },
    () => {
      gas.classList.remove('active');
      touch.throttle = 0;
    },
  );

  bindHold(
    brake,
    () => {
      show();
      onBegin?.();
      brake.classList.add('active');
      touch.brake = 1;
    },
    () => {
      brake.classList.remove('active');
      touch.brake = 0;
    },
  );

  bindHold(
    boost,
    () => {
      show();
      onBegin?.();
      boost.classList.add('active');
      touch.boost = true;
    },
    () => {
      boost.classList.remove('active');
      touch.boost = false;
    },
  );


  bindHold(
    rev,
    () => {
      show();
      onBegin?.();
      rev.classList.add('active');
      touch.throttle = -1;
    },
    () => {
      rev.classList.remove('active');
      if (touch.throttle < 0) touch.throttle = 0;
    },
  );

  if (mapBtn) {
    mapBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      show();
      onBegin?.();
      onMap?.();
    });
  }
}
