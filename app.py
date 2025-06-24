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
    
    # Initialise db with the app
    db.init_app(app)

    # Create tables within app context
    with app.app_context():
        from models.event import Event
        from models.user import User
        db.create_all()

    # Injects csrf tokens into all templates (html files)
    @app.context_processor
    def inject_csrf_token():
        csrf_token = session.get('csrf_token')
        if not csrf_token:
            csrf_token = secrets.token_hex(32)
            session['csrf_token'] = csrf_token
        return dict(csrf_token=csrf_token)

    
    # base
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

        # CSRF
        if not request.is_json:
            csrf_token = request.form.get('csrf_token')
            if not csrf_token or csrf_token != session.get('csrf_token'):
                return "Invalid CSRF token", 403


        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            user.regenerate_tokens()
            db.session.commit()

            # Create a response object first
            response = make_response(redirect(url_for('dashboard')))

            # Set secure session cookie and Flask session data
            response.set_cookie(
                'session_token',
                user.session_token,
                httponly=True,
                secure=False, # set to false ONLY for testing because local servers do not return cookies (i think)
                samesite='Strict',
                max_age=2 * 60 * 60  # 2 hours
            )

            session['user_id'] = user.id
            session['user_role'] = user.role

            return response
    
    @app.route('/logout', methods=['POST', 'GET'])
    def logout():
        response = make_response(redirect(url_for('login')))
        response.set_cookie('session_token', '', expires=0)
        session.clear()
        return response


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

        csrf_token = request.form.get('csrf_token') # CSRF
        if not csrf_token or csrf_token != session.get('csrf_token'):
            return "Invalid CSRF token", 403

    @app.route('/profile')
    def profile():
        return render_template('profile.html')

    @app.route('/event/create', methods=['GET', 'POST'])
    def create_event():
        # Only allow teachers or admins to create events
        if session.get('user_role') not in ['teacher', 'admin']:
            return "Unauthorized", 403

        if request.method == 'GET':
            return render_template('create_event.html')

        # Handle POST request
        title = request.form.get('title')
        description = request.form.get('description')
        priority = request.form.get('priority')
        genre = request.form.get('genre')
        tags = request.form.get('tags')
        is_public = request.form.get('is_public') == 'on'

        start_time = request.form.get('start_time')
        end_time = request.form.get('end_time')

        # Convert datetime strings
        try:
            start_dt = datetime.strptime(start_time, "%Y-%m-%dT%H:%M")
            end_dt = datetime.strptime(end_time, "%Y-%m-%dT%H:%M")
        except ValueError:
            flash("Invalid date format.")
            return redirect(url_for('create_event'))

        # Create and save event
        event = Event(
            title=title,
            description=description,
            priority=int(priority),
            genre=genre,
            tags=tags,
            is_public=is_public,
            start_time=start_dt,
            end_time=end_dt,
            creator_id=session['user_id']
        )

        db.session.add(event)
        db.session.commit()

        return redirect(url_for('dashboard'))

   
    return app

if __name__ == "__main__": 
    app = create_app() 
    app.run(host='127.0.0.1', port=5000, debug=True)
