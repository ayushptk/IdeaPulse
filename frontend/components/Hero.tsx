"use client";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";
import { PlatformStrip } from "@/components/PlatformStrip";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[600px] opacity-30 pointer-events-none z-0">
        <GlobeCdn />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 text-sm text-neutral-300"
        >
         
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-semibold tracking-tight mb-8"
        >
          Stop guessing. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
            Start building validated ideas.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 text-balance"
        >
          Discover validated SaaS ideas extracted directly from real-world problems in seconds. Let AI do the hard work of market research.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="#pricing" className="flex items-center gap-2 bg-[#fb611e] hover:bg-[#ff7a3d] text-white px-8 py-4 rounded-full font-medium transition-all shadow-[0_0_20px_rgba(251,97,30,0.3)] hover:shadow-[0_0_30px_rgba(251,97,30,0.5)] w-full sm:w-auto justify-center">
            Get Ideas Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#live-ideas" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-full font-medium transition-all w-full sm:w-auto justify-center">
            <TrendingUp className="w-4 h-4" /> View Live Ideas
          </Link>
        </motion.div>

        {/* Platform strip — data sources banner */}
        <div className="mt-16">
          <PlatformStrip />
        </div>
      </div>
    </section>
  );
}
