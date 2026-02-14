from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Document
from .rag import process_document
import threading

@receiver(post_save, sender=Document)
def document_upload_handler(sender, instance, created, **kwargs):
    """
    Triggered when a Document is saved.
    If it's new and not processed, start processing in a background thread.
    """
    if created and not instance.is_processed:
        # Run in a separate thread so it doesn't freeze the Admin page
        thread = threading.Thread(target=process_document, args=(instance.file.path, instance))
        thread.start()