"use client";
import Link from "next/link";
import Image from "next/image";

import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="">
          <Image src="/logo.png" alt="Logo" width={20} height={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">IdeaForge AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <Link href="#features" className="hover:text-white transition">Features</Link>
          <Link href="#live-ideas" className="hover:text-white transition">Live Ideas</Link>
          <Link href="#pricing" className="hover:text-white transition">Pricing</Link>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {session ? (
            <>
              <Link href="/dashboard" className="text-neutral-400 hover:text-white transition">Dashboard</Link>
              <button onClick={() => signOut()} className="bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-400 hover:text-white transition">Sign In</Link>
              <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
