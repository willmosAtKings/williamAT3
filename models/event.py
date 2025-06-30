from extensions import db

class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(300))

    priority = db.Column(db.Integer, default=0)  # 0 = low, 1 = medium, 2 = high
    genre = db.Column(db.String(50))  # e.g. 'sports', 'academic', etc.
    tags = db.Column(db.String(100))  # Comma-separated or list via JSON

    is_public = db.Column(db.Boolean, default=True)  # True = visible to everyone

    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)

    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'))
