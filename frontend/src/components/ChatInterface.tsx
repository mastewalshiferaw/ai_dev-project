"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Bot, Loader2, Paperclip, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- NEW: FILE UPLOAD LOGIC ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("File uploaded and processed successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), sender: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/`,
        { message: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: response.data.message.content,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorText = error.response?.status === 401 
        ? "Session expired. Please login again." 
        : "Server error. Try again later.";
      setMessages((prev) => [...prev, { id: Date.now(), sender: "ai", content: errorText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 mx-auto mt-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <h2 className="font-semibold text-lg">AI Knowledge Assistant</h2>
        </div>
        <button onClick={handleSignOut} className="hover:bg-white/20 p-2 rounded-lg transition">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Upload a document and ask me questions!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
              msg.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none"
            }`}>
              <span className="text-sm whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}

        {(isLoading || isUploading) && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">{isUploading ? "Processing file..." : "Thinking..."}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-center">
          {/* File Upload Button */}
          <label className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <Paperclip className="w-6 h-6" />
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your question..."
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}