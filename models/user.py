import secrets  # for tokens
import os
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'student', 'teacher', 'admin'

    session_token = db.Column(db.String(64), unique=True, index=True)
    csrf_token = db.Column(db.String(64), unique=True, index=True)

    events = db.relationship("Event", backref="creator", lazy=True)

    def __init__(self, username, email, password, role):
        self.username = username
        self.email = email
        self.set_password(password)
        self.role = role
        self.generate_session_token()
        self.generate_csrf_token()

    # when called, sets password
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # checks if returning users password is correct
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # gerates session token
    def generate_session_token(self): # generated on login
        self.session_token = secrets.token_hex(32)

    # validates session token
    def validate_session_token(self, token):
        return self.session_token == token

    # generates CSRF token
    def generate_csrf_token(self): # generated on user request/when submitting actions
        self.csrf_token = secrets.token_hex(32)

    # validates CSRF token
    def validate_csrf_token(self, token):
        return self.csrf_token == token

    # call this method on login or logout to refresh tokens
    def regenerate_tokens(self):
        self.generate_session_token()
        self.generate_csrf_token()


# ADD HTTPOnly and Secure on frontend