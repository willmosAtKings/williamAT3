from extensions import db

class EventExceptions(db.Model):
    __tablename__ = 'event_exceptions'

    id = db.Column(db.Integer, primary_key=True)
    original_event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    exception_date = db.Column(db.Date, nullable=False)  # The date this exception applies to
    
    # If these are NULL, it means the occurrence is deleted
    title = db.Column(db.String(150), nullable=True)
    description = db.Column(db.String(300), nullable=True)
    priority = db.Column(db.Integer, nullable=True)
    tags = db.Column(db.String(100), nullable=True)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
