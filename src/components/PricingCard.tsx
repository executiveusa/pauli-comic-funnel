
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { styles } from '@/styles/pauli-styles';

interface PricingItem {
  tier: string;
  price: string;
  target: string;
  overview: string;
  cta: string;
  color: string;
}

interface PricingCardProps {
  item: PricingItem;
  index: number;
}

const PricingCard = ({ item, index }: PricingCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`${styles.card} ${
        isHovered ? 'scale-105 rotate-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_30px,rgba(255,215,0,0.1)_30px,rgba(255,215,0,0.1)_32px)]"></div>
      </div>

      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-80"></div>
      
      <CardContent className="relative z-10 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className={styles.tierTitle}>
            {item.tier}
          </h3>
          <div className="bg-black/50 px-3 py-1 rounded-full border border-yellow-400">
            <span className="text-xs text-yellow-300 font-bold">CASE #{index + 1}</span>
          </div>
        </div>

        <div className="mb-6">
          <p className={`${styles.tierPrice} text-4xl`} style={{ color: item.color }}>{item.price}</p>
          <p className={styles.tierTarget}>{item.target}</p>
        </div>

        <div className="mb-8">
          <p className={styles.tierOverview}>{item.overview}</p>
        </div>

        <Button 
          className={`${styles.ctaButton} hover:scale-105 hover:shadow-lg py-6 transition-all duration-300 border-2 border-black hover:border-yellow-400`}
          style={{ backgroundColor: item.color }}
        >
          <span className="tracking-wider">{item.cta}</span>
        </Button>

        <div className="mt-4 text-center">
          <p className="text-xs text-yellow-400/60 font-mono">EVIDENCE #{String(index + 1).padStart(3, '0')}</p>
        </div>
      </CardContent>

      <div className={`absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-red-500/10 transition-opacity duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}></div>
    </Card>
  );
};

export default PricingCard;
