from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]  # Only logged-in users can chat

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

        # Create Conversation
        if conversation_id:
            conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
        else:
            conversation = Conversation.objects.create(user=user)

        # Save User Message
        Message.objects.create(
            conversation=conversation,
            sender='user',
            content=message_content
        )

        # Generate AI Response (PLACEHOLDER FOR RAG)
        # TODO: Connect this to LangChain/OpenAI later
        ai_response_text = f"I received your message: '{message_content}'. (AI Logic coming soon!)"

        ai_message = Message.objects.create(
            conversation=conversation,
            sender='ai',
            content=ai_response_text
        )

        # Return the response
        return Response({
            'conversation_id': conversation.id,
            'message': MessageSerializer(ai_message).data
        })