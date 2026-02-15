import os
from django.conf import settings
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage
from pgvector.django import CosineDistance
from .models import DocumentChunk
import pypdf

# 1. SETUP LOCAL EMBEDDINGS (Runs on your CPU - No API Key needed!)
# This will download a small AI model (all-MiniLM-L6-v2) the first time you run it.
print("Loading Local Embedding Model... (This happens once)")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 2. SETUP GROQ CHAT (Cloud AI - Fast & Free)
chat_model = ChatGroq(
    model="llama-3.1-8b-instant", 
    api_key=os.getenv("GROQ_API_KEY")
)

def process_document(file_path, document_instance):
    try:
        print(f"📄 Processing: {document_instance.title}")
        
        # 1. Extract Text
        text = ""
        if file_path.endswith('.pdf'):
            try:
                pdf_reader = pypdf.PdfReader(file_path)
                for page in pdf_reader.pages:
                    text += page.extract_text() or ""
            except: pass
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()

        if not text: return

        # 2. Split Text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)

        # 3. Embed Locally (Reliable!)
        print(f"⚡ Generating Embeddings for {len(chunks)} chunks locally...")
        
        # Batch process for speed
        vectors = embeddings.embed_documents(chunks)
        
        for i, chunk_text in enumerate(chunks):
            DocumentChunk.objects.create(
                document=document_instance,
                content=chunk_text,
                embedding=vectors[i] # Use the locally generated vector
            )
        
        document_instance.is_processed = True
        document_instance.save()
        print(f"✅ Success: {document_instance.title} processed.")

    except Exception as e:
        print(f"❌ Processing Error: {e}")
        # Mark as processed anyway to avoid Admin UI lockup, 
        # but check logs if search fails.
        document_instance.is_processed = True
        document_instance.save()

def generate_rag_response(user_query):
    try:
        # 1. Embed Query Locally
        query_vector = embeddings.embed_query(user_query)
        
        # 2. Search Database
        context_text = ""
        similar_chunks = DocumentChunk.objects.annotate(
            distance=CosineDistance('embedding', query_vector)
        ).order_by('distance')[:3]
        
        context_text = "\n\n".join([chunk.content for chunk in similar_chunks])

        # 3. Chat with Groq (Llama 3)
        if context_text:
            prompt = f"Answer the question based ONLY on the following context:\n\n{context_text}\n\nQuestion: {user_query}"
        else:
            prompt = f"Question: {user_query}"
        
        ai_name = "Maste's"  
        creator_name = "Mastewal" 
        
        system_prompt = f"""
        You are {ai_name}, a highly intelligent Knowledge Assistant. 
        You were created and trained by {creator_name}.
        
        Your personality is:
        - Professional yet friendly.
        - Helpful and concise.
        - When asked "Who are you?", you must answer that you are {ai_name}.
        
        If the context below contains the answer, use it. 
        If not, use your general knowledge but stay in character.
        """

        #messages = [
         #   SystemMessage(content="You are a helpful AI assistant."),
         #   HumanMessage(content=prompt)
        #]
        messages = [
        SystemMessage(content=system_prompt), 
        HumanMessage(content=prompt)
    ]
        
        response = chat_model.invoke(messages)
        return response.content

    except Exception as e:
        print(f"❌ AI Error: {e}")
        return f"I encountered an error connecting to the AI brain: {str(e)}"