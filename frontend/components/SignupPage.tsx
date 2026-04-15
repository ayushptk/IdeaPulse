"use client"
import React, { useState, useEffect } from 'react';
import { EyeOff, Eye } from 'lucide-react';

const carouselData = [
  {
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
    title: "Discover Winning Products",
    description: "Analyze market trends and discover the next big product ideas effortlessly."
  },
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    title: "Real-time Data Insights",
    description: "Harness the power of AI to analyze social discussions and market demands."
  },
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    title: "Launch with Confidence",
    description: "Validate your ideas with data and launch your products ahead of the competition."
  }
];
import { FcGoogle } from 'react-icons/fc';
import Image from 'next/image';
import Link from 'next/link';

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-[#F6F8FB] font-sans">
      {/* Left Column - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-24 min-h-screen relative">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2 mb-12 sm:mb-16">
          <Image src="/logo.png" alt="Logo" width={20} height={20} />
          <span className="text-xl font-bold text-[#111111] tracking-tight">IdeaForge AI</span>
        </div>

        {/* Outer container for horizontal centering */}
        <div className="w-full h-full flex flex-col justify-center">
          {/* Inner Form Container */}
          <div className="max-w-[480px] w-full mx-auto">
            <h1 className="text-[40px] font-bold text-[#0D0D0D] mb-4 tracking-tight leading-tight">Create an Account</h1>
            <p className="text-[#6B7280] text-[16px] font-medium mb-12">Please enter your details below to sign up</p>

            <form className="space-y-[18px]" onSubmit={(e) => e.preventDefault()}>
              {/* Full Name Input */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full h-[64px] bg-white rounded-2xl px-5 text-sm font-medium text-gray-900 border-none outline-none ring-1 ring-transparent focus:ring-gray-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full h-[64px] bg-white rounded-2xl px-5 text-sm font-medium text-gray-900 border-none outline-none ring-1 ring-transparent focus:ring-gray-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400"
                />
              </div>
              
              {/* Password Input */}
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full h-[64px] bg-white rounded-2xl pl-5 pr-14 text-sm font-medium text-gray-900 border-none outline-none ring-1 ring-transparent focus:ring-gray-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <Eye size={20} strokeWidth={2} /> : <EyeOff size={20} strokeWidth={2} />}
                </button>
              </div>

              {/* Signup Button */}
              <button 
                type="submit"
                className="w-full h-[60px] bg-[#FB611E] text-white rounded-2xl text-[15px] font-semibold shadow-xl shadow-black/5 hover:bg-black transition-all active:scale-[0.99] mt-6"
              >
                Sign up
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-[#E5E7EB]"></div>
              <span className="text-xs font-semibold text-[#9CA3AF]">or continue with</span>
              <div className="flex-1 h-[1px] bg-[#E5E7EB]"></div>
            </div>

            {/* Google Signup Button */}
            <button 
              type="button"
              className="w-full h-[60px] bg-transparent border border-[#E5E7EB] rounded-2xl flex items-center justify-center gap-3 text-[14px] font-semibold text-[#0D0D0D] hover:bg-black/5 transition-all active:scale-[0.99]"
            >
              <FcGoogle size={24} />
              Sign up with Google
            </button>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto text-center pt-10">
          <p className="text-[14px] text-[#6B7280] font-medium">
            Already have an account? <Link href="/login" className="text-[#FB611E] font-bold hover:underline">Log In</Link>
          </p>
        </div>
      </div>

      {/* Right Column - Carousel */}
      <div className="hidden lg:flex w-full lg:w-[55%] bg-[#121214] rounded-l-[40px] relative overflow-hidden my-4 mr-4 shadow-[-10px_0_40px_rgba(0,0,0,0.1)]">
        
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(45deg, #ffffff 1px, transparent 1px), linear-gradient(-45deg, #ffffff 1px, transparent 1px)`, 
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        />
        
        <div className="w-full h-full flex flex-col items-center justify-center relative z-10 px-8 py-16">
          
          {/* Carousel Container */}
          <div className="w-full flex flex-col items-center justify-center px-4 relative z-10 transition-all duration-500 ease-in-out mt-8">
            {/* Image Container */}
            <div className="relative w-full max-w-[600px] aspect-[4/3] flex items-center justify-center mb-10 overflow-hidden rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] group">
              {/* Glow Effects */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FB611E]/20 via-[#8A58D2]/20 to-transparent blur-3xl z-0 pointer-events-none"></div>
              
              {carouselData.map((slide, index) => (
                <div 
                  key={index}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out z-10 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img 
                    src={slide.image} 
                    alt={slide.title} 
                    className="w-full h-full object-cover transform transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
                    crossOrigin="anonymous"
                  />
                  {/* Subtle overlay for better contrast */}
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              ))}
            </div>

            {/* Typography & Pagination */}
            <div className="text-center max-w-[600px] mx-auto z-20 min-h-[200px] flex flex-col items-center">
              <div className="relative w-full">
                {carouselData.map((slide, index) => (
                  <div 
                    key={index}
                    className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out ${
                      index === currentSlide 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                  >
                    <h2 className="text-[34px] font-bold text-white mb-4 tracking-tight">{slide.title}</h2>
                    <p className="text-[#A1A1AA] text-[17px] leading-relaxed mb-10 w-full font-medium">
                      {slide.description}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Pagination Dots */}
              <div className="flex items-center justify-center bg-[#24242A]/80 rounded-full px-5 py-[12px] w-fit backdrop-blur-xl border border-white/5 gap-3 shadow-lg">
                {carouselData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-6 bg-[#FB611E] shadow-[0_0_12px_rgba(251,97,30,0.6)]' 
                        : 'w-2 bg-[#4A4A52] hover:bg-[#6A6A72]'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
