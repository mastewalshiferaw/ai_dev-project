"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "../components/ChatInterface";
import { LogOut, Sparkles, Bot, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  if (!isAuthorized) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      {/* Purple Glow (Top Left) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
      {/* Blue Glow (Bottom Right) */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      {/* Header Section */}
      <div className="z-10 text-center mb-10 space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-4 backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>Powered by RAG & Gemini</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            AI Knowledge
          </span>{" "}
          Hub
        </h1>
        
        <p className="text-gray-400 text-lg">
          Upload your documents and chat with your private data instantly. 
          Secure, fast, and intelligent.
        </p>
      </div>

      {/* Logout Button (Glass Style) */}
      <button 
        onClick={handleLogout}
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/10 transition-all bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm z-50"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>

      {/* Chat Container */}
      <div className="w-full max-w-4xl z-10">
        <ChatInterface />
      </div>

    </main>
  );
}