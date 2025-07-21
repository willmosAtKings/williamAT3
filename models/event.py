# Event model for calendar events and scheduling
from extensions import db
from sqlalchemy import JSON

class Event(db.Model):
    """
    Event model representing calendar events
    Supports both single and recurring events with priority and tagging
    """
    __tablename__ = 'events'

    # Primary key and basic event information
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(300))

    # Event categorization and importance
    priority = db.Column(db.Integer, default=0)  # 0=low, 1=medium, 2=high, 3=urgent
    tags = db.Column(db.String(100))  # Comma-separated tags for filtering

    # Event timing
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)

    # Recurring event support
    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    recurrence_group_id = db.Column(db.String(36), nullable=True, index=True)  # Groups recurring instances

    # Notification management
    notifications_silenced = db.Column(db.Boolean, default=False, nullable=False)

    # Foreign key to user who created the event
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'))

