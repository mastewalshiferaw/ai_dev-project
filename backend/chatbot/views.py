import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage  # <--- THIS WAS MISSING
from django.conf import settings

from .models import Conversation, Message, Document
from .serializers import ConversationSerializer, MessageSerializer
from .rag import generate_rag_response, process_document

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all conversations for the current user"""
        conversations = Conversation.objects.filter(user=request.user).order_by('-created_at')
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Send a message and get an AI response"""
        user = request.user
        message_content = request.data.get('message')
        conversation_id = request.data.get('conversation_id')

        if not message_content:
            return Response({"error": "Message content is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Handle Conversation creation/retrieval
        if conversation_id:
            conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
        else:
            conversation = Conversation.objects.create(user=user)

        # 2. Save User Message
        Message.objects.create(
            conversation=conversation,
            sender='user',
            content=message_content
        )

        # 3. Generate AI Response
        ai_response_text = "I'm having trouble thinking."
        try:
            ai_response_text = generate_rag_response(message_content)
        except Exception as e:
            print(f"RAG Error: {e}")
            ai_response_text = "I am unable to connect to the AI service at the moment."

        # 4. Save AI Response
        ai_message = Message.objects.create(
            conversation=conversation,
            sender='ai',
            content=ai_response_text
        )

        return Response({
            'conversation_id': conversation.id,
            'message': MessageSerializer(ai_message).data
        })

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=400)
        
        try:
            # 1. Create the Document entry in Database
            # This automatically saves the file to the media folder
            doc = Document.objects.create(
                title=file_obj.name,
                file=file_obj
            )

            # 2. Trigger RAG Processing
            # We pass the file path and the document object to rag.py
            process_document(doc.file.path, doc)
            
            return Response({"message": f"Successfully processed {file_obj.name}"})

        except Exception as e:
            print(f"Upload Error: {e}")
            return Response({"error": str(e)}, status=500)