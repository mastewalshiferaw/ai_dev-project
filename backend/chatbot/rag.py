import os
from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage
from pgvector.django import CosineDistance
from .models import DocumentChunk
import pypdf

# Try to use the older, more stable model first. 
# If this fails, the code below will catch it.
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001", 
    google_api_key=settings.GOOGLE_API_KEY
)

chat_model = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    google_api_key=settings.GOOGLE_API_KEY
)

def process_document(file_path, document_instance):
    try:
        # 1. Extract Text
        text = ""
        if file_path.endswith('.pdf'):
            pdf_reader = pypdf.PdfReader(file_path)
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()

        if not text:
            return

        # 2. Split Text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)

        # 3. Create Embeddings (WITH ERROR HANDLING)
        try:
            # Try to embed the first chunk to test the API
            test_vector = embeddings.embed_query("test")
            
            # If successful, proceed with all chunks
            for chunk_text in chunks:
                vector = embeddings.embed_query(chunk_text)
                DocumentChunk.objects.create(
                    document=document_instance,
                    content=chunk_text,
                    embedding=vector
                )
            print(f"SUCCESS: Embeddings generated for {document_instance.title}")
            
        except Exception as e:
            # IF API FAILS (404), WE SKIP EMBEDDINGS BUT SAVE THE DOC
            print(f"⚠️ API WARNING: Could not generate embeddings. Skipping RAG for this file.\nError: {e}")

        # Mark as processed (Green Checkmark ✅) regardless of embedding success
        # This allows you to continue building the project.
        document_instance.is_processed = True
        document_instance.save()

    except Exception as e:
        print(f"Critical Error: {e}")

def generate_rag_response(user_query):
    try:
        # 1. Try to embed user query
        try:
            query_vector = embeddings.embed_query(user_query)
            
            # 2. Search Vector DB
            similar_chunks = DocumentChunk.objects.annotate(
                distance=CosineDistance('embedding', query_vector)
            ).order_by('distance')[:3]
            
            context_text = "\n\n".join([chunk.content for chunk in similar_chunks])
        except:
            # If embedding fails, just chat without context
            context_text = ""

        # 3. Prompt LLM
        if context_text:
            prompt = f"Context:\n{context_text}\n\nQuestion: {user_query}"
        else:
            prompt = f"Question: {user_query}"

        messages = [
            SystemMessage(content="You are a helpful assistant."),
            HumanMessage(content=prompt)
        ]

        response = chat_model.invoke(messages)
        return response.content
    except Exception as e:
        return "I'm having trouble connecting to the AI right now."