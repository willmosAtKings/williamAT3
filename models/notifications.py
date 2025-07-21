from extensions import db
from models.user import User
from models.event import Event
from utils.email_utils import send_email
from sqlalchemy import and_
from datetime import datetime, timedelta
from flask import current_app

# Notification model and email reminder system
class Notification(db.Model):
    """
    Model for tracking sent notifications to prevent duplicates
    Stores information about email reminders sent to users for events
    """
    __tablename__ = 'notifications'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Foreign keys linking to user and event
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)

    # Notification timing and details
    days_before = db.Column(db.Integer, nullable=False)  # How many days before event
    type = db.Column(db.String(50))  # Notification type (e.g., 'email')
    message = db.Column(db.Text)     # Content of the notification
    created_at = db.Column(db.DateTime, default=db.func.now())  # When notification was sent

def send_event_reminders(app):
    """
    Send email reminders for upcoming events based on priority rules
    Called by the scheduler to automatically notify users of upcoming events

    Priority-based notification schedule:
    - High priority (2): 7, 2, and 1 days before
    - Medium priority (1): 2 and 1 days before
    - Low priority (0): 1 day before

    Args:
        app: Flask application instance for database context
    """
    with app.app_context():
        now = datetime.now()

        # Define notification rules based on event priority
        PRIORITY_RULES = {
            2: [7, 2, 1],  # High priority: multiple reminders
            1: [2, 1],     # Medium priority: fewer reminders
            0: [1]         # Low priority: single reminder
        }

        # Process each priority level and notification timing
        for priority, days_list in PRIORITY_RULES.items():
            for days_before in days_list:
                # Calculate target date for events to notify about
                target_date = now + timedelta(days=days_before)

                # Find matching events (excluding silenced ones)
                matching_events = Event.query.filter(
                    Event.priority == priority,
                    db.func.date(Event.start_time) == target_date.date(),
                    Event.notifications_silenced == False  # Skip silenced events
                ).all()

                # Process each matching event
                for event in matching_events:
                    notified_users = set()

                    # Handle personal events (no tags - only notify creator)
                    if not event.tags or event.tags.strip() == "":
                        user = User.query.get(event.creator_id)
                        if user:
                            notified_users.add(user)

                    else:
                        # Handle shared events (tag-based - notify users with matching tags)
                        event_tags = [tag.strip().lower() for tag in event.tags.split(',')]

                        # Check all users for matching tags
                        all_users = User.query.all()
                        for user in all_users:
                            user_tags = [tag.strip().lower() for tag in user.tags] if user.tags else []
                            # Notify user if they have any matching tags
                            if any(tag in event_tags for tag in user_tags):
                                notified_users.add(user)

                    # Send notifications to all identified users
                    for user in notified_users:
                        # Check for duplicate notifications to prevent spam
                        already_sent = Notification.query.filter_by(
                            user_id=user.id,
                            event_id=event.id,
                            days_before=days_before,
                            type="email"
                        ).first()

                        # Skip if notification already sent
                        if already_sent:
                            continue

                        # Compose email content
                        subject = f"Upcoming Event: {event.title}"
                        body = (
                            f"Reminder: '{event.title}' is happening in {days_before} day(s).\n\n"
                            f"Details: {event.description or 'No description provided.'}"
                        )

                        # Send the email
                        send_email(app, user.email, subject, body)

                        # Record the notification to prevent duplicates
                        notif = Notification(
                            user_id=user.id,
                            event_id=event.id,
                            days_before=days_before,
                            type="email",
                            message=body
                        )
                        db.session.add(notif)

                        print(f"✅ Sent to {user.email} for event '{event.title}' ({days_before}d before)")

        # Commit all notification records to database
        db.session.commit()
        print("✅ All reminders processed.")
