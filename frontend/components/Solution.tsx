"use client";
import { motion } from "framer-motion";
import { Search, Brain, Zap, BarChart2 } from "lucide-react";

const steps = [
  { icon: Search, title: "1. Collect real problems", desc: "We scan Reddit, X, and forums for complaints." },
  { icon: Brain, title: "2. AI detects pain points", desc: "Our models filter out noise and find real pain." },
  { icon: Zap, title: "3. Converts to SaaS ideas", desc: "Pain points are bundled into actionable products." },
  { icon: BarChart2, title: "4. Ranks by demand", desc: "We score each idea based on willingness to pay." }
];

export function Solution() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">How IdeaForge works</h2>
            <p className="text-neutral-400 text-lg mb-8">We reversed the process. Instead of starting with an idea, we start with millions of real world problems and let AI find the perfect solution for you.</p>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 glass rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-neutral-400">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="glass rounded-3xl p-8 border border-white/10 relative"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-3xl pointer-events-none" />
             <div className="space-y-6 relative z-10">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 animate-pulse flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-neutral-800" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-neutral-700/50 rounded w-3/4" />
                     <div className="h-3 bg-neutral-800 rounded w-1/2" />
                   </div>
                 </div>
               ))}
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
