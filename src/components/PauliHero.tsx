
import React, { useState } from 'react';
import { styles } from '@/styles/pauli-styles';

const PauliHero = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={styles.heroContainer}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,0,0.1)_10px,rgba(255,255,0,0.1)_20px)]"></div>
      </div>
      
      <div className={styles.heroContent}>
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          <div className={styles.heroImageWrapper} id="pauli-anim">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <img
              src="/lovable-uploads/780d2c8c-fcf5-4c8c-a2ca-d606c30f7215.png"
              alt="Pauli 'The Polyglot' - Comic Style"
              className={`relative w-64 h-64 md:w-80 md:h-80 object-contain max-w-full rounded-full border-4 border-yellow-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 drop-shadow-2xl ${
                imageLoaded ? 'opacity-100 animate-fade-in' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="text-left max-w-lg">
            <h2 className={styles.heroTitle}>
              THE PAULI EFFECT
            </h2>
            <p className={styles.heroSubtitle}>
              Notorious web developer and polyglot mastermind. 
              <span className="block text-red-300 italic">
                "Every website is a heist, every line of code is evidence."
              </span>
            </p>
            <div className="bg-black/50 p-4 rounded-lg border border-yellow-400">
              <p className="text-yellow-400 font-bold text-lg">WANTED FOR:</p>
              <ul className="text-yellow-200 mt-2 space-y-1">
                <li>• Building impossible websites</li>
                <li>• Speaking 17 programming languages</li>
                <li>• Making clients too successful</li>
              </ul>
            </div>
            
            <div className="mt-6">
              <button 
                data-scrollto="#menu-section"
                className={styles.heroButton}
              >
                Enter The Speakeasy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauliHero;
