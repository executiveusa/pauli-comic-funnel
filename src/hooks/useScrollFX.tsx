
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function useScrollFX() {
  useEffect(() => {
    // Parallax scroll layer for Pauli image
    gsap.to('.pauli-parallax', {
      yPercent: -30,
      scrollTrigger: {
        trigger: '.pauli-parallax',
        scrub: true,
        start: 'top bottom',
        end: 'bottom top',
      },
    });

    // Background movement effect (like smoke or paper drift)
    gsap.to('.bg-parallax', {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.bg-parallax',
        scrub: true,
      },
    });

    // Smooth scroll to anchors
    document.querySelectorAll('[data-scrollto]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const target = el.getAttribute('data-scrollto');
        if (target) {
          gsap.to(window, { duration: 1, scrollTo: target });
        }
      });
    });

    // Card reveal animations with 3D rotateY effects
    gsap.fromTo('.pricing-card', 
      {
        rotateY: 90,
        opacity: 0,
        transformPerspective: 1000,
      },
      {
        rotateY: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.pricing-grid',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    // Clean up ScrollTrigger on unmount
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
}
