from models.user import User
from flask import session
from app import db

class AuthService:

    @staticmethod
    def login_user(email, password):
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            user.regenerate_tokens()
            db.session.commit()
            return user
        return None



    @staticmethod # can be called without instance of class created
    def logout():
        #user.session_token = None
        #db.session.commit()
        pass


    @staticmethod
    def get_current_user():
        # token = request.cookies.get('session_token')
        # if token:
        #     return User.query.filter_by(session_token=token).first()
        # return None
        pass

    @staticmethod
    def validate_csrf(user, token):
        if not user or not token:
            return False
        return user.validate_csrf_token(token)


    @staticmethod
    def is_authenticated():
        return 'user_id' in session

    @staticmethod
    def has_role(required_role):
        return session.get('user_role') == required_role
