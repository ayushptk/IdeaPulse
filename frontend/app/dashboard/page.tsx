"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, TrendingUp, Clock, Bookmark, ChevronUp, Share2, Compass, Activity, X } from 'lucide-react';

const categories = ['All Ideas', 'Reddit', 'ProductHunt', 'HackerNews', 'LinkedIn', 'IndieHackers'];

// Skeleton for Idea Card
const IdeaSkeleton = () => (
  <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 h-full flex flex-col shadow-lg animate-pulse">
    <div className="flex justify-between items-start mb-5">
      <div className="flex gap-2">
        <div className="w-12 h-5 bg-white/10 rounded-md"></div>
        <div className="w-16 h-5 bg-white/10 rounded-md"></div>
      </div>
      <div className="w-10 h-8 bg-white/10 rounded-md"></div>
    </div>
    <div className="w-full h-4 bg-white/10 rounded-md mb-3"></div>
    <div className="w-5/6 h-4 bg-white/10 rounded-md mb-3"></div>
    <div className="w-2/3 h-4 bg-white/10 rounded-md mb-8"></div>
    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between">
      <div className="w-20 h-6 bg-white/10 rounded-md"></div>
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-white/10 rounded-md"></div>
        <div className="w-8 h-8 bg-white/10 rounded-md"></div>
      </div>
    </div>
  </div>
);

// Skeleton for Trending Problem
const TrendingSkeleton = () => (
  <div className="flex items-start gap-4 p-5 border-b border-white/5 animate-pulse">
    <div className="w-14 h-14 bg-white/10 rounded-xl shrink-0"></div>
    <div className="flex-1 pt-1 space-y-2">
      <div className="w-full h-3 bg-white/10 rounded"></div>
      <div className="w-4/5 h-3 bg-white/10 rounded"></div>
    </div>
  </div>
);

// Skeleton for Live Feed
const FeedSkeleton = () => (
  <div className="pb-5 border-b border-white/5 animate-pulse">
    <div className="flex justify-between items-center mb-3">
      <div className="w-10 h-4 bg-white/10 rounded"></div>
      <div className="w-16 h-3 bg-white/10 rounded"></div>
    </div>
    <div className="w-full h-3 bg-white/10 rounded mb-2"></div>
    <div className="w-3/4 h-3 bg-white/10 rounded"></div>
  </div>
);

