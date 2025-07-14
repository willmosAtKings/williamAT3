from extensions import db
from sqlalchemy import JSON

class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(300))

    priority = db.Column(db.Integer, default=0)
    tags = db.Column(db.String(100))

    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)

    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    recurrence_group_id = db.Column(db.String(36), nullable=True, index=True)

    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'))

