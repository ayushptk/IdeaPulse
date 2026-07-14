"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-neutral-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-neutral-400 text-lg">Invest in your next big idea for less than the cost of a coffee.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 border border-white/5 flex flex-col"
          >
            <h3 className="text-2xl font-bold mb-2">Explorer</h3>
            <p className="text-neutral-400 mb-6">Perfect for dipping your toes.</p>
            <div className="text-4xl font-bold mb-8">$0<span className="text-xl text-neutral-500 font-medium">/mo</span></div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-neutral-300">
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> 3 ideas generated per month</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> Basic demand scoring</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> 1 MVP plan preview</li>
            </ul>
            
            <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition cursor-pointer">
              Get Started for Free
            </button>
          </motion.div>

          {}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 border-[#fb611e]/50 border relative flex flex-col bg-orange-500/5 glow"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#fb611e] text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro Builder</h3>
            <p className="text-neutral-400 mb-6">Everything you need to find a winning idea.</p>
            <div className="text-4xl font-bold mb-8">$9<span className="text-xl text-neutral-500 font-medium">/mo</span></div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-neutral-300">
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> Unlimited idea generation</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> Advanced AI demand scoring</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> Infinite MVP technical plans</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> Access to Reddit/X source links</li>
              <li className="flex gap-3"><Check className="w-5 h-5 text-orange-400 shrink-0" /> Early trend alerts</li>
            </ul>
            
            <button className="w-full py-3 rounded-xl bg-[#fb611e] hover:bg-[#ff7a3d] text-white font-medium transition shadow-[0_0_15px_rgba(251,97,30,0.3)] hover:shadow-[0_0_25px_rgba(251,97,30,0.5)] cursor-pointer">
              Upgrade to Pro
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
