from extensions import db
from models.user import User
from models.event import Event
from utils.email_utils import send_email
from sqlalchemy import and_
from datetime import datetime, timedelta
from flask import current_app

# Define Notification model here, so it's available inside this file
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    days_before = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(50))  # e.g., 'email'
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.now())

def send_event_reminders(app):
    with app.app_context():
        now = datetime.now()

        PRIORITY_RULES = {
            2: [7, 2, 1],  # High priority
            1: [2, 1],     # Medium
            0: [1]         # Low
        }

        for priority, days_list in PRIORITY_RULES.items():
            for days_before in days_list:
                target_date = now + timedelta(days=days_before)

                # Find matching events
                matching_events = Event.query.filter(
                    Event.priority == priority,
                    db.func.date(Event.start_time) == target_date.date()
                ).all()

                for event in matching_events:
                    notified_users = set()

                    # Personal events (no tags)
                    if not event.tags or event.tags.strip() == "":
                        user = User.query.get(event.creator_id)
                        if user:
                            notified_users.add(user)

                    else:
                        # Shared events (tag-based)
                        event_tags = [tag.strip().lower() for tag in event.tags.split(',')]

                        all_users = User.query.all()
                        for user in all_users:
                            user_tags = [tag.strip().lower() for tag in user.tags] if user.tags else []
                            if any(tag in event_tags for tag in user_tags):
                                notified_users.add(user)

                    for user in notified_users:
                        # Check for duplicates
                        already_sent = Notification.query.filter_by(
                            user_id=user.id,
                            event_id=event.id,
                            days_before=days_before,
                            type="email"
                        ).first()

                        if already_sent:
                            continue

                        subject = f"Upcoming Event: {event.title}"
                        body = (
                            f"Reminder: '{event.title}' is happening in {days_before} day(s).\n\n"
                            f"Details: {event.description or 'No description provided.'}"
                        )

                        send_email(app, user.email, subject, body)

                        notif = Notification(
                            user_id=user.id,
                            event_id=event.id,
                            days_before=days_before,
                            type="email",
                            message=body
                        )
                        db.session.add(notif)

                        print(f"✅ Sent to {user.email} for event '{event.title}' ({days_before}d before)")

        db.session.commit()
        print("✅ All reminders processed.")
