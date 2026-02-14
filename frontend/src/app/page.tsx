"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "../components/ChatInterface"; // Make sure path is right!
import { LogOut } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    else setIsAuthorized(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  if (!isAuthorized) return null;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      <button onClick={handleLogout} className="absolute top-4 right-4 flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
      <ChatInterface />
    </main>
  );
}