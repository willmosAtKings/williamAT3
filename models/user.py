import secrets
from datetime import datetime, timedelta
from app import db
from werkzeug.security import generate_password_hash, check_password_hash



class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'student', 'teacher', 'admin'

    session_token = db.Column(db.String(64), unique=True, index=True)
    session_expiry = db.Column(db.DateTime, nullable=True)
    csrf_token = db.Column(db.String(64), unique=True, index=True)

    events = db.relationship("Event", backref="creator", lazy=True)

    def __init__(self, username, email, password, role):
        self.username = username.strip()
        self.email = email.strip()
        self.set_password(password)
        self.role = role
        self.regenerate_tokens()

    from models.event import Event

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_session_token(self):
        self.session_token = secrets.token_hex(32)
        self.session_expiry = datetime.utcnow() + timedelta(hours=2)  # Token valid for 2 hours

    def validate_session_token(self, token):
        return (
            self.session_token == token and
            self.session_expiry and
            self.session_expiry > datetime.utcnow()
        )

    def generate_csrf_token(self):
        self.csrf_token = secrets.token_hex(32)

    def validate_csrf_token(self, token):
        return self.csrf_token == token

    def regenerate_tokens(self):
        self.generate_session_token()
        self.generate_csrf_token()
