import ChatInterface from "../components/ChatInterface";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Document Chatbot
        </h1>
        <p className="text-gray-600">
          Powered by RAG, Django & Google Gemini
        </p>
      </div>
      
      <ChatInterface />
    </main>
  );
}