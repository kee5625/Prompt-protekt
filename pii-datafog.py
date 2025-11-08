from datafog.services import TextService

# Simple detection using regex engine (fast)
text_service = TextService(engine="smart")
text = "Contact John Doe at john.doe@company.com or (555) 123-4567"
results = text_service.annotate_text_sync(text)
print(results)
# Finds: emails, phone numbers, and more