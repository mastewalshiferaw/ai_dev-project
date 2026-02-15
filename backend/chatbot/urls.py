from django.urls import path
from .views import ChatAPIView, DocumentUploadView
urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),
    path('upload/', DocumentUploadView.as_view(), name='upload'), 
]

