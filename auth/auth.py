import re
import html
from flask import session, request
from werkzeug.security import generate_password_hash
from models.user import User
from app import db

class AuthService:

    @staticmethod
    def login_user(email, password):
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            user.regenerate_tokens()
            db.session.commit()
            session['user_id'] = user.id
            session['user_role'] = user.role
            return user
        return None

    @staticmethod
    def register_user(email, password, username):
        try:
            if not password or not email or not username:
                return False, "All fields are required"
            
            email = html.escape(email.strip())
            username = html.escape(username.strip())
            password = password.strip()

            password_pattern = re.compile(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$')
            if not password_pattern.match(password):
                return False, "Password must be at least 8 characters and contain both letters and numbers"

            if User.query.filter_by(username=username).first():
                return False, "Username already exists"
            
            if User.query.filter_by(email=email).first():
                return False, "Email already in use"

            hash_password = generate_password_hash(password)
            new_user = User(email=email, username=username, password_hash=hash_password)
            db.session.add(new_user)
            db.session.commit()
            return True, "User created successfully"

        except Exception as e:
            db.session.rollback()
            print(f"Registration error: {str(e)}")
            return False, f"Registration failed: {str(e)}"

    @staticmethod
    def logout():
        user = AuthService.get_current_user()
        if user:
            user.session_token = None
            db.session.commit()
        session.clear()

    @staticmethod
    def get_current_user():
        token = request.cookies.get('session_token')
        if token:
            return User.query.filter_by(session_token=token).first()
        elif 'user_id' in session:
            return User.query.get(session['user_id'])
        return None

    @staticmethod
    def validate_csrf(user, token):
        return user and token and user.validate_csrf_token(token)

    @staticmethod
    def is_authenticated():
        return 'user_id' in session

    @staticmethod
    def has_role(required_role):
        return session.get('user_role') == required_role
