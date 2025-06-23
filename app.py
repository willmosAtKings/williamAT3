from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import secrets
from extensions import db

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.secret_key = 'insanely-secret-key'
    
    # Initialize db with the app
    db.init_app(app)

    # Create tables within app context
    with app.app_context():
        from models.event import Event
        from models.user import User
        db.create_all()
    
    # Register routes
    @app.route('/')
    def index():
        return render_template('login.html')


    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard.html')       

    @app.route('/login', methods=['POST', 'GET'])
    def login():
        from models.user import User  # Import here to avoid circular imports
        
        if request.method == 'GET':
            return render_template('login.html')
            
        # Get JSON data
        if request.is_json:
            data = request.get_json()
            email = data.get('email') #
            password = data.get('password')
        else:
            email = request.form.get('email')
            password = request.form.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            user.regenerate_tokens()
            db.session.commit()
            
            # Set a secure session token as cookie
            return redirect(url_for('dashboard'))
            response.set_cookie('session_token', user.session_token, httponly=True, secure=True, samesite='Strict')
            session['user_id'] = user.id
            session['user_role'] = user.role
            return response
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    
    @app.route('/register', methods=['POST', 'GET'])
    def register():
        from models.user import User  # Import here to avoid circular imports
        
        if request.method == 'GET':
            csrf_token = secrets.token_hex(32)
            session['csrf_token'] = csrf_token
            return render_template('register.html', csrf_token=csrf_token)
            
        # Handle POST request
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            username = data.get('username', email)  # Use email as username if not provided
        else:
            email = request.form.get('email')
            password = request.form.get('password')
            username = request.form.get('username', email)

        if not email or not password:
            return jsonify({'error': 'Missing fields'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409

        # Create new user
        new_user = User(username=username, email=email, password=password, role="student")
        db.session.add(new_user)
        db.session.commit()

        # Create secure session cookie
        response = jsonify({'message': 'User created successfully'})
        response.set_cookie(
            'session_token',
            new_user.session_token,
            httponly=True,
            secure=True,
            samesite='Strict',
            max_age=7200
        )
        return response

    @app.route('/profile')
    def profile():
        return render_template('profile.html')

    @app.route('/events')
    def events():
        return render_template('events.html')

        
    return app

if __name__ == "__main__": 
    app = create_app() 
    app.run(debug=True)
