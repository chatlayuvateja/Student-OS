import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation(ref, animationConfig = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const {
      from = { y: 60, opacity: 0 },
      to = { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
      trigger = el,
      start = 'top 85%',
      end = 'top 40%',
      toggleActions = 'play none none reverse',
      ...rest
    } = animationConfig;

    const ctx = gsap.context(() => {
      gsap.fromTo(el, from, {
        ...to,
        scrollTrigger: {
          trigger,
          start,
          end,
          toggleActions,
          ...rest.scrollTrigger,
        },
      });
    });

    return () => ctx.revert();
  }, [ref, animationConfig]);
}

export function useStaggerAnimation(containerRef, itemsSelector, config = {}) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll(itemsSelector);
    if (!items.length) return;

    const {
      from = { y: 40, opacity: 0 },
      to = { y: 0, opacity: 1, stagger: 0.08, duration: 0.8, ease: 'power3.out' },
      start = 'top 85%',
    } = config;

    const ctx = gsap.context(() => {
      gsap.fromTo(items, from, {
        ...to,
        scrollTrigger: {
          trigger: container,
          start,
          toggleActions: 'play none none reverse',
        },
      });
    });

    return () => ctx.revert();
  }, [containerRef, itemsSelector, config]);
}

export function useCountUp(ref, targetNumber, config = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { duration = 2, separator = false, start = 'top 85%' } = config;

    const ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: targetNumber,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none reverse',
        },
        onUpdate: () => {
          el.textContent = separator
            ? Math.round(obj.val).toLocaleString()
            : targetNumber % 1 === 0
              ? Math.round(obj.val)
              : obj.val.toFixed(2);
        },
      });
    });

    return () => ctx.revert();
  }, [ref, targetNumber, config]);
}

export function useParallax(ref, speed = 0.3) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: () => (typeof speed === 'number' ? speed * 100 : 0),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, [ref, speed]);
}

export function useSplitTextAnimation(ref, config = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const text = el.textContent;
    if (!text) return;

    const words = text.split(' ');
    el.innerHTML = words
      .map((word) => `<span class="split-word" style="display:inline-block">${word}</span>`)
      .join(' ');

    const wordsEl = el.querySelectorAll('.split-word');

    const { from = { y: 40, opacity: 0 }, start = 'top 85%' } = config;

    const ctx = gsap.context(() => {
      gsap.fromTo(wordsEl, from, {
        y: 0,
        opacity: 1,
        stagger: 0.04,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none reverse',
        },
      });
    });

    return () => ctx.revert();
  }, [ref, config]);
}
