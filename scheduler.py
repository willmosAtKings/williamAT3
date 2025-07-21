# Background scheduler for automated tasks
# Handles periodic tasks like sending event reminder notifications

from apscheduler.schedulers.background import BackgroundScheduler
from models.notifications import send_event_reminders

def start_scheduler(app):
    """
    Initialize and start the background scheduler for automated tasks
    Sets up daily notification job to send event reminders

    Args:
        app: Flask application instance for database context
    """
    scheduler = BackgroundScheduler()

    # Schedule daily notification job at 7:00 AM
    # This sends reminder emails for upcoming events
    scheduler.add_job(
        func=lambda: send_event_reminders(app),  # Lambda preserves app context
        trigger='cron',  # Cron-style scheduling
        hour=7,          # Run at 7 AM
        minute=0,        # At the top of the hour
        id='daily_notification_job',  # Unique job identifier
        replace_existing=True         # Replace if job already exists
    )

    # Start the scheduler in background thread
    scheduler.start()
