
import { useState } from 'react';

const PauliFooter = () => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <footer className="relative bg-gradient-to-t from-black via-slate-900 to-slate-800 py-16 border-t-4 border-yellow-400">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cpath d="M0 0L50 50L0 100M50 0L100 50L50 100" stroke="%23ffd700" stroke-width="1" fill="none"/%3E%3C/svg%3E')] bg-repeat"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Cadillac Image */}
        <div className="mb-12 flex justify-center">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-yellow-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img
              src="/pauli-car.png"
              alt="Pauli's Red Cadillac at 1111 Pauli's Place"
              className={`relative max-w-md w-full h-auto object-contain rounded-lg border-2 border-red-400 transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100 animate-fade-in' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>

        {/* Footer Text */}
        <div className="space-y-6">
          <h3 className="text-3xl font-bold text-red-400 tracking-wider">
            GETAWAY VEHICLE SECURED
          </h3>
          <p className="text-xl text-yellow-300 max-w-2xl mx-auto leading-relaxed">
            "Every job needs an escape plan. Every website needs a launch strategy."
          </p>
          
          {/* Contact Info */}
          <div className="bg-black/50 p-6 rounded-lg border border-yellow-400 max-w-lg mx-auto">
            <p className="text-yellow-400 font-bold mb-2">HEADQUARTERS:</p>
            <p className="text-yellow-200">1111 Pauli's Place</p>
            <p className="text-yellow-200">Where Code Meets Crime</p>
            <p className="text-red-300 mt-4 italic">
              "Menu prepared by Hexona Kitchen™. All orders served hot and built to last."
            </p>
          </div>

          {/* Warning */}
          <div className="border-2 border-red-500 bg-red-900/20 p-4 rounded-lg max-w-md mx-auto">
            <p className="text-red-400 font-bold text-sm">⚠️ WARNING</p>
            <p className="text-red-200 text-sm mt-1">
              Side effects may include: Increased web traffic, customer satisfaction, and business growth.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-yellow-400/30">
          <p className="text-yellow-400/60 text-sm">
            © 2024 The Pauli Effect - Hexona Systems™. All heists crimes websites are protected by international law.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PauliFooter;
