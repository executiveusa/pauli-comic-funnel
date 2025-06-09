
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
        isHovered ? 'scale-105 rotate-1 shadow-2xl shadow-yellow-400/40' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_30px,rgba(255,215,0,0.1)_30px,rgba(255,215,0,0.1)_32px)]"></div>
      </div>

      {/* Crime Scene Header */}
      <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 opacity-80"></div>
      
      <CardContent className="relative z-10 p-8">
        {/* Case Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={styles.tierTitle}>
            {item.tier}
          </h3>
          <div className="bg-black/70 px-4 py-2 rounded-full border-2 border-yellow-400 backdrop-blur-sm">
            <span className="text-xs text-yellow-300 font-bold tracking-wider">CASE #{index + 1}</span>
          </div>
        </div>

        {/* Price Display */}
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            <p className={`${styles.tierPrice} text-5xl drop-shadow-lg`} style={{ color: item.color }}>
              {item.price}
            </p>
            {isHovered && (
              <div className="absolute inset-0 animate-pulse" style={{ 
                color: item.color,
                textShadow: `0 0 20px ${item.color}, 0 0 40px ${item.color}` 
              }}>
                {item.price}
              </div>
            )}
          </div>
          <p className={styles.tierTarget}>{item.target}</p>
        </div>

        {/* Evidence Description */}
        <div className="mb-8 bg-black/30 p-4 rounded-lg border border-yellow-400/30">
          <h4 className="text-yellow-400 font-bold mb-2 text-sm tracking-wider">EVIDENCE DETAILS:</h4>
          <p className={styles.tierOverview}>{item.overview}</p>
        </div>

        {/* Action Button */}
        <Button 
          className={`${styles.ctaButton} relative overflow-hidden group`}
          style={{ backgroundColor: item.color }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2 tracking-wider">
            {item.cta}
          </span>
          
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </Button>

        {/* Case Number */}
        <div className="mt-6 text-center">
          <p className="text-xs text-yellow-400/60 font-mono tracking-wider">
            EVIDENCE #{String(index + 1).padStart(3, '0')} • CLASSIFIED
          </p>
          <div className="mt-2 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"></div>
        </div>

        {/* Security Features Badge */}
        <div className="absolute top-4 right-4 opacity-60">
          <div className="w-8 h-8 border-2 border-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-400">
            ✓
          </div>
        </div>
      </CardContent>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-red-500/5 via-yellow-500/10 to-red-500/5 transition-opacity duration-500 rounded-2xl ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}></div>

      {/* 3D Shadow */}
      <div className={`absolute inset-0 bg-black/20 rounded-2xl transform translate-y-2 translate-x-2 -z-10 transition-transform duration-300 ${
        isHovered ? 'translate-y-4 translate-x-4' : ''
      }`}></div>
    </Card>
  );
};

export default PricingCard;
