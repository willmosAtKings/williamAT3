from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash #
import secrets


db = SQLAlchemy()


def create_app():

    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db" # creates an instance of my database - app.db (can be opened by sqllite)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = 'insanely-secret-key'  # set a strong random secret key
    db.init_app(app)

    from models.user import User # creates pyc files for python to use, dw about them
    from auth.auth import AuthService  # Import here to avoid circular import

    with app.app_context():
        db.create_all()

    @app.route('/')
    def index(): # route funtions are not accessed but this is fine
        return render_template('login.html')    

    @app.route('/login', methods=['POST', 'GET'])
    def login():
        # Get and validate CSRF token
        csrf_token = request.headers.get('X-CSRF-Token')
        if not csrf_token or csrf_token != session.get('csrf_token'):
            return jsonify({'error': 'Invalid CSRF token'}), 403

        # Get JSON data
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        user = AuthService.login_user(email, password)
        if user:
            # Set a secure session token as cookie
            response = jsonify({'message': 'Login successful'})
            response.set_cookie('session_token', user.session_token, httponly=True, secure=True, samesite='Strict')
            session['user_id'] = user.id
            session['user_role'] = user.role
            return response
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    
    @app.route('/register', methods=['POST', 'GET'])
    def register():
        if request.method == 'POST':
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                return jsonify({'error': 'Missing fields'}), 400

            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'Email already exists'}), 409

            new_user = User(username=email, email=email, password=password, role="student")  # or role from frontend
            db.session.add(new_user)
            db.session.commit()

            # Create secure session cookie here
            response = jsonify({'message': 'User created successfully'})
            response.set_cookie(
                'session_token',
                new_user.session_token,
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=7200
            )
        if request.method == 'GET':
            csrf_token = secrets.token_hex(32)
            session['csrf_token'] = csrf_token
            return render_template('register.html', csrf_token=csrf_token)



    @app.route('/profile')
    def profile():
        # add logic to route to student/teacher profiles becuase they ahve differnet permissions
        return render_template('profile.html')

    @app.route('/events')
    def events():

        return render_template('events.html')
    

    @app.route('/event/<id>')
    def event_id():

        pass

    @app.route('/notifications')
    def notifs():
        pass

    @app.route('/chatbot')
    def chatbot():
        pass

    @app.route('/students/<id>/calendar')
    def student_id_cal():
        pass

    @app.route('/admin/users')
    def admin_users():
        pass

    return app



if __name__ == "__main__": 
    app = create_app() 
    app.run(debug=True)
