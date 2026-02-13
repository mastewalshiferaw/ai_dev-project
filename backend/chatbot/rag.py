import os
from django.conf import settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import HumanMessage, SystemMessage
from pgvector.django import CosineDistance
from .models import DocumentChunk
import pypdf

# 1. Initialize Google Gemini Clients
# We use 'models/embedding-001' for vectors (768 dimensions for google api)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=settings.GOOGLE_API_KEY)

# We use 'gemini-1.5-flash' for chat (Fast & Free tier)
chat_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=settings.GOOGLE_API_KEY)

def process_document(file_path, document_instance):
    """
    1. Read PDF/Text
    2. Split into chunks
    3. Generate Embeddings (Google)
    4. Save to Database
    """
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
            print("No text found in document")
            return

        # 2. Split Text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)

        # 3. Create Embeddings & Save
      
        for chunk_text in chunks:
            vector = embeddings.embed_query(chunk_text)
            
            DocumentChunk.objects.create(
                document=document_instance,
                content=chunk_text,
                embedding=vector
            )

        # Mark as processed
        document_instance.is_processed = True
        document_instance.save()
        print(f"Successfully processed {document_instance.title}")

    except Exception as e:
        print(f"Error processing document: {e}")

def generate_rag_response(user_query):
    try:
        # 1. Embed the query
        query_vector = embeddings.embed_query(user_query)

        # 2. Vector Search
        similar_chunks = DocumentChunk.objects.annotate(
            distance=CosineDistance('embedding', query_vector)
        ).order_by('distance')[:3]

        context_text = "\n\n".join([chunk.content for chunk in similar_chunks])

        if not context_text:
            return "I don't have enough information in my knowledge base to answer that."

        # 3. Prompt
        prompt = f"""
        You are a helpful assistant. Use the context below to answer the question.
        
        Context:
        {context_text}

        Question: 
        {user_query}
        """

        messages = [
            SystemMessage(content="You are a helpful AI assistant."),
            HumanMessage(content=prompt)
        ]

        response = chat_model.invoke(messages)
        return response.content
    except Exception as e:
        print(f"RAG Error: {e}")
        return "Sorry, I am having trouble thinking right now."