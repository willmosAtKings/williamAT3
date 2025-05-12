from app import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    role = db.Column(db.String(20), nullable=False)

    events = db.relationship("Event", backref="creator", lazy=True)