const PLATFORM_COLORS: Record<string, string> = {
  reddit: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  producthunt: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  hn: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  linkedin: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  indiehackers: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function Dashboard() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Ideas');
  const [selectedIdea, setSelectedIdea] = useState<any>(null);

  const fetchIdeas = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/v1/ideas?limit=10')
      .then(res => res.json())
      .then(data => {
        let allIdeas: any[] = [];
        data.forEach((platformData: any) => {
          allIdeas = [...allIdeas, ...platformData.ideas];
        });
        
        allIdeas.sort((a, b) => b.score - a.score);
        setIdeas(allIdeas);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch ideas:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  // Filter ideas based on active category
  const filteredIdeas = activeCategory === 'All Ideas' 
    ? ideas 
    : ideas.filter(idea => {
        const p = idea.platform.toLowerCase();
        const c = activeCategory.toLowerCase();
        if (c === 'hackernews' && p === 'hn') return true;
        return p === c;
      });

  // Extract top trending problems from the highest scored ideas
  const trendingProblems = [...ideas]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // Extract latest ideas for live feed
  const newIdeas = [...ideas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Discover Ideas</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl leading-relaxed">Top validated SaaS problems and ideas for today, extracted from thousands of social signals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchIdeas}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 group"
          >
            <Activity className={`w-4 h-4 text-indigo-400 transition-colors ${loading ? 'animate-spin' : 'group-hover:text-indigo-300'}`} />
            {loading ? 'Syncing...' : 'Live Sync'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
            <Compass className="w-4 h-4" />
            Random Idea
          </button>
        </div>
      </div>

      {/* Categories / Tags Section */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <button 
            key={i}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeCategory === cat 
                ? 'bg-white text-black border-white shadow-md' 
                : 'bg-transparent text-slate-300 hover:bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Column: Daily Top Ideas */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Daily Top Ideas</h2>
            </div>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              View all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              <>
                <IdeaSkeleton />
                <IdeaSkeleton />
                <IdeaSkeleton />
                <IdeaSkeleton />
              </>
            ) : filteredIdeas.length > 0 ? (
              filteredIdeas.slice(0, 6).map((idea, idx) => (
                <div key={idea.id || idx} onClick={() => setSelectedIdea(idea)} className="cursor-pointer bg-[#121214] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 group relative overflow-hidden flex flex-col h-full shadow-lg">
                  {/* Soft gradient bg effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${PLATFORM_COLORS[idea.platform?.toLowerCase()] || 'bg-white/5 text-slate-300 border-white/5'}`}>
                        {idea.platform}
                      </span>
                      {idea.features?.slice(0, 1).map((feature: string, i: number) => (
                        <span key={i} className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 bg-white/5 text-slate-300 rounded-md border border-white/5 truncate max-w-[100px]">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-4">
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 leading-none">
                        {Math.round(idea.score * 10)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score</span>
                    </div>
                  </div>
                  
                  <h3 className="text-base font-semibold text-slate-100 leading-relaxed mb-3 relative z-10 flex-1 line-clamp-3">
                    {idea.problem}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-white/10 uppercase">
                        {idea.platform?.[0] || '?'}
                      </div>
                      <span className="text-xs text-slate-400 font-medium capitalize">{idea.platform}</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-slate-400">No ideas found for this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trending & New */}
        <div className="space-y-8">
          {/* Trending Problems */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-400" />
                <h2 className="text-xl font-semibold text-white">Trending Problems</h2>
              </div>
              <Link href="/dashboard/trending" className="text-sm text-rose-400 hover:text-rose-300 font-medium transition-colors">
                View all
              </Link>
            </div>
            <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden shadow-lg">
              {loading ? (
                <>
                  <TrendingSkeleton />
                  <TrendingSkeleton />
                  <TrendingSkeleton />
                  <TrendingSkeleton />
                </>
              ) : trendingProblems.length > 0 ? (
                trendingProblems.map((idea, i) => (
                  <div key={idea.id || i} onClick={() => {
                    const id = idea.id || encodeURIComponent(idea.problem?.slice(0, 40));
                    sessionStorage.setItem(`trending_${id}`, JSON.stringify(idea));
                    router.push(`/dashboard/trending/${id}`);
                  }} className={`flex items-start gap-4 p-5 hover:bg-white/5 transition-colors cursor-pointer group ${i !== trendingProblems.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="flex flex-col items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors rounded-xl w-14 h-14 shrink-0 border border-white/5">
                      <ChevronUp className="w-4 h-4 text-emerald-400 mb-0.5" />
                      <span className="text-xs font-bold text-slate-300">{Math.round(idea.score * 10)}</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h4 className="text-sm font-medium text-slate-300 group-hover:text-white leading-snug transition-colors line-clamp-2">{idea.problem}</h4>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 text-center text-slate-400 text-sm">No trending problems.</div>
              )}
            </div>
          </div>

          {/* Live Feed */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Live Feed</h2>
            </div>
            <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 space-y-5 shadow-lg">
              {loading ? (
                <>
                  <FeedSkeleton />
                  <FeedSkeleton />
                  <FeedSkeleton />
                  <FeedSkeleton />
                </>
              ) : newIdeas.length > 0 ? (
                newIdeas.map((idea, i) => (
                  <div key={idea.id || i} onClick={() => setSelectedIdea(idea)} className={`group cursor-pointer ${i !== newIdeas.length - 1 ? 'pb-5 border-b border-white/5' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {idea.platform}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {idea.created_at ? formatTimeAgo(idea.created_at) : 'Just now'}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-relaxed line-clamp-2">
                      {idea.idea.includes('AI-powered solution') ? idea.problem : idea.idea}
                    </h4>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-sm">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedIdea(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8 space-y-6">
              <div className="flex gap-2 items-center mb-2">
                <span className={`text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${PLATFORM_COLORS[selectedIdea.platform?.toLowerCase()] || 'bg-white/5 text-slate-300 border-white/5'}`}>
                  {selectedIdea.platform}
                </span>
                <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  Score: {Math.round(selectedIdea.score * 10)}
                </span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {selectedIdea.idea_name || selectedIdea.idea || "SaaS Idea"}
                </h2>
                {selectedIdea.solution && selectedIdea.solution !== selectedIdea.idea && (
                   <p className="text-indigo-300 font-medium">{selectedIdea.solution}</p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">The Problem</h3>
                  <p className="text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {selectedIdea.problem}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Audience</h3>
                  <p className="text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {selectedIdea.users || selectedIdea.target_customer || "General audience"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Core Features</h3>
                  <ul className="grid grid-cols-1 gap-2">
                    {(selectedIdea.features || selectedIdea.core_features || []).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Monetization</h3>
                  <p className="text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {selectedIdea.monetization || selectedIdea.monetization_model || "Not specified"}
                  </p>
                </div>

                {(selectedIdea.why_this_will_work || selectedIdea.competitor_gap) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedIdea.why_this_will_work && (
                       <div>
                          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Why it works</h3>
                          <p className="text-slate-200 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 h-full">
                            {selectedIdea.why_this_will_work}
                          </p>
                       </div>
                     )}
                     {selectedIdea.competitor_gap && (
                       <div>
                          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Competitor Gap</h3>
                          <p className="text-slate-200 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 h-full">
                            {selectedIdea.competitor_gap}
                          </p>
                       </div>
                     )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
