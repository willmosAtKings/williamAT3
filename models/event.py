from app import db

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300), nullable=False)
    genre = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.Integer, default=0)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=True)
    is_public = db.Column(db.Boolean, default=True)

    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
