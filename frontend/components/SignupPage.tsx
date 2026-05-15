"use client"
import React, { useState, useEffect } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
            <h1 className="text-[40px] font-bold text-[#0D0D0D] mb-4 tracking-tight leading-tight text-center">Create an Account</h1>
            <p className="text-[#6B7280] text-[16px] font-medium mb-12 text-center">Please enter your details below to sign up</p>

            <form className="space-y-[18px]" onSubmit={async (e) => {
              e.preventDefault();
              setIsLoading(true);
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/auth/register`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, email, password })
                });

                if (res.ok) {
                  toast.success("Account created successfully!");
                  const signInRes = await signIn("credentials", {
                    redirect: false,
                    email,
                    password
                  });
                  if (!signInRes?.error) {
                    router.push("/dashboard");
                  } else {
                    router.push("/login");
                  }
                } else {
                  const data = await res.json();
                  toast.error(data.detail || "Registration failed");
                }
              } catch (error) {
                toast.error("An error occurred. Please try again.");
              } finally {
                setIsLoading(false);
              }
            }}>
              {/* Full Name Input */}
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Full Name" 
                  className="w-full h-[64px] bg-white rounded-2xl px-5 text-sm font-medium text-gray-900 border-none outline-none ring-1 ring-transparent focus:ring-gray-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email" 
                  className="w-full h-[64px] bg-white rounded-2xl px-5 text-sm font-medium text-gray-900 border-none outline-none ring-1 ring-transparent focus:ring-gray-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.03)] transition-all placeholder:text-gray-400"
                />
              </div>
              
              {/* Password Input */}
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                disabled={isLoading}
                className="w-full h-[60px] bg-[#FB611E] text-white rounded-2xl text-[15px] font-semibold shadow-xl shadow-black/5 hover:bg-black transition-all active:scale-[0.99] mt-6 disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign up"
                )}
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
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
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

      {/* RIGHT SIDE (FIXED & IMPROVED) */}
      <div className="hidden lg:flex w-[55%] bg-[#121214] rounded-l-[40px] relative overflow-hidden my-4 mr-4">

        <div className="w-full h-full flex flex-col items-center justify-center px-10">

          {/* Image */}
          <div className="relative w-full max-w-[650px] aspect-[4/3] mb-12 overflow-hidden rounded-[30px]">
            {carouselData.map((slide, index) => (
              <img
                key={index}
                src={slide.image}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>

          {/* TEXT (FIXED HERE) */}
          <div className="w-full max-w-[900px] text-center flex items-center justify-center min-h-[200px] relative">

            {carouselData.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-700 ${
                  index === currentSlide
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
              >

                <h2 className="text-[40px] font-bold text-white mb-5 max-w-[800px] leading-tight">
                  {slide.title}
                </h2>

                <p className="text-gray-400 text-[18px] max-w-[700px] leading-relaxed">
                  {slide.description}
                </p>

              </div>
            ))}

          </div>

          {/* Dots */}
          <div className="flex gap-3 mt-10">
            {carouselData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-6 bg-[#FB611E]"
                    : "w-2 bg-gray-600"
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignupPage;
