
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PauliHero from '@/components/PauliHero';
import PricingCard from '@/components/PricingCard';
import PauliFooter from '@/components/PauliFooter';
import { useScrollFX } from '@/hooks/useScrollFX';
import { styles } from '@/styles/pauli-styles';

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
  useScrollFX();

  useEffect(() => {
    document.title = "1111 Pauli's Place — The Menu";
  }, []);

  return (
    <div className={styles.container}>
      <PauliHero />
      
      <div className="text-center py-16" id="menu-section">
        <h1 className={styles.heading}>
          Welcome to 1111 Pauli's Place
        </h1>
        <p className="text-xl md:text-2xl text-[#ffe36e] italic">
          "Where Code Meets Crime and Every Build is a Heist"
        </p>
        
        <div className="mt-8">
          <button 
            data-scrollto="#pricing-section"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105"
          >
            View The Menu
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20" id="pricing-section">
        <div className={styles.grid}>
          {pricingItems.map((item, index) => (
            <div key={item.tier} className="pricing-card">
              <PricingCard item={item} index={index} />
            </div>
          ))}
        </div>
      </div>

      <PauliFooter />
    </div>
  );
};

export default Index;
