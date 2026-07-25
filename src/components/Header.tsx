import React from 'react';
import { Calendar, CheckCircle2, LayoutDashboard, Search, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'book' | 'lookup' | 'dashboard';
  setActiveTab: (tab: 'book' | 'lookup' | 'dashboard') => void;
  resetBookingFlow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, resetBookingFlow }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Title */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setActiveTab('book');
              if (resetBookingFlow) resetBookingFlow();
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">AppointDesk</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Conflict Check
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Interactive Booking & Scheduling Portal
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setActiveTab('book');
                if (resetBookingFlow) resetBookingFlow();
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'book'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Slot</span>
            </button>

            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'lookup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">My Booking</span>
              <span className="sm:hidden">Find</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-indigo-400 border-indigo-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800 border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Host Admin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
