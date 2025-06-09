
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { styles } from '@/styles/pauli-styles';
import PauliHero from '@/components/PauliHero';
import PricingCard from '@/components/PricingCard';
import PauliFooter from '@/components/PauliFooter';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const pricingItems = [
  {
    tier: 'Basic Website',
    price: '$1–4k',
    target: 'Small businesses like restaurants, plumbers, attorneys, nonprofits.',
    overview: 'Basic single-page site. SEO-ready. Clear mobile UX. Fast & lean.',
    cta: 'Order Basic →',
    color: '#ffe36e',
  },
  {
    tier: 'Custom Website',
    price: '$5–9k',
    target: 'Growing brands, ecommerce stores, custom layouts.',
    overview: 'Interactive design, CMS support, optimized flow, custom flair.',
    cta: "I'll Take Custom →",
    color: '#ff9966',
  },
  {
    tier: 'Custom Developed',
    price: '$10–20k',
    target: 'APIs, backend, widget dev. Complex logic for SaaS or marketplaces.',
    overview: 'Advanced integrations, flows, dev stack aligned to performance.',
    cta: 'Build Me This →',
    color: '#ff6666',
  },
  {
    tier: 'Enterprise',
    price: '$20k+',
    target: 'Franchise, multi-location, or enterprise apps w/ dashboard, auth, AI.',
    overview: 'Fully custom stack, content engine, multilingual scale + security.',
    cta: 'Summon Pauli →',
    color: '#f44336',
  }
];

const Index = () => {
  useEffect(() => {
    document.title = '1111 Pauli\'s Place - Menu';

    // GSAP 3D and Depth FX with proper typing
    gsap.utils.toArray<HTMLElement>('.menu-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 80, rotateX: 15, transformPerspective: 800 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          delay: i * 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
          },
        }
      );
    });

    // Scroll-triggered parallax effects
    gsap.utils.toArray<HTMLElement>('.pauli-parallax').forEach((element) => {
      gsap.to(element, {
        yPercent: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // Hero lighting effects
    gsap.to('.hero-glow', {
      opacity: 0.8,
      scale: 1.1,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    });

    // Typewriter effect for tagline
    const tagline = document.querySelector('.typewriter-text');
    if (tagline) {
      const text = tagline.textContent || '';
      tagline.textContent = '';
      
      gsap.to(tagline, {
        duration: text.length * 0.05,
        ease: 'none',
        onUpdate: function() {
          const progress = this.progress();
          const currentLength = Math.round(progress * text.length);
          tagline.textContent = text.substring(0, currentLength);
        }
      });
    }

    // Enhanced card hover effects
    gsap.utils.toArray<HTMLElement>('.pricing-card').forEach((card) => {
      const tl = gsap.timeline({ paused: true });
      
      tl.to(card, {
        scale: 1.05,
        rotateY: 5,
        z: 50,
        duration: 0.3,
        ease: 'power2.out'
      });

      card.addEventListener('mouseenter', () => tl.play());
      card.addEventListener('mouseleave', () => tl.reverse());
    });

    // Console success message
    console.log('✅ DESIGN ELEVATED — Now worthy of espresso, enemies, and awards.');

  }, []);

  return (
    <div className={styles.container}>
      <PauliHero />
      
      <section id="menu-section" className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#ffe36e] mb-6 tracking-wider">
            CASE FILES
          </h2>
          <p className="typewriter-text text-xl text-[#ffe36e] max-w-3xl mx-auto leading-relaxed">
            Pricing so smooth it should be illegal. Designed in a jazz club. Delivered by a fugitive.
          </p>
        </div>

        <div className={styles.grid}>
          {pricingItems.map((item, i) => (
            <PricingCard key={item.tier} item={item} index={i} />
          ))}
        </div>
      </section>

      <PauliFooter />
    </div>
  );
};

export default Index;
