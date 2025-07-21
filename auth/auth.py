# Authentication service for user management and security
import re
import html
from flask import session, request
from werkzeug.security import generate_password_hash
from extensions import db
from models.user import User

class AuthService:
    """
    Authentication service providing user login, registration, and session management
    Handles security tokens, CSRF protection, and role-based access control
    """

    @staticmethod
    def login_user(email, password):
        """
        Authenticate user with email and password
        Returns User object if successful, None if authentication fails
        Regenerates security tokens and creates session on successful login
        """
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            # Regenerate tokens for security on each login
            user.regenerate_tokens()
            db.session.commit()
            # Create session for authenticated user
            session['user_id'] = user.id
            session['user_role'] = user.role
            return user
        return None

    @staticmethod
    def register_user(email, password, username):
        """
        Register new user with validation and security checks
        Returns (success: bool, message: str) tuple
        Validates password strength, checks for duplicates, sanitizes input
        """
        try:
            # Basic field validation
            if not password or not email or not username:
                return False, "All fields are required"

            # Sanitize input to prevent XSS attacks
            email = html.escape(email.strip())
            username = html.escape(username.strip())
            password = password.strip()

            # Password strength validation - requires letters and numbers, min 8 chars
            password_pattern = re.compile(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$')
            if not password_pattern.match(password):
                return False, "Password must be at least 8 characters and contain both letters and numbers"

            # Check for existing username
            if User.query.filter_by(username=username).first():
                return False, "Username already exists"

            # Check for existing email
            if User.query.filter_by(email=email).first():
                return False, "Email already in use"

            # Create new user with hashed password
            hash_password = generate_password_hash(password)
            new_user = User(email=email, username=username, password_hash=hash_password)
            db.session.add(new_user)
            db.session.commit()
            return True, "User created successfully"

        except Exception as e:
            # Rollback on error and return failure
            db.session.rollback()
            print(f"Registration error: {str(e)}")
            return False, f"Registration failed: {str(e)}"

    @staticmethod
    def logout():
        """
        Log out current user by clearing session and invalidating tokens
        Ensures secure logout by removing session token from database
        """
        user = AuthService.get_current_user()
        if user:
            # Invalidate session token for security
            user.session_token = None
            db.session.commit()
        # Clear all session data
        session.clear()

    @staticmethod
    def get_current_user():
        """
        Get currently authenticated user from session or cookie token
        Checks both cookie-based and session-based authentication
        Returns User object or None if not authenticated
        """
        # First try cookie-based authentication
        token = request.cookies.get('session_token')
        if token:
            return User.query.filter_by(session_token=token).first()
        # Fall back to session-based authentication
        elif 'user_id' in session:
            return User.query.get(session['user_id'])
        return None

    @staticmethod
    def validate_csrf(user, token):
        """
        Validate CSRF token for security against cross-site request forgery
        Returns True if token is valid for the given user
        """
        return user and token and user.validate_csrf_token(token)

    @staticmethod
    def is_authenticated():
        """Check if user is currently authenticated via session"""
        return 'user_id' in session

    @staticmethod
    def has_role(required_role):
        """Check if current user has the specified role"""
        return session.get('user_role') == required_role
