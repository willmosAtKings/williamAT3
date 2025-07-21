from apscheduler.schedulers.background import BackgroundScheduler
from models.notifications import send_event_reminders

def start_scheduler(app):
    scheduler = BackgroundScheduler()

    # Schedule the job every 30 seconds (for testing; normally use cron at 7am)


    scheduler.add_job(
        func=lambda: send_event_reminders(app),
        trigger='cron',
        hour=7,
        minute=0,
        id='daily_notification_job',
        replace_existing=True
    )

    scheduler.start()
