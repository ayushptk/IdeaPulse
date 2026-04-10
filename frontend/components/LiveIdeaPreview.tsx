"use client";
import { motion } from "framer-motion";
import { Flame, ArrowUpRight } from "lucide-react";

export function LiveIdeaPreview() {
  return (
    <section id="live-ideas" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Sneak peek at our database</h2>
          <p className="text-neutral-400 text-lg">Real ideas pulled from today's data.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass rounded-3xl p-1 md:p-2 border border-white/10 glow"
        >
          <div className="bg-black/80 rounded-[20px] p-6 md:p-8 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
              <div className="flex flex-wrap gap-3 items-center text-sm text-neutral-400">
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3" /> High Demand
                </span>
                <span>Demand Score: 92/100</span>
              </div>
              <div className="text-xs text-neutral-500">Source: r/SaaS</div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-2">The Problem</h4>
                <p className="text-lg text-white font-medium italic border-l-4 border-[#fb611e] pl-4 py-1">
                  "I spend 4 hours a week manually reconciling Stripe invoices with my local tax agency format. None of the current tools handle regional EU taxes well for micro-startups."
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-2">The SaaS Idea</h4>
                <h3 className="text-2xl font-bold text-white mb-2">Stripe2Tax EU</h3>
                <p className="text-neutral-400 mb-6">A micro-SaaS that auto-syncs Stripe data and generates EU-compliant localized tax reports formatting automatically.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass p-4 rounded-xl">
                    <div className="text-xl font-bold text-white mb-1">$29/mo</div>
                    <div className="text-xs text-neutral-400">Suggested Pricing</div>
                  </div>
                  <div className="glass p-4 rounded-xl">
                    <div className="text-xl font-bold text-white mb-1">Easy</div>
                    <div className="text-xs text-neutral-400">Dev Complexity</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-white/10">
                <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  View Full MVP Blueprint <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
