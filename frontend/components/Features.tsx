"use client";
import { motion } from "framer-motion";
import { Calendar, Target, Users, BookOpen, CreditCard, TrendingUp } from "lucide-react";

const features = [
  { icon: Calendar, title: "Daily Validated Ideas", desc: "Fresh batch of AI-vetted SaaS ideas every 24 hours." },
  { icon: Target, title: "Demand Scoring", desc: "Proprietary algorithm that calculates exact market readiness." },
  { icon: Users, title: "Real-world Proof", desc: "Direct links to source complaints on Reddit and Twitter." },
  { icon: BookOpen, title: "AI MVP Plans", desc: "Step-by-step technical blueprints for every idea." },
  { icon: CreditCard, title: "Monetization Insights", desc: "Pricing models tailored to the target audience." },
  { icon: TrendingUp, title: "Market Tracking", desc: "Track macro trends before they become obvious." }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-neutral-950 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to execute</h2>
          <p className="text-neutral-400 text-lg">Stop doubting. We give you the data to build with confidence.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass p-6 rounded-2xl transition-all cursor-pointer hover:border-orange-500/30 group"
            >
              <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
