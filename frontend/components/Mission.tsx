"use client";
import { FallingText } from "./ui/falling-text";

export function Mission() {
  const content = [
    { text: "IdeaForge", color: "white" },
    { text: "AI", color: "white" },
    { text: "is", color: "white" },
    { type: "icon", icon: "reddit" },
    { type: "icon", icon: "twitter" },
    { type: "icon", icon: "ph" },
    { text: "revolutionizing", color: "white" },
    { text: "the", color: "gray" },
    { text: "discovery", color: "gray" },
    { text: "of", color: "gray" },
    { text: "validated", color: "white" },
    { text: "SaaS", color: "white" },
    { text: "ideas,", color: "white" },
    { text: "ushering", color: "gray" },
    { text: "in", color: "gray" },
    { text: "a", color: "gray" },
    { text: "new", color: "gray" },
    { text: "era", color: "gray" },
    { text: "of", color: "gray" },
    { text: "data-driven", color: "gray" },
    { text: "entrepreneurship.", color: "gray" },
    { type: "icon", icon: "rocket" },
    { text: "Our", color: "gray" },
    { text: "mission", color: "gray" },
    { text: "is", color: "gray" },
    { text: "to", color: "gray" },
    { text: "seamlessly", color: "white" },
    { text: "monitor", color: "white" },
    { type: "icon", icon: "brain" },
    { text: "these", color: "gray" },
    { text: "platforms", color: "gray" },
    { text: "to", color: "gray" },
    { text: "unlock", color: "gray" },
    { text: "hidden", color: "gray" },
    { text: "pain", color: "white" },
    { text: "points", color: "white" },
    { text: "and", color: "gray" },
    { text: "drive", color: "gray" },
    { text: "the", color: "gray" },
    { text: "next", color: "gray" },
    { text: "big", color: "white" },
    { text: "startup.", color: "white" },
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'reddit':
        return (
          <div className="w-8 h-8 md:w-12 md:h-12 bg-[#FF4500] rounded-full flex items-center justify-center translate-y-1 md:translate-y-2">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 md:w-7 md:h-7">
              <path d="M22.5 12a2.5 2.5 0 00-2.5-2.5c-.71 0-1.35.31-1.78.8-1.57-1.12-3.7-1.87-6.05-1.99l1.26-5.96 5.1.72a2.5 2.5 0 10.38-1.02l-5.61-.79a.5.5 0 00-.59.39l-1.4 6.64c-2.42.1-4.6.86-6.2 2-1.4-.2-2.73 1-2.73 2.7 0 .96.53 1.8 1.34 2.22-.05.28-.08.57-.08.87 0 3.86 4.3 7 9.6 7s9.6-3.14 9.6-7c0-.28-.02-.57-.07-.85 1.05-.33 1.8-1.3 1.8-2.42m-13.43 3.65c0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2 0 .66-.54 1.2-1.2 1.2-.66 0-1.2-.54-1.2-1.2m5.01 3.52c-1.54 0-3.03-.5-3.66-.75a.5.5 0 01.3-.95c.5.21 1.76.66 3.36.66 1.62 0 2.87-.45 3.37-.66a.5.5 0 01.3.95c-.63.26-2.12.75-3.67.75m.86-3.52c0 .66-.54 1.2-1.2 1.2-.66 0-1.2-.54-1.2-1.2 0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2" />
            </svg>
          </div>
        );
      case 'twitter':
        return (
          <div className="w-8 h-8 md:w-12 md:h-12 bg-[#1DA1F2] rounded-full flex items-center justify-center translate-y-1 md:translate-y-2">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 md:w-6 md:h-6">
              <path d="M23.95 4.57a10 10 0 01-2.82.77 4.96 4.96 0 002.16-2.72c-.95.55-2.02.95-3.13 1.17a4.92 4.92 0 00-8.39 4.48A14 14 0 011.67 3.15 4.92 4.92 0 003.2 9.72a4.9 4.9 0 01-2.22-.61v.06a4.92 4.92 0 003.95 4.83 4.9 4.9 0 01-2.22.08 4.93 4.93 0 004.6 3.42A9.87 9.87 0 010 19.54a13.94 13.94 0 007.55 2.21c9.06 0 14-7.51 14-14v-.64a10.05 10.05 0 002.4-2.54z" />
            </svg>
          </div>
        );
      case 'ph':
        return (
          <div className="w-8 h-8 md:w-12 md:h-12 bg-[#DA552F] rounded-full flex items-center justify-center translate-y-1 md:translate-y-2">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 md:w-7 md:h-7">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.75 16h-3.5v-2H8.5V7h5.25c2.62 0 4.75 2.13 4.75 4.75 0 2.62-2.13 4.75-4.75 4.75v-.5zm0-7.5h-1.5v4h1.5c1.1 0 2-.9 2-2s-.9-2-2-2z" />
            </svg>
          </div>
        );
      case 'rocket':
        return (
          <div className="w-8 h-8 md:w-12 md:h-12 bg-[#D1AB61] rounded-full flex items-center justify-center translate-y-1 md:translate-y-2">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-6 md:h-6 text-black">
               <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
               <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
               <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5-4 5-4l2 2 3 3"/>
             </svg>
          </div>
        );
      case 'brain':
        return (
          <div className="w-8 h-8 md:w-12 md:h-12 bg-[#6E64CF] rounded-full flex items-center justify-center translate-y-1 md:translate-y-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-6 md:h-6">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
              <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
              <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
              <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
              <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
              <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
              <path d="M6 18a4 4 0 0 1-1.967-.516"/>
              <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <section className="py-20 relative overflow-hidden bg-[#0A0A0A] min-h-screen flex flex-col justify-center">
      <div className="max-w-6xl mx-auto px-6 relative z-10 w-full h-full flex flex-col items-center">
        
        {/* Top Header Label */}
        <div className="flex items-center justify-center gap-4 text-sm mb-12 select-none">
          <div className="h-[1px] bg-white/10 w-8 md:w-24"></div>
          <p className="font-semibold text-white tracking-widest text-[11px] md:text-sm uppercase">Data-Driven SaaS Discovery</p>
          <div className="h-[1px] bg-white/10 w-8 md:w-24"></div>
        </div>

        {/* Falling Text Container */}
        <div className="w-full h-[600px] md:h-[500px]">
          <FallingText
            trigger="hover"
            backgroundColor="transparent"
            gravity={1.2}
            mouseConstraintStiffness={0.1}
          >
            {content.map((item, i) => (
              <span 
                key={i} 
                className={`word inline-block mx-[3px] md:mx-[6px] my-[2px] md:my-[4px] select-none text-[32px] md:text-[56px] lg:text-[68px] leading-tight md:leading-[1.1] tracking-tight ${
                  item.color === 'white' ? 'text-white' : item.color === 'gray' ? 'text-[#737373]' : ''
                }`}
              >
                {item.type === 'icon' ? renderIcon(item.icon!) : item.text}
              </span>
            ))}
          </FallingText>
        </div>
      </div>
    </section>
  );
}
