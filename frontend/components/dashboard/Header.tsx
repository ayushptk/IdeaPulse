"use client";

import { Search, Bell, Menu } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  
  const firstName = session?.user?.name?.split(' ')[0] || 'User';
  const avatarUrl = session?.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex';

  return (
    <header className="h-20 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search ideas, problems, or tags..." 
              className="block w-64 lg:w-96 pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-lg text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none"
            />
           
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
        </button>
        
        <div className="w-px h-6 bg-white/10 hidden md:block"></div>

        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-full p-1 pr-3 bg-white/5 border border-white/5">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800">
            {/* Using img tag to support external googleusercontent images without next.config.js whitelisting, or standard avatar */}
            <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-white leading-tight">{firstName}</p>
          </div>
        </button>
      </div>
    </header>
  );
}
