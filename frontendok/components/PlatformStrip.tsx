"use client";
import { motion } from "framer-motion";

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const ProductHuntIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0m1.604 14.4H10.2V18H7.8V6h5.804a4.2 4.2 0 0 1 0 8.4" />
  </svg>
);

const HackerNewsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896z" />
  </svg>
);

const IndieHackersIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3 3h18v18H3V3zm2 2v14h5V5H5zm7 0v14h2V5h-2zm4 0v14h2V5h-2z" />
  </svg>
);

const QuoraIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12.555 18.858a5.364 5.364 0 0 1-1.165-1.856 6.95 6.95 0 0 1-.413-2.42C10.977 11.336 11.995 9 14.39 9c.85 0 1.551.262 2.08.77-.31-.09-.632-.136-.961-.136-1.592 0-2.438 1.36-2.438 3.948 0 2.57.846 4.038 2.478 4.038.35 0 .672-.065.96-.18-.535.508-1.24.778-2.094.778-.65 0-1.218-.144-1.727-.426l.685 1.248a8.077 8.077 0 0 0 2.027.258c1.204 0 2.26-.337 3.09-.945a6.68 6.68 0 0 0 2.13-6.41C20.277 9.2 17.37 6.75 14 6.75c-4.004 0-6.498 2.91-6.498 6.748 0 3.662 2.298 6.553 5.944 6.74l-.891 1.636C11.16 22.26 9.764 23 8.07 23 5.17 23 3 20.726 3 17.4c0-2.143 1.004-4.025 2.758-5.194A6.662 6.662 0 0 1 5.5 10.75C5.5 7.163 8.524 4 14 4c5.302 0 8.5 3.163 8.5 6.75 0 1.44-.454 2.774-1.268 3.872l.008.005A6.615 6.615 0 0 1 23 18.77C23 21.617 20.615 24 17.62 24c-1.965 0-3.688-.949-4.764-2.36l-.301-.782z" />
  </svg>
);

const platforms = [
  {
    name: "Reddit",
    icon: RedditIcon,
    color: "#FF4500",
    label: "r/entrepreneur",
  },
  {
    name: "Product Hunt",
    icon: ProductHuntIcon,
    color: "#DA552F",
    label: "Top Posts",
  },
  {
    name: "Hacker News",
    icon: HackerNewsIcon,
    color: "#FF6600",
    label: "Ask HN",
  },
  {
    name: "Indie Hackers",
    icon: IndieHackersIcon,
    color: "#0e7cfe",
    label: "Community",
  },
  {
    name: "Quora",
    icon: QuoraIcon,
    color: "#B92B27",
    label: "Spaces",
  },
];

export function PlatformStrip() {
  return (
    <div className="relative w-full py-8 overflow-hidden">
      {}
      <div className="flex items-center gap-4 max-w-4xl mx-auto px-6 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-white/20" />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">
          Data pulled from
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-white/20" />
      </div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex items-center justify-center flex-wrap gap-8 md:gap-14 px-6"
      >
        {platforms.map((platform, i) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 + i * 0.07 }}
            whileHover={{ scale: 1.08, opacity: 1 }}
            className="flex items-center gap-2.5 opacity-40 hover:opacity-100 transition-opacity duration-300 group cursor-default"
          >
            <span
              className="transition-colors duration-300"
              style={{ color: "rgb(120,120,130)" }}
            >
              <platform.icon />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold text-neutral-300 tracking-wide group-hover:text-white transition-colors">
                {platform.name}
              </span>
              <span className="text-[10px] text-neutral-600 group-hover:text-neutral-400 transition-colors">
                {platform.label}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
