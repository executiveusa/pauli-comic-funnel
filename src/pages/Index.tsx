
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PauliHero from '@/components/PauliHero';
import PricingCard from '@/components/PricingCard';
import PauliFooter from '@/components/PauliFooter';

const pricingItems = [
  {
    tier: 'Basic Website',
    price: '$1–4k',
    target: 'Small businesses like restaurants, plumbers, attorneys, nonprofits.',
    overview: 'Basic single-page site. SEO-ready. Clear mobile UX. Fast & lean.',
    cta: 'Order Basic',
    color: 'bg-yellow-400',
    textColor: 'text-black',
  },
  {
    tier: 'Custom Website',
    price: '$5–9k',
    target: 'Growing brands, ecommerce stores, custom layouts.',
    overview: 'Interactive design, CMS support, optimized flow, custom flair.',
    cta: "I'll Take Custom",
    color: 'bg-orange-400',
    textColor: 'text-black',
  },
  {
    tier: 'Custom Developed',
    price: '$10–20k',
    target: 'APIs, backend, widget dev. Complex logic for SaaS or marketplaces.',
    overview: 'Advanced integrations, flows, dev stack aligned to performance.',
    cta: 'Build Me This',
    color: 'bg-red-400',
    textColor: 'text-white',
  },
  {
    tier: 'Enterprise',
    price: '$20k+',
    target: 'Franchise, multi-location, or enterprise apps w/ dashboard, auth, AI.',
    overview: 'Fully custom stack, content engine, multilingual scale + security.',
    cta: 'Summon Pauli',
    color: 'bg-red-600',
    textColor: 'text-white',
  }
];

const Index = () => {
  useEffect(() => {
    document.title = "1111 Pauli's Place — The Menu";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-yellow-300">
      {/* Hero Section */}
      <PauliHero />
      
      {/* Main Menu Title */}
      <div className="text-center py-16">
        <h1 className="text-6xl md:text-8xl font-bold tracking-wider mb-4 text-yellow-400 drop-shadow-2xl">
          Welcome to 1111 Pauli's Place
        </h1>
        <p className="text-xl md:text-2xl text-yellow-200 italic">
          "Where Code Meets Crime and Every Build is a Heist"
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pricingItems.map((item, index) => (
            <PricingCard key={item.tier} item={item} index={index} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <PauliFooter />
    </div>
  );
};

export default Index;
