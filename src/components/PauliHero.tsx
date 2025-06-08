
import React, { useState } from 'react';

const PauliHero = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-900 via-black to-red-900 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,0,0.1)_10px,rgba(255,255,0,0.1)_20px)]"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Pauli Image */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <img
              src="/pauli-header.png"
              alt="Pauli 'The Polyglot' - Wanted"
              className={`relative w-64 h-64 md:w-80 md:h-80 object-contain rounded-full border-4 border-yellow-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                imageLoaded ? 'opacity-100 animate-fade-in' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Hero Text */}
          <div className="text-left max-w-lg">
            <h2 className="text-4xl md:text-6xl font-bold text-red-400 mb-4 tracking-wider">
              THE PAULI EFFECT
            </h2>
            <p className="text-xl md:text-2xl text-yellow-300 mb-6 leading-relaxed">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauliHero;
