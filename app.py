from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, session, flash, json
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import secrets
from extensions import db
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_
from flask_migrate import Migrate

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.secret_key = 'insanely-secret-key'
    
    db.init_app(app)
    migrate = Migrate(app, db)

    with app.app_context():
        from models.event import Event
        from models.user import User

    # ... (routes for /, /dashboard, /login, /logout, /register remain the same) ...
    @app.route('/')
    def index():
        return render_template('login.html')

    @app.route("/dashboard", methods=["GET", "POST"])
    def dashboard():
        if request.method == "POST":
            return redirect(url_for("dashboard"))

        user_email = None
        if 'user_id' in session:
            from models.user import User
            user = db.session.get(User, session['user_id'])
            if user:
                user_email = user.email

        return render_template("dashboard.html", user_email=user_email)
 
    @app.route('/login', methods=['POST', 'GET'])
    def login():
        from models.user import User
        if request.method == 'GET':
            return render_template('login.html')
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
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
            session['user_id'] = user.id
            session['user_role'] = user.role
            response = make_response()
            response.set_cookie('session_token', user.session_token, httponly=True, secure=False, samesite='Strict', max_age=2 * 60 * 60)
            if request.is_json:
                response.set_data(json.dumps({'message': 'Login successful', 'role': user.role}))
                response.headers['Content-Type'] = 'application/json'
                return response
            else:
                return redirect(url_for('dashboard'))
        return jsonify({'error': 'Invalid credentials'}), 401

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
            return render_template('register.html')
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
        if not email or not password or not role:
            return jsonify({'error': 'Missing fields'}), 400
        if role not in ['student', 'teacher']:
            return jsonify({'error': 'Invalid role'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409
        new_user = User(username=username, email=email, password=password, role=role)
        db.session.add(new_user)
        db.session.commit()
        response = jsonify({'message': 'User created successfully', 'role': new_user.role})
        response.set_cookie('session_token', new_user.session_token, httponly=True, secure=False, samesite='Strict', max_age=7200)
        return response

    @app.route('/event/create', methods=['GET', 'POST'])
    def create_event():
        user_role = session.get('user_role')
        if user_role not in ['student', 'teacher', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 403

        if request.method == 'GET':
            # Pass the user's role to the template so the UI can be adjusted.
            return render_template('create_event.html', user_role=user_role)

        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 415
        
        data = request.get_json()
        
        tags = data.get('tags', '')
        if user_role == 'student':
            tags = '' # Force no tags for student-created events, making them private.

        event_type = data.get('event_type')
        if event_type == 'recurring':
            # ... (recurring logic is fine, just uses the new 'tags' variable) ...
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
                weekdays_list = data.get('rec_weekdays', [])
            except Exception as e:
                return jsonify({'error': f'Invalid recurring event format: {str(e)}'}), 400
            weekday_map = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
            current = start_date
            while current <= end_date:
                if unit == 'weekly' and weekdays_list:
                    current_weekday_code = weekday_map[current.weekday()]
                    if current_weekday_code not in weekdays_list:
                        current += timedelta(days=1)
                        continue
                start_dt = datetime.combine(current, start_time)
                end_dt = datetime.combine(current, end_time)
                event = Event(
                    title=data['title'],
                    description=data.get('description', ''),
                    priority=int(data.get('priority', 0)),
                    tags=tags, # Use the potentially modified tags
                    start_time=start_dt,
                    end_time=end_dt,
                    creator_id=session['user_id']
                )
                db.session.add(event)
                if unit == 'daily':
                    current += timedelta(days=interval)
                elif unit == 'weekly':
                    current += timedelta(days=1)
                elif unit == 'monthly':
                    current += relativedelta(months=interval)
                else:
                    return jsonify({'error': 'Invalid recurrence unit'}), 400
            db.session.commit()
            return jsonify({'message': 'Recurring events created successfully'}), 200
        else:
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
                tags=tags, # Use the potentially modified tags
                start_time=start_dt,
                end_time=end_dt,
                creator_id=session['user_id']
            )
            db.session.add(event)
            db.session.commit()
            return jsonify({'message': 'Event created successfully', 'event_id': event.id}), 200

    # ... (profile routes remain the same) ...
    @app.route('/profile/info')
    def profile():
        user_id = session.get('user_id')
        if user_id:
            from models.user import User
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
        from models.user import User
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login'))
        
        user = db.session.get(User, user_id)
        return render_template('profile/preferences.html', current_tags=user.profile_tags or '')

    @app.route('/api/profile/tags', methods=['POST'])
    def update_profile_tags():
        from models.user import User
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Invalid JSON'}), 400
        new_tags = data.get('tags', '')
        user.profile_tags = new_tags
        db.session.commit()
        return jsonify({'message': 'Your tags have been updated successfully!'}), 200

    @app.route('/api/events')
    def get_events():
        from models.event import Event
        from models.user import User

        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401

        if user.role == 'admin':
            query = Event.query
        else:
            user_tags = user.tags
            
            filter_conditions = [
                Event.creator_id == user.id
            ]
            
            if user_tags:
                for tag in user_tags:
                    filter_conditions.append(Event.tags.like(f'%{tag}%'))
            
            query = Event.query.filter(or_(*filter_conditions))

        range_type = request.args.get('range', 'month')
        start_str = request.args.get('start') or request.args.get('date')

        if start_str:
            try:
                start = datetime.fromisoformat(start_str)
                if range_type == 'day':
                    end = start + timedelta(days=1)
                elif range_type == 'week':
                    end = start + timedelta(days=7)
                else:
                    end = start + relativedelta(months=1)
                query = query.filter(Event.start_time >= start, Event.start_time < end)
            except Exception:
                return jsonify({'error': 'Invalid date format'}), 400

        events = query.all()

        return jsonify([
            {
                'id': e.id,
                'title': e.title,
                'description': e.description,
                'priority': e.priority,
                'tags': e.tags,
                'start_time': e.start_time.isoformat(),
                'end_time': e.end_time.isoformat(),
                'creator_id': e.creator_id
            } for e in events
        ])

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host='127.0.0.1', port=5001, debug=True)
