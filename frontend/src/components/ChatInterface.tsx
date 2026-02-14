"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Bot, Loader2 } from "lucide-react";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 1. Get Token from localStorage
      const token = localStorage.getItem("access_token");
      
      // 2. Call Django API with Authorization Header
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/`,
        { message: userMessage.content },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
      );

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: response.data.message.content,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      let errorText = "Sorry, I'm having trouble connecting to the server.";
      
      // Handle Token Expiry or Authentication error
      if (error.response && error.response.status === 401) {
        errorText = "Session expired. Please sign out and log in again.";
      }

      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: errorText,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center gap-2">
        <Bot className="w-6 h-6" />
        <h2 className="font-semibold text-lg">AI Knowledge Assistant</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Ask me anything about the uploaded documents!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 flex gap-2 ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
              }`}
            >
              <span className="text-sm">{msg.content}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your question..."
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}