"""
Celery Worker Entry Point
Main worker application for AI/LLM background tasks
"""

from celery import Celery
from python_worker.config import celery_config

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
