"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Compass, 
  TrendingUp,
  Bookmark,
  Settings, 
  LogOut,
  Sparkles
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Explore Ideas', href: '/dashboard/explore', icon: Compass },
  { name: 'Trending Problems', href: '/dashboard/trending', icon: TrendingUp },
  { name: 'Saved Ideas', href: '/dashboard/saved', icon: Bookmark },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-72 bg-[#09090b] text-slate-400 flex-col h-screen fixed top-0 left-0 border-r border-white/10 z-20">
      <div className="h-20 flex items-center px-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            IdeaForge
          </span>
        </div>
      </div>
      
      <div className="px-6 py-8">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</p>
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                )}
                <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-indigo-400' : 'group-hover:text-slate-300'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/5">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 mb-4 border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full"></div>
          <p className="text-sm font-medium text-white">IdeaForge Pro</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Unlock unlimited idea generation</p>
          <button className="w-full py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Upgrade Now
          </button>
        </div>
        
        <button className="flex items-center gap-3.5 px-4 py-2.5 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group">
          <LogOut className="w-5 h-5 group-hover:text-red-400" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
