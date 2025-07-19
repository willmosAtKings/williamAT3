from extensions import db
from datetime import datetime, timezone, timedelta
from models import Event, Notification, User
from utils.email_utils import send_email

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    days_before = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'email'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))




def send_event_reminders(app):
    with app.app_context():
        PRIORITY_RULES = {
            2: [7, 2, 1],
            1: [2, 1],
            0: [1]
        }
        now = datetime.now()

        for priority, days_list in PRIORITY_RULES.items():
            for days_before in days_list:
                target_date = now + timedelta(days=days_before)

                events = Event.query.filter(
                    Event.priority == priority,
                    db.func.date(Event.start_time) == target_date.date()
                ).all()

                for event in events:
                    user = User.query.get(event.creator_id)
                    if not user:
                        continue

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
                        f"🗓️ Event Reminder: {event.title}\n\n"
                        f"📅 Date: {event.start_time.strftime('%A, %d %B %Y at %I:%M %p')}\n"
                        f"📝 Details: {event.description or 'No description provided.'}\n"
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

        db.session.commit()
