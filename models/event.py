from app import db

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(300))
    date = db.Column(db.DateTime, nullable=False)
    priority = db.Column(db.Integer, default=0)  # 0 = low, 1 = medium, 2 = high
    genre = db.Column(db.String(50))  # e.g. 'sports', 'academic', etc.
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    is_public = db.Column(db.Boolean, default=True)  # True = visible to everyone

