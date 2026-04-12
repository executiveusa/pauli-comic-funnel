import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, BookOpen, Upload } from 'lucide-react';
import { CavemenToggle } from './CavemenToggle';

export const MainNav: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white hover:text-blue-400 transition">
            <span className="text-2xl">🧠</span>
            PAULI
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-300 hover:text-white transition">
              Home
            </Link>
            <Link to="/dashboard" className="text-slate-300 hover:text-white transition">
              Dashboard
            </Link>
            <Link to="/wiki" className="text-slate-300 hover:text-white transition flex items-center gap-1">
              <BookOpen size={18} />
              Wiki
            </Link>
            <Link to="/upload" className="text-slate-300 hover:text-white transition flex items-center gap-1">
              <Upload size={18} />
              Upload
            </Link>
            <CavemenToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <CavemenToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="main-nav-mobile-menu"
              className="p-2 text-slate-300 hover:text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div id="main-nav-mobile-menu" className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded transition"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded transition"
            >
              Dashboard
            </Link>
            <Link
              to="/wiki"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded transition flex items-center gap-2"
            >
              <BookOpen size={18} />
              Wiki
            </Link>
            <Link
              to="/upload"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-slate-300 hover:bg-slate-700 rounded transition flex items-center gap-2"
            >
              <Upload size={18} />
              Upload
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
