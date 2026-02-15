from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
# Make sure rag.py is in the same folder
from .rag import generate_rag_response 

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

        # 3. Generate AI Response (Using Groq/Local RAG)
        try:
            ai_response_text = generate_rag_response(message_content)
        except Exception as e:
            print(f"RAG Error: {e}")
            ai_response_text = "I'm having trouble connecting to the AI brain."

        # 4. Save AI Response
        ai_message = Message.objects.create(
            conversation=conversation,
            sender='ai',
            content=ai_response_text
        )

        # 5. Return response
        return Response({
            'conversation_id': conversation.id,
            'message': MessageSerializer(ai_message).data
        })

# --- THIS WAS MISSING ---
class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        API Endpoint for uploading documents.
        (Mostly we use Django Admin, but this satisfies the URLs)
        """
        return Response({"message": "Please use the Django Admin panel to upload and process documents for RAG."})