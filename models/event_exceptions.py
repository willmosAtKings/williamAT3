# Event exceptions model for handling recurring event modifications
from extensions import db

class EventExceptions(db.Model):
    """
    Model for storing exceptions to recurring events
    Allows individual instances of recurring events to be modified or deleted
    without affecting the entire recurring series
    """
    __tablename__ = 'event_exceptions'

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Reference to the original recurring event
    original_event_id = db.Column(db.Integer, db.ForeignKey('events.id'))

    # The specific date this exception applies to
    exception_date = db.Column(db.Date, nullable=False)

    # Modified event details (nullable for deletions)
    # If these fields are NULL, it means the occurrence is deleted
    # If they contain values, they override the original event for this date
    title = db.Column(db.String(150), nullable=True)
    description = db.Column(db.String(300), nullable=True)
    priority = db.Column(db.Integer, nullable=True)
    tags = db.Column(db.String(100), nullable=True)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
