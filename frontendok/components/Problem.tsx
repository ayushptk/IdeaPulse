"use client";
import { motion } from "framer-motion";
import { Frown, Clock, XCircle } from "lucide-react";

const problems = [
  { icon: Frown, title: "Don't know what to build?", desc: "Staring at a blank screen hoping for inspiration." },
  { icon: Clock, title: "Wasting months on useless ideas?", desc: "Building things nobody actually wants to pay for." },
  { icon: XCircle, title: "No validation?", desc: "Launching to crickets because there was no real demand." }
];

export function Problem() {
  return (
    <section className="py-24 relative border-t border-white/5 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">The old way is broken.</h2>
          <p className="text-neutral-400 text-lg">Building a successful SaaS should not rely on luck.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((prob, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-2xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6">
                <prob.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{prob.title}</h3>
              <p className="text-neutral-400">{prob.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
