"use client";
import { motion } from "framer-motion";


export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-orange-600/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-orange-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.h2 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white"
        >
          Ready to build something people want?
        </motion.h2>
        <motion.p
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.1 }}
           className="text-xl text-neutral-300 mb-10 max-w-2xl mx-auto"
        >
          Join 5,000+ founders skipping the vanity stage and launching products with proven demand.
        </motion.p>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
        >
          <button className="bg-[#fb611e] hover:bg-[#ff7a3d] text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-[0_0_20px_rgba(251,97,30,0.3)] hover:shadow-[0_0_40px_rgba(251,97,30,0.6)]">
            Start Your Free Trial
          </button>
        </motion.div>
      </div>
    </section>
  );
}
