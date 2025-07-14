from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, session, flash, json
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import secrets
from extensions import db
from datetime import datetime
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta  # Add to the top of your file



def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.secret_key = 'insanely-secret-key'
    
    # Initialise db with the app
    db.init_app(app)

    # Create tables within app context
    with app.app_context():
        from models.event import Event
        from models.user import User
        db.create_all()

    # Injects csrf tokens into all templates (html files) commented out for now
    # @app.context_processor
    # def inject_csrf_token():
    #     csrf_token = session.get('csrf_token')
    #     if not csrf_token:
    #         csrf_token = secrets.token_hex(32)
    #         session['csrf_token'] = csrf_token
    #     return dict(csrf_token=csrf_token)

    
    # base
    @app.route('/')
    def index():
        return render_template('login.html')

    @app.route("/dashboard", methods=["GET", "POST"])
    def dashboard():
        if request.method == "POST":
            # Example: redirect to the dashboard
            return redirect(url_for("dashboard"))  # or return something like jsonify(...)

        # Get current user information
        user_email = None
        if 'user_id' in session:
            from models.user import User
            user = db.session.get(User, session['user_id'])
            if user:
                user_email = user.email

        # For normal GET requests (page load)
        return render_template("dashboard.html", user_email=user_email)
 

    @app.route('/login', methods=['POST', 'GET'])
    def login():
        from models.user import User
        
        if request.method == 'GET':
            return render_template('login.html')
            
        # Get JSON data
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
        else:
            email = request.form.get('email')
            password = request.form.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        # CSRF
        # if not request.is_json:
        #     csrf_token = request.form.get('csrf_token')
        #     if not csrf_token or csrf_token != session.get('csrf_token'):
        #         return "Invalid CSRF token", 403


        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            user.regenerate_tokens()
            db.session.commit()

            session['user_id'] = user.id
            session['user_role'] = user.role

            response = make_response()  # create base response

            # Set session cookie
            response.set_cookie(
                'session_token',
                user.session_token,
                httponly=True,
                secure=False,
                samesite='Strict',
                max_age=2 * 60 * 60
            )

            if request.is_json:
                response.set_data(json.dumps({'message': 'Login successful', 'role': user.role}))
                response.headers['Content-Type'] = 'application/json'
                return response
            else:
                return redirect(url_for('dashboard'))

            
    
    @app.route('/logout', methods=['POST', 'GET'])
    def logout():
        response = make_response(redirect(url_for('login')))
        response.set_cookie('session_token', '', expires=0)
        session.clear()
        return response


    @app.route('/register', methods=['POST', 'GET'])
    def register():
        from models.user import User

        if request.method == 'GET':
            # csrf_token = secrets.token_hex(32)
            # session['csrf_token'] = csrf_token
            return render_template('register.html') #csrf_token=csrf_token)

        # Handle POST
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            username = data.get('username', email)
            role = data.get('role')
        else:
            email = request.form.get('email')
            password = request.form.get('password')
            username = request.form.get('username', email)
            role = request.form.get('role')



            # csrf_token = request.form.get('csrf_token')
            # if not csrf_token or csrf_token != session.get('csrf_token'):
            #     return "Invalid CSRF token", 403

        # Validate input
        if not email or not password or not role:
            return jsonify({'error': 'Missing fields'}), 400

        if role not in ['student', 'teacher']:
            return jsonify({'error': 'Invalid role'}), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409

        # Create new user
        new_user = User(username=username, email=email, password=password, role=role)
        db.session.add(new_user)
        db.session.commit()

        # Return response
        response = jsonify({'message': 'User created successfully', 'role': new_user.role})
        response.set_cookie(
            'session_token',
            new_user.session_token,
            httponly=True,
            secure=False,  # change to True lateer
            samesite='Strict',
            max_age=7200
        )
        return response




    @app.route('/event/create', methods=['GET', 'POST'])
    def create_event():
        # Only teachers can create events
        if session.get('user_role') != 'teacher':
            return jsonify({'error': 'Unauthorised'}), 403

        if request.method == 'GET':
            return render_template('create_event.html')

        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 415

        data = request.get_json()

        event_type = data.get('event_type')

        if event_type == 'recurring':
            required = ['title', 'start_time', 'end_time', 'rec_start_date', 'rec_ends', 'rec_interval', 'rec_unit']
            if not all(data.get(f) for f in required):
                return jsonify({'error': 'Missing recurring event fields'}), 400

            try:
                start_date = datetime.strptime(data['rec_start_date'], "%Y-%m-%d")
                end_date = datetime.strptime(data['rec_ends'], "%Y-%m-%d")
                start_time = datetime.fromisoformat(data['start_time']).time()
                end_time = datetime.fromisoformat(data['end_time']).time()
                interval = int(data['rec_interval'])
                unit = data['rec_unit']
                weekdays_list = data.get('rec_weekdays', [])  # Optional, only needed for weekly
            except Exception as e:
                return jsonify({'error': f'Invalid recurring event format: {str(e)}'}), 400

            current = start_date
            while current <= end_date:
                if unit == 'weekly' and weekdays_list:
                    # Only add events on selected weekdays
                    if current.strftime('%a').lower()[:3] not in [day.lower()[:3] for day in weekdays_list]:
                        current += timedelta(days=1)
                        continue

                start_dt = datetime.combine(current, start_time)
                end_dt = datetime.combine(current, end_time)

                event = Event(
                    title=data['title'],
                    description=data.get('description', ''),
                    priority=int(data.get('priority', 0)),
                    genre=data.get('genre', ''),
                    tags=data.get('tags', ''),
                    is_public=bool(data.get('is_public', False)),
                    start_time=start_dt,
                    end_time=end_dt,
                    creator_id=session['user_id']
                )
                db.session.add(event)

                # Increment current date
                if unit == 'daily':
                    current += timedelta(days=interval)
                elif unit == 'weekly':
                    current += timedelta(days=1)  # we loop day-by-day and filter by weekday
                elif unit == 'monthly':
                    current += relativedelta(months=interval)
                else:
                    return jsonify({'error': 'Invalid recurrence unit'}), 400

            db.session.commit()
            return jsonify({'message': 'Recurring events created successfully'}), 200



        else:
            # Single-day or multi-day event
            required = ['title', 'start_time', 'end_time']
            if not all(data.get(f) for f in required):
                return jsonify({'error': 'Missing required fields'}), 400

            try:
                start_dt = datetime.strptime(data['start_time'], "%Y-%m-%dT%H:%M")
                end_dt = datetime.strptime(data['end_time'], "%Y-%m-%dT%H:%M")
            except Exception:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DDTHH:MM'}), 400

            event = Event(
                title=data['title'],
                description=data.get('description', ''),
                priority=int(data.get('priority', 0)),
                genre=data.get('genre', ''),
                tags=data.get('tags', ''),
                is_public=bool(data.get('is_public', False)),
                start_time=start_dt,
                end_time=end_dt,
                creator_id=session['user_id']
            )

            db.session.add(event)
            db.session.commit()

            return jsonify({'message': 'Event created successfully', 'event_id': event.id}), 200

    

    @app.route('/profile/info')
    def profile():
        user_id = session.get('user_id')
        if user_id:
            user = db.session.get(User, user_id)
            return render_template('profile/info.html', user=user)
        return redirect('/login')
    
    @app.route('/profile/account')
    def account():
        return render_template('profile/account.html')
    
    @app.route('/profile/privacy')
    def privacy():
        return render_template('profile/privacy.html')
    
    @app.route('/profile/preferences')
    def preferences():
        return render_template('profile/preferences.html')
    




    @app.route('/api/events', methods=['GET'])
    def get_events():
        from models.event import Event

        # Get all public events or events created by the current user
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        user_id = session['user_id']

        # Query for public events or events created by the current user
        events = Event.query.filter(
            (Event.is_public == True) | (Event.creator_id == user_id)
        ).all()

        # Convert events to JSON format
        events_data = []
        for event in events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'priority': event.priority,
                'genre': event.genre,
                'tags': event.tags,
                'is_public': event.is_public,
                'start_time': event.start_time.isoformat() if event.start_time else None,
                'end_time': event.end_time.isoformat() if event.end_time else None,
                'creator_id': event.creator_id
            })

        return jsonify(events_data), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host='127.0.0.1', port=5001, debug=True)
