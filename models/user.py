import secrets
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'student', 'teacher', 'admin'

    # This will store user-chosen tags like "chess-club,year-12" as a string.
    profile_tags = db.Column(db.String(255), nullable=True)

    session_token = db.Column(db.String(64), unique=True, index=True)
    session_expiry = db.Column(db.DateTime, nullable=True)
    csrf_token = db.Column(db.String(64), unique=True, index=True)

    events = db.relationship("Event", backref="creator", lazy=True)

    # This property now combines role-based tags with profile tags.
    @property
    def tags(self):
        # Start with a set to automatically handle duplicates.
        # Add the 'public' tag and the user's role as a tag.
        user_tags_set = {'public', self.role.lower()}
        
        # If the user has saved any profile tags, add them to the set.
        if self.profile_tags:
            # Split the string into a list, stripping any extra whitespace.
            extra_tags = [tag.strip() for tag in self.profile_tags.split(',')]
            user_tags_set.update(extra_tags)
            
        # Return the final, unique list of tags.
        return list(user_tags_set)

    def __init__(self, email, password, role):
        self.email = email.strip()
        self.set_password(password)
        self.role = role
        self.regenerate_tokens()

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_session_token(self):
        self.session_token = secrets.token_hex(32)
        self.session_expiry = datetime.utcnow() + timedelta(hours=2)

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
