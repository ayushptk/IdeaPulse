"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, ArrowUpRight, Loader2 } from "lucide-react";
import { SavedIdea } from "@/hooks/useSavedIdeas";

export function LiveIdeaPreview() {
  const [idea, setIdea] = useState<SavedIdea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/ideas?limit=1")
      .then((res) => res.json())
      .then((data) => {
        let allIdeas: SavedIdea[] = [];
        data.forEach((platformData: { ideas: SavedIdea[] }) => {
          allIdeas = [...allIdeas, ...platformData.ideas];
        });
        
        allIdeas.sort((a, b) => (b.score || 0) - (a.score || 0));
        if (allIdeas.length > 0) {
          setIdea(allIdeas[0]);
        }
        setLoading(false);
      })
      .catch(() => {

        setLoading(false);
      });
  }, []);

  return (
    <section id="live-ideas" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Sneak peek at our database</h2>
          <p className="text-neutral-400 text-lg">Real ideas pulled from today&apos;s data.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass rounded-3xl p-1 md:p-2 border border-white/10 glow"
        >
          <div className="bg-black/80 rounded-[20px] p-6 md:p-8 backdrop-blur-xl min-h-[300px] flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-neutral-500 py-12">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Pulling latest idea from database...</p>
              </div>
            ) : idea ? (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
                  <div className="flex flex-wrap gap-3 items-center text-sm text-neutral-400">
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3" /> High Demand
                    </span>
                    <span>Demand Score: {Math.round((idea.score || 0) * 10)}/100</span>
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">
                    Source: {idea.platform}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-2">The Problem</h4>
                    <p className="text-lg text-white font-medium italic border-l-4 border-[#fb611e] pl-4 py-1 line-clamp-3"> 
                      {idea.problem}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-2">The SaaS Idea</h4>
                    <h3 className="text-2xl font-bold text-white mb-2">{idea.idea_name || idea.idea || "SaaS Idea"}</h3>
                    {idea.solution && idea.solution !== idea.idea && (
                      <p className="text-neutral-400 mb-6">{idea.solution}</p>
                    )}
                    
                    {Array.isArray(idea.features || idea.core_features) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {(idea.features || idea.core_features || [])
                          .slice(0, 4)
                          .map((feature: string, i: number) => (
                            <div key={i} className="glass p-3 rounded-xl flex items-center justify-center text-center">
                              <div className="text-xs text-neutral-300 font-medium line-clamp-2">{feature}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <a href="/dashboard" className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                      View Full MVP Blueprint <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-neutral-500 py-12">
                No ideas available in the database right now.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
