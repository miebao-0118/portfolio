import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// React Bits Gradual Blur, JS + CSS variant.
const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  target: 'parent',
  className: '',
  style: {}
};

const CURVE_FUNCTIONS = {
  linear: progress => progress,
  bezier: progress => progress * progress * (3 - 2 * progress),
  'ease-in': progress => progress * progress,
  'ease-out': progress => 1 - Math.pow(1 - progress, 2),
  'ease-in-out': progress => (progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2)
};

function getGradientDirection(position) {
  return { top: 'to top', bottom: 'to bottom', left: 'to left', right: 'to right' }[position] || 'to bottom';
}

function GradualBlur(props) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(props.animated !== 'scroll');
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...props }), [props]);

  useEffect(() => {
    if (config.animated !== 'scroll' || !containerRef.current) return undefined;

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [config.animated]);

  const blurDivs = useMemo(() => {
    const increment = 100 / config.divCount;
    const curve = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;

    return Array.from({ length: config.divCount }, (_, index) => {
      const item = index + 1;
      const progress = curve(item / config.divCount);
      const blurValue = config.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * config.strength
        : 0.0625 * (progress * config.divCount + 1) * config.strength;
      const p1 = Math.round((increment * item - increment) * 10) / 10;
      const p2 = Math.round(increment * item * 10) / 10;
      const p3 = Math.round((increment * item + increment) * 10) / 10;
      const p4 = Math.round((increment * item + increment * 2) * 10) / 10;
      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      return React.createElement('div', {
        key: item,
        style: {
          position: 'absolute',
          inset: 0,
          maskImage: `linear-gradient(${getGradientDirection(config.position)}, ${gradient})`,
          WebkitMaskImage: `linear-gradient(${getGradientDirection(config.position)}, ${gradient})`,
          backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
          WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
          opacity: config.opacity,
          transition: config.animated && config.animated !== 'scroll'
            ? `backdrop-filter ${config.duration} ${config.easing}`
            : undefined
        }
      });
    });
  }, [config]);

  const isVertical = ['top', 'bottom'].includes(config.position);
  const containerStyle = {
    position: config.target === 'page' ? 'fixed' : 'absolute',
    pointerEvents: 'none',
    opacity: isVisible ? 1 : 0,
    transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
    zIndex: config.target === 'page' ? config.zIndex + 100 : config.zIndex,
    ...(isVertical
      ? { height: config.height, width: config.width || '100%', [config.position]: 0, left: 0, right: 0 }
      : { width: config.width || config.height, height: '100%', [config.position]: 0, top: 0, bottom: 0 }),
    ...config.style
  };

  return React.createElement(
    'div',
    { ref: containerRef, className: `gradual-blur ${config.className}`.trim(), style: containerStyle },
    React.createElement('div', { className: 'gradual-blur-inner' }, blurDivs)
  );
}

function mountGradualBlur() {
  const mount = document.getElementById('globalGradualBlur');
  if (!mount) return;

  createRoot(mount).render(
    React.createElement(GradualBlur, {
      position: 'bottom',
      target: 'page',
      height: '14rem',
      strength: 3.25,
      divCount: 10,
      curve: 'ease-out',
      exponential: true,
      opacity: 1,
      animated: 'scroll',
      duration: '0.45s',
      zIndex: 1
    })
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountGradualBlur, { once: true });
} else {
  mountGradualBlur();
}
