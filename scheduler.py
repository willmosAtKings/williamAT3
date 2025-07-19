from apscheduler.schedulers.background import BackgroundScheduler
from models.notifications import send_event_reminders

def start_scheduler(app):
    scheduler = BackgroundScheduler()

    # Schedule the job every 30 seconds (for testing; normally use cron at 7am)

# trigger='cron',
# hour=7,
# minute=0
    scheduler.add_job(
        func=lambda: send_event_reminders(app),
        trigger='interval',
        seconds=30,
        id='daily_notification_job',
        replace_existing=True
    )

    scheduler.start()
