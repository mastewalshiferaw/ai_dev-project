"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
// We use simple HTML elements first to ensure it works, then style them
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // HARDCODED URL - This MUST match your Django URL
    const API_URL = "http://127.0.0.1:8000/api/token/";
    
    console.log("Sending request to:", API_URL); // Check your browser console!

    try {
      const res = await axios.post(API_URL, { username, password });
      
      console.log("Login Success!", res.data);
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      router.push("/");
      
    } catch (err: any) {
      console.error("Login Failed:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to Django. Is the Backend running?");
      } else if (err.response?.status === 404) {
        setError("Error 404: Django URL not found. Check urls.py");
      } else if (err.response?.status === 401) {
        setError("Wrong username or password.");
      } else {
        setError("Login failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // If this background doesn't show up, Tailwind is broken.
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">AI Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="admin"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? "Connecting..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}