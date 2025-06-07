
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PricingItem {
  tier: string;
  price: string;
  target: string;
  overview: string;
  cta: string;
  color: string;
  textColor: string;
}

interface PricingCardProps {
  item: PricingItem;
  index: number;
}

const PricingCard = ({ item, index }: PricingCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={`relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-400 hover:border-red-400 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20 animate-fade-in cursor-pointer group ${
        isHovered ? 'scale-105 rotate-1' : ''
      }`}
      style={{ animationDelay: `${index * 0.2}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"%3E%3Cg fill="none" stroke="%23ffd700" stroke-width="1"%3E%3Cpath d="M30 0v60M0 30h60"/%3E%3C/g%3E%3C/svg%3E')] bg-repeat"></div>
      </div>

      {/* Crime Scene Tape Effect */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 opacity-80"></div>
      
      <CardContent className="relative z-10 p-8">
        {/* Tier Badge */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-bold text-yellow-400 tracking-wider group-hover:text-red-400 transition-colors">
            {item.tier}
          </h3>
          <div className="bg-black/50 px-3 py-1 rounded-full border border-yellow-400">
            <span className="text-xs text-yellow-300 font-bold">CASE #{index + 1}</span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <p className="text-4xl font-bold text-red-400 mb-2">{item.price}</p>
          <p className="text-sm text-yellow-200 italic leading-relaxed">{item.target}</p>
        </div>

        {/* Overview */}
        <div className="mb-8">
          <p className="text-yellow-100 leading-relaxed text-base">{item.overview}</p>
        </div>

        {/* CTA Button */}
        <Button 
          className={`w-full ${item.color} ${item.textColor} hover:scale-105 hover:shadow-lg font-bold text-lg py-6 transition-all duration-300 border-2 border-black hover:border-yellow-400`}
        >
          <span className="tracking-wider">{item.cta}</span>
        </Button>

        {/* Evidence Number */}
        <div className="mt-4 text-center">
          <p className="text-xs text-yellow-400/60 font-mono">EVIDENCE #{String(index + 1).padStart(3, '0')}</p>
        </div>
      </CardContent>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-red-500/10 transition-opacity duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}></div>
    </Card>
  );
};

export default PricingCard;
