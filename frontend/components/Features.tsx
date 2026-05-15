"use client";
import { motion } from "framer-motion";
import { 
  Signal, Wifi, Battery, ChevronLeft, Share, MoreHorizontal, 
  SlidersHorizontal, LayoutGrid, Link2, Table, Check, MessageSquare
} from "lucide-react";
import { FaRedditAlien } from "react-icons/fa6";
import { FaProductHunt } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaHackerNews } from "react-icons/fa";


interface FloatingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}

const FloatingCard = ({ icon: Icon, title, description, className, delay = 0 }: FloatingCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className={`absolute bg-neutral-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(255,255,255,0.02)] border border-neutral-800 flex flex-col items-center text-center w-[220px] ${className}`}
  >
    <div className="w-12 h-12 flex justify-center items-center rounded-xl bg-neutral-800 border border-neutral-700 mb-4 text-neutral-300 shadow-sm">
      <Icon className="w-5 h-5 stroke-[1.5]" />
    </div>
    <h4 className="font-semibold text-[14px] text-white mb-2">{title}</h4>
    <p className="text-[12px] text-neutral-400 leading-relaxed">{description}</p>
  </motion.div>
);

export function Features() {
  return (
    <section id="features" className="py-24 bg-black overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center mb-16 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-6 font-serif"
          >
            Powerful features <br className="hidden md:block" />
            at {" "}
            <span className="relative whitespace-nowrap inline-block">
              <span className="relative z-10">ideaForgeAi</span>
              <span className="absolute left-0 bottom-1 w-full h-3 bg-[#cbf238] -z-10 rounded-sm"></span>
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 max-w-lg mx-auto text-[15px] md:text-base"
          >
            IdeaForge gives instant access to market data, pain points, and competitor analysis for a streamlined validation workflow.
          </motion.p>
        </div>

        {/* Desktop Interactive Demo Section */}
        <div className="relative w-full h-[700px] hidden lg:flex justify-center items-center mt-12 z-0">
          
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neutral-900/50 rounded-full blur-3xl -z-20 opacity-50"></div>

          {/* Center Mockup App Wrap */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-[320px] h-[580px] bg-neutral-950 border-[6px] border-neutral-900 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-neutral-800"
          >
            {/* Status Bar */}
            <div className="flex justify-between items-center w-full px-5 py-3">
              <span className="text-[12px] font-semibold text-white">9:41</span>
              <div className="flex gap-1.5 items-center">
                <Signal className="w-3.5 h-3.5 text-white" />
                <Wifi className="w-3.5 h-3.5 text-white" />
                <Battery className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="px-4 pb-4 flex-1 flex flex-col">
              {/* App Nav */}
              <div className="flex justify-between items-center mb-6 text-neutral-400">
                <ChevronLeft className="w-5 h-5" />
                <div className="flex gap-4">
                  <Share className="w-4 h-4" />
                  <MoreHorizontal className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Skeletons */}
              <div className="mb-6">
                <h3 className="font-semibold text-[17px] leading-snug text-white tracking-tight">
                  SaaS Validation for Q3 2026
                </h3>
                <div className="w-[85%] h-2.5 bg-neutral-800 rounded-full mt-3" />
                <div className="w-[60%] h-2.5 bg-neutral-800 rounded-full mt-2" />
                <div className="w-full h-px bg-neutral-800/80 mt-6" />
              </div>

              {/* App Content Grid */}
              <div className="flex flex-col gap-3 flex-1 pb-2">
                
                {/* Top Row */}
                <div className="flex gap-3 h-28">
                  {/* Item 1 */}
                  <div className="flex-1 bg-neutral-900 rounded-2xl p-3 flex flex-col justify-center items-center">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-900/40 to-neutral-800 rounded-lg mb-2 shadow-sm flex items-center justify-center rotate-[-10deg]">
                      <FaRedditAlien className="text-red-500 w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-300">Reddit</span>
                  </div>
                  {/* Item 2 */}
                  <div className="flex-1 bg-neutral-900 rounded-2xl p-3 flex flex-col justify-center items-center">
                    <div className="w-full flex-1 flex items-center justify-center">
                      <FaProductHunt className="text-red-500 w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-300 mt-2">Product Hunt</span>
                  </div>
                  
                </div>
                  <div className="flex-1 bg-neutral-900 rounded-2xl p-3 flex flex-col justify-center items-center">
                    <div className="w-full flex-1 flex items-center justify-center">
                      <FaLinkedin className="text-red-500 w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-300 mt-2">Linkedin</span>
                  </div>
                  
                  

                {/* Bottom Row */}
                <div className="flex gap-2 h-24">
                  {/* Cover */}
                  {/* Backdrop */}
                  {/* Doc Color */}
                 
                </div>
              </div>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-neutral-700 rounded-full"></div>
          </motion.div>

          {/* Floating Left Cards */}
          <FloatingCard 
            icon={SlidersHorizontal}
            title="Validation Score"
            description="Algorithm dynamically calculates exact market readiness."
            className="left-[0%] top-[12%]"
            delay={0.2}
          />
          <FloatingCard 
            icon={LayoutGrid}
            title="AI Blueprints"
            description="Get complete technical execution plans instantly."
            className="left-[0%] bottom-[12%]"
            delay={0.3}
          />

          {/* Floating Right Cards */}
          <FloatingCard 
            icon={Link2}
            title="Source Proof"
            description="Direct links to real complaints and market data."
            className="right-[0%] top-[15%]"
            delay={0.4}
          />
          <FloatingCard 
            icon={Table}
            title="Trend Tracking"
            description="Track micro trends early before they become mainstream."
            className="right-[0%] bottom-[15%]"
            delay={0.5}
          />

          {/* Floating Badges */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -8 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, type: "spring" }}
            className="absolute left-[200px] xl:left-[240px] top-[45%] w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl flex items-center justify-center z-10"
          >
            <span className="text-2xl font-bold text-white tracking-tighter">24</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 12 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, type: "spring" }}
            className="absolute right-[210px] xl:right-[250px] top-[25%] w-14 h-14 bg-neutral-800 border border-neutral-700 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] flex items-center justify-center z-20"
          >
            <Check className="w-6 h-6 text-white" strokeWidth={3} />
          </motion.div>

        </div>

        {/* Mobile Layout Fallback */}
        <div className="flex lg:hidden flex-col gap-6 w-full max-w-sm mx-auto">
          {/* Simple grid for mobile instead of floating cards */}
          <div className="grid grid-cols-1 gap-6">
            <FloatingCard 
              icon={SlidersHorizontal}
              title="Validation Score"
              description="Algorithm dynamically calculates exact market readiness."
              className="relative w-full shadow-md"
            />
             <FloatingCard 
              icon={Link2}
              title="Source Proof"
              description="Direct links to real complaints and market data."
              className="relative w-full shadow-md"
            />
            <FloatingCard 
              icon={LayoutGrid}
              title="AI Blueprints"
              description="Get complete technical execution plans instantly."
              className="relative w-full shadow-md"
            />
            <FloatingCard 
              icon={Table}
              title="Trend Tracking"
              description="Track micro trends early before they become mainstream."
              className="relative w-full shadow-md"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
