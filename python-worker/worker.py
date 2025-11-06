"""
Celery Worker Entry Point
Main worker application for AI/LLM background tasks
"""

import os
from celery import Celery
from python_worker.config import celery_config

# Langfuse Observability - Initialize at worker startup
try:
    from langfuse import Langfuse
    from python_worker.observability import set_langfuse_client

    # Only initialize if credentials are provided
    if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
        langfuse_client = Langfuse(
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
            secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
            host=os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com"),
        )
        set_langfuse_client(langfuse_client)
        print("✅ Langfuse observability initialized for Python worker")
    else:
        langfuse_client = None
        set_langfuse_client(None)
        print("ℹ️  Langfuse credentials not configured, observability disabled")
except ImportError:
    langfuse_client = None
    print("⚠️  Langfuse package not installed, run: pip install -r requirements.txt")

# Initialize Celery app
app = Celery("agent-ironman-worker")
app.config_from_object(celery_config)

# Auto-discover tasks in the tasks module
app.autodiscover_tasks(["python_worker.tasks"])


@app.task(bind=True)
def debug_task(self):
    """Debug task to verify worker is running"""
    print(f"Request: {self.request!r}")
    return {"status": "ok", "message": "Worker is running"}


if __name__ == "__main__":
    app.start()
