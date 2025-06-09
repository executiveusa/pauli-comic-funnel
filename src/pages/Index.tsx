
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { styles } from '@/styles/pauli-styles';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const pricingItems = [
  {
    tier: 'Basic Website',
    price: '$1–4k',
    target: 'Small businesses like restaurants, plumbers, attorneys, nonprofits.',
    overview: 'Basic single-page site. SEO-ready. Clear mobile UX. Fast & lean.',
    cta: 'Order Basic',
    color: '#ffe36e',
  },
  {
    tier: 'Custom Website',
    price: '$5–9k',
    target: 'Growing brands, ecommerce stores, custom layouts.',
    overview: 'Interactive design, CMS support, optimized flow, custom flair.',
    cta: "I'll Take Custom",
    color: '#ff9966',
  },
  {
    tier: 'Custom Developed',
    price: '$10–20k',
    target: 'APIs, backend, widget dev. Complex logic for SaaS or marketplaces.',
    overview: 'Advanced integrations, flows, dev stack aligned to performance.',
    cta: 'Build Me This',
    color: '#ff6666',
  },
  {
    tier: 'Enterprise',
    price: '$20k+',
    target: 'Franchise, multi-location, or enterprise apps w/ dashboard, auth, AI.',
    overview: 'Fully custom stack, content engine, multilingual scale + security.',
    cta: 'Summon Pauli',
    color: '#f44336',
  }
];

const Index = () => {
  useEffect(() => {
    document.title = '1111 Pauli\'s Place - Menu';

    // GSAP 3D and Depth FX
    gsap.utils.toArray('.menu-card').forEach((card, i) => {
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

    gsap.to('#pauli-hero', {
      scale: 1.05,
      y: -10,
      duration: 0.5,
      scrollTrigger: {
        trigger: '#pauli-hero',
        scrub: true,
        start: 'top bottom',
        end: 'bottom top',
      },
    });
  }, []);

  return (
    <div className="bg-[#1c1b18] text-[#ffe36e] font-[Corleone] px-6 md:px-12 pt-32 pb-20 min-h-screen">
      <div className="text-center">
        <img
          src="/lovable-uploads/780d2c8c-fcf5-4c8c-a2ca-d606c30f7215.png"
          alt="Pauli Hero Full"
          className="mx-auto mb-8 drop-shadow-xl rounded-xl max-w-xs w-full h-auto object-contain"
          id="pauli-hero"
        />
        <h1 className={styles.heading}>The Pauli Effect</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto text-neutral-300 italic mb-10">
          Pricing so smooth it should be illegal. Designed in a jazz club. Delivered by a fugitive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
        {pricingItems.map((item, i) => (
          <div
            key={item.tier}
            className="menu-card bg-[#2a2a2a] p-6 rounded-2xl shadow-2xl border border-yellow-500 transition-all duration-300 hover:scale-[1.02]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <h2 className={styles.tierTitle}>{item.tier}</h2>
            <p className={`${styles.tierPrice} text-xl`} style={{ color: item.color }}>{item.price}</p>
            <p className={styles.tierTarget}>{item.target}</p>
            <p className={styles.tierOverview}>{item.overview}</p>
            <button
              className={`${styles.ctaButton} hover:scale-105 transition-transform w-full`}
              style={{ backgroundColor: item.color }}
            >
              {item.cta}
            </button>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <p>Made at 1111 Pauli's Place. All pricing tiers come with attitude and espresso foam art.</p>
        <p className="mt-1">Powered by Hexona Systems · A Fugitive Funnel™</p>
      </footer>
    </div>
  );
};

export default Index;
