
import React, { useState, useEffect } from 'react';
import { styles } from '@/styles/pauli-styles';

const PauliFooter = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Scroll to top functionality
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollButton = document.getElementById('scroll-to-top');
    if (scrollButton) {
      scrollButton.addEventListener('click', scrollToTop);
      return () => scrollButton.removeEventListener('click', scrollToTop);
    }
  }, []);

  return (
    <footer className="relative bg-gradient-to-t from-black via-[#1a1917] to-[#1c1b18] py-20 border-t-4 border-yellow-400">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,215,0,0.1)_90deg,transparent_180deg)]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Getaway Vehicle Section */}
        <div className="text-center mb-16">
          <div className="relative group cursor-pointer inline-block">
            <div className="absolute -inset-6 bg-gradient-to-r from-red-500/20 to-yellow-500/20 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <img
              src="/lovable-uploads/780d2c8c-fcf5-4c8c-a2ca-d606c30f7215.png"
              alt="Pauli's Getaway Vehicle"
              className={`relative max-w-sm w-full h-auto object-contain rounded-lg border-2 border-red-400 transition-all duration-500 group-hover:scale-105 drop-shadow-xl ${
                imageLoaded ? 'opacity-100 animate-fade-in' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <h3 className="text-4xl font-bold text-red-400 tracking-wider mt-8 mb-4">
            GETAWAY VEHICLE SECURED
          </h3>
          <p className="text-xl text-yellow-300 max-w-2xl mx-auto leading-relaxed italic">
            "Every job needs an escape plan. Every website needs a launch strategy."
          </p>
        </div>

        {/* Contact & Payment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact HQ */}
          <div className="bg-black/50 p-6 rounded-lg border border-yellow-400 backdrop-blur-sm">
            <h4 className="text-yellow-400 font-bold mb-4 text-lg tracking-wider">HEADQUARTERS:</h4>
            <div className="space-y-2 text-yellow-200">
              <p>📍 1111 Pauli's Place</p>
              <p>🌃 Where Code Meets Crime</p>
              <p>☕ Open 24/7 for Digital Heists</p>
              <p className="text-red-300 mt-4 italic text-sm border-t border-yellow-400/30 pt-3">
                "Menu prepared by Hexona Kitchen™"
              </p>
            </div>
          </div>

          {/* Crypto Tipping */}
          <div className="bg-black/50 p-6 rounded-lg border border-yellow-400 backdrop-blur-sm text-center">
            <h4 className="text-yellow-400 font-bold mb-4 text-lg tracking-wider">TIP THE CHEF:</h4>
            <div className="bg-white p-4 rounded-lg mb-4">
              <div className="w-32 h-32 mx-auto bg-gray-800 rounded flex items-center justify-center text-white text-xs">
                QR CODE
                <br />
                BTC/ETH
                <br />
                COFFEE COIN
              </div>
            </div>
            <p className="text-yellow-200 text-sm">
              BTC • ETH • CoffeeBean Coin accepted
            </p>
          </div>

          {/* Contact Form */}
          <div className="bg-black/50 p-6 rounded-lg border border-yellow-400 backdrop-blur-sm">
            <h4 className="text-yellow-400 font-bold mb-4 text-lg tracking-wider">SECURE CONTACT:</h4>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="agent@yourcompany.com"
                className="w-full bg-black/70 border border-yellow-400/50 rounded px-3 py-2 text-yellow-200 placeholder-yellow-400/50 focus:border-yellow-400 transition-colors"
              />
              <button className="w-full bg-gradient-to-r from-yellow-400 to-red-500 text-black font-bold py-2 px-4 rounded hover:scale-105 transition-transform">
                🔐 Send Encrypted Message
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="border-2 border-red-500 bg-red-900/20 p-6 rounded-lg max-w-2xl mx-auto mb-12 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-red-400 font-bold text-lg mb-2">⚠️ LEGAL DISCLAIMER ⚠️</p>
            <p className="text-red-200 text-sm leading-relaxed">
              Side effects may include: Dramatic increase in web traffic, 
              dangerously high customer satisfaction rates, and explosive business growth. 
              The Pauli Effect is not responsible for competitors' jealousy or sudden success addiction.
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-yellow-400/30">
          <div className="text-center md:text-left">
            <p className="text-yellow-400 font-bold mb-2">QUICK ESCAPE ROUTES:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <button 
                id="scroll-to-top"
                className="text-yellow-200 hover:text-yellow-400 transition-colors cursor-pointer border border-yellow-400/30 px-3 py-1 rounded hover:border-yellow-400"
              >
                ↑ Back to Top
              </button>
              <a href="mailto:pauli@hexona.systems" className="text-yellow-200 hover:text-yellow-400 transition-colors border border-yellow-400/30 px-3 py-1 rounded hover:border-yellow-400">
                📧 Emergency Contact
              </a>
              <button className="text-yellow-200 hover:text-yellow-400 transition-colors border border-yellow-400/30 px-3 py-1 rounded hover:border-yellow-400">
                🌙 Night Mode
              </button>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center text-sm text-neutral-400">
            <p className="mb-1">⭐⭐⭐⭐⭐ Rated by Digital Outlaws Worldwide</p>
            <p>"The smoothest operator in the web development underground"</p>
          </div>
        </div>

        {/* Final Copyright */}
        <div className="text-center mt-12 pt-6 border-t border-yellow-400/20">
          <p className="text-neutral-400 text-sm leading-relaxed">
            © 2024 The Pauli Effect - Hexona Systems™. All heists websites are protected by international law.
            <br />
            <span className="text-yellow-400/60">Operating License #1111 • Fugitive Status: Active • Espresso Level: Maximum</span>
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 right-10">
        <div className="text-6xl animate-bounce opacity-20">☕</div>
      </div>
    </footer>
  );
};

export default PauliFooter;
