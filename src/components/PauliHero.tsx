
import React, { useState, useEffect } from 'react';
import { styles } from '@/styles/pauli-styles';

const PauliHero = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Add scroll-to functionality for buttons
    const handleScrollTo = (e: Event) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const scrollTo = target.getAttribute('data-scrollto');
      if (scrollTo) {
        document.querySelector(scrollTo)?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    };

    document.querySelectorAll('[data-scrollto]').forEach(button => {
      button.addEventListener('click', handleScrollTo);
    });

    return () => {
      document.querySelectorAll('[data-scrollto]').forEach(button => {
        button.removeEventListener('click', handleScrollTo);
      });
    };
  }, []);

  return (
    <div className={styles.heroContainer}>
      {/* Background Pattern */}
      <div className={styles.backgroundPattern}></div>
      
      {/* Animated Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
      
      <div className={styles.heroContent}>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
          {/* Hero Image */}
          <div className={styles.heroImageWrapper} id="pauli-anim">
            <div className={styles.glowEffect}></div>
            <img
              src="/lovable-uploads/780d2c8c-fcf5-4c8c-a2ca-d606c30f7215.png"
              alt="Pauli 'The Polyglot' - Comic Style"
              className={`relative w-80 h-80 md:w-96 md:h-96 object-contain max-w-full rounded-2xl border-4 border-yellow-400 transition-all duration-700 group-hover:scale-110 group-hover:rotate-2 drop-shadow-2xl ${
                imageLoaded ? 'opacity-100 animate-fade-in' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {/* Crime Scene Tape Effect */}
            <div className="absolute -top-4 -left-4 -right-4 h-8 bg-yellow-400 text-black text-xs font-bold flex items-center justify-center transform -rotate-3 shadow-lg">
              ⚠️ DIGITAL CRIME SCENE - DO NOT CROSS ⚠️
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-left max-w-2xl">
            <h1 className={styles.heroTitle}>
              THE PAULI EFFECT
            </h1>
            <p className={styles.heroSubtitle}>
              Notorious web developer and polyglot mastermind operating from 1111 Pauli's Place.
              <span className="block text-red-300 italic mt-4 text-lg">
                "Every website is a heist, every line of code is evidence."
              </span>
            </p>

            {/* Wanted Poster Style Info */}
            <div className="bg-black/80 p-6 rounded-lg border-2 border-yellow-400 mb-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-yellow-400 font-bold text-xl">WANTED FOR:</h3>
                <div className="text-red-400 font-mono text-sm">CASE #1111</div>
              </div>
              <ul className="text-yellow-200 space-y-2">
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">•</span>
                  Building impossible websites that convert
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">•</span>
                  Speaking 17+ programming languages fluently
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">•</span>
                  Making clients dangerously successful
                </li>
                <li className="flex items-center">
                  <span className="text-red-400 mr-2">•</span>
                  Operating the smoothest sales funnel in the underground
                </li>
              </ul>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                data-scrollto="#menu-section"
                className={styles.heroButton}
              >
                🎷 Enter The Speakeasy
              </button>
              <button 
                className="bg-black/80 hover:bg-black text-[#ffe36e] px-8 py-4 rounded-lg font-bold transition-all duration-300 hover:scale-105 border-2 border-yellow-400 hover:border-red-400 text-lg tracking-wide"
                id="make-me-a-funnel"
              >
                🔥 Commission A Heist
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 text-center sm:text-left">
              <p className="text-yellow-400/60 text-sm mb-2">TRUSTED BY DIGITAL OUTLAWS WORLDWIDE</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-neutral-400">
                <span>• 500+ Successful Operations</span>
                <span>• Zero Detection Rate</span>
                <span>• 24/7 Underground Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauliHero;
