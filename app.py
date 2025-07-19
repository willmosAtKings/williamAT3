from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, session, flash, json
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
import secrets
from extensions import db
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_, and_
from flask_migrate import Migrate
import uuid
import requests
import os
from google.oauth2 import service_account
import google.auth.transport.requests

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.secret_key = 'insanely-secret-key'
    
    db.init_app(app)
    migrate = Migrate(app, db)

    with app.app_context():
        from models.event import Event
        from models.user import User
        from models.event_exceptions import EventExceptions

    @app.route('/')
    def index():
        return render_template('login.html')
    
    @app.route("/dashboard", methods=["GET", "POST"])
    def dashboard():
        if 'user_id' not in session:
            if request.method == 'POST':
                return jsonify({'redirectTo': url_for('login')})
            return redirect(url_for('login'))

        from models.user import User
        user = db.session.get(User, session['user_id'])

        if not user:
            session.clear()
            if request.method == 'POST':
                return jsonify({'redirectTo': url_for('login')})
            return redirect(url_for('login'))

        if request.method == 'POST':
            return jsonify({'redirectTo': url_for('dashboard')})

        return render_template("dashboard.html", user_email=user.email, user_id=user.id, user_role=user.role)

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
            role = data.get('role')
        else:
            email = request.form.get('email')
            password = request.form.get('password')
            role = request.form.get('role')
        if not email or not password or not role:
            return jsonify({'error': 'Missing fields'}), 400
        if role not in ['student', 'teacher']:
            return jsonify({'error': 'Invalid role'}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        new_user = User(email=email, password=password, role=role)
        
        db.session.add(new_user)
        db.session.commit()
        response = jsonify({'message': 'User created successfully', 'role': new_user.role})
        response.set_cookie('session_token', new_user.session_token, httponly=True, secure=False, samesite='Strict', max_age=7200)
        return response

    @app.route('/event/create', methods=['GET', 'POST'])
    def create_event():
        user_role = session.get('user_role')
        if user_role not in ['student', 'teacher', 'admin']:
            return jsonify({'error': 'Unauthorised'}), 403

        if request.method == 'GET':
            return render_template('create_event.html', user_role=user_role)

        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 415
        
        data = request.get_json()
        
        tags = data.get('tags', '')
        if user_role == 'student':
            tags = ''
        
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
                weekdays_list = data.get('rec_weekdays', [])
            except Exception as e:
                return jsonify({'error': f'Invalid recurring event format: {str(e)}'}), 400

            if end_date < start_date:
                return jsonify({'error': 'End date cannot be before the start date.'}), 400
            
            limit_date = start_date + relativedelta(years=2)
            if end_date > limit_date:
                return jsonify({'error': 'Recurring events cannot extend more than 2 years.'}), 400

            recurrence_group_id = str(uuid.uuid4())
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
                    tags=tags,
                    start_time=start_dt,
                    end_time=end_dt,
                    is_recurring=True,
                    recurrence_group_id=recurrence_group_id,
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

            if end_dt <= start_dt:
                return jsonify({'error': 'End time must be after the start time.'}), 400

            event = Event(
                title=data['title'],
                description=data.get('description', ''),
                priority=int(data.get('priority', 0)),
                tags=tags,
                start_time=start_dt,
                end_time=end_dt,
                is_recurring=False,
                creator_id=session['user_id']
            )
            db.session.add(event)
            db.session.commit()
            return jsonify({'message': 'Event created successfully', 'event_id': event.id}), 200

    @app.route('/event/edit/<int:event_id>', methods=['GET'])
    def edit_event_page(event_id):
        from models.event import Event
        from models.user import User
        if 'user_id' not in session:
            return redirect(url_for('login'))
        user = db.session.get(User, session['user_id'])
        event = db.session.get(Event, event_id)
        if not event:
            flash('Event not found.', 'error')
            return redirect(url_for('dashboard'))
        can_edit = False
        if user.role == 'admin':
            can_edit = True
        elif user.role == 'teacher' and event.creator.role != 'student':
            can_edit = True
        elif user.role == 'student' and event.creator_id == user.id:
            can_edit = True
        if not can_edit:
            flash('You do not have permission to edit this event.', 'error')
            return redirect(url_for('dashboard'))
        return render_template('edit_event.html', event_id=event_id, user_role=user.role)

    @app.route('/api/event/<int:event_id>', methods=['GET', 'POST', 'DELETE'])
    def handle_event(event_id):
        from models.event import Event
        from models.user import User
        from models.event_exceptions import EventExceptions
        
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorised'}), 401
            
        user = db.session.get(User, session['user_id'])
        event = db.session.get(Event, event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
            
        can_modify = False
        if user.role == 'admin':
            can_modify = True
        elif user.role == 'teacher' and event.creator.role != 'student':
            can_modify = True
        elif user.role == 'student' and event.creator_id == user.id:
            can_modify = True

        if not can_modify:
            return jsonify({'error': 'Forbidden'}), 403

        if request.method == 'GET':
            return jsonify({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'priority': event.priority,
                'tags': event.tags,
                'start_time': event.start_time.isoformat(),
                'end_time': event.end_time.isoformat(),
                'is_recurring': event.is_recurring,
                'recurrence_group_id': event.recurrence_group_id
            })

        if request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Invalid JSON'}), 400

            if event.is_recurring and 'edit_scope' in data:
                edit_scope = data.get('edit_scope')
                
                try:
                    new_start = datetime.fromisoformat(data['start_time'])
                    new_end = datetime.fromisoformat(data['end_time'])
                    
                    # For 'all' or 'future' scopes, only allow time changes, not date changes
                    if edit_scope in ['all', 'future']:
                        if new_start.date() != event.start_time.date() or new_end.date() != event.end_time.date():
                            return jsonify({'error': 'For recurring events, you can only change the time, not the date.'}), 400
                    
                    if edit_scope == 'this':
                        # For 'this' scope, we allow date changes as it becomes an exception
                        original_date = datetime.strptime(data['original_date'], '%Y-%m-%d').date()
                        existing_exception = EventExceptions.query.filter_by(original_event_id=event.id, exception_date=original_date).first()
                        
                        if existing_exception:
                            exception = existing_exception
                        else:
                            exception = EventExceptions(original_event_id=event.id, exception_date=original_date)
                            db.session.add(exception)
                        
                        exception.title = data.get('title')
                        exception.description = data.get('description')
                        exception.priority = int(data.get('priority', 0))
                        if user.role in ['teacher', 'admin']:
                            exception.tags = data.get('tags', '')
                        exception.start_time = new_start
                        exception.end_time = new_end
                        
                        db.session.commit()
                        return jsonify({'message': 'This occurrence was updated successfully!'})
                    
                    else: # 'all' or 'future'
                        events_to_update_query = Event.query.filter_by(recurrence_group_id=event.recurrence_group_id)
                        if edit_scope == 'future':
                            original_date = datetime.strptime(data['original_date'], '%Y-%m-%d').date()
                            events_to_update_query = events_to_update_query.filter(Event.start_time >= datetime.combine(original_date, datetime.min.time()))
                        
                        # Store the original times before updating
                        original_start = event.start_time
                        original_end = event.end_time
                        
                        # Calculate the time difference between old and new times
                        # We only care about time difference, not date difference
                        time_delta = timedelta(
                            hours=new_start.hour - original_start.hour,
                            minutes=new_start.minute - original_start.minute,
                            seconds=new_start.second - original_start.second
                        )
                        
                        end_time_delta = timedelta(
                            hours=new_end.hour - original_end.hour,
                            minutes=new_end.minute - original_end.minute,
                            seconds=new_end.second - original_end.second
                        )
                        
                        for e in events_to_update_query.all():
                            e.title = data.get('title')
                            e.description = data.get('description')
                            e.priority = int(data.get('priority', 0))
                            if user.role in ['teacher', 'admin']:
                                e.tags = data.get('tags', '')
                            
                            # Apply the time shifts to each event (keeping the same date)
                            new_start_time = datetime.combine(e.start_time.date(), datetime.min.time()) + time_delta
                            new_end_time = datetime.combine(e.end_time.date(), datetime.min.time()) + end_time_delta
                            
                            e.start_time = new_start_time
                            e.end_time = new_end_time
                        
                        db.session.commit()
                        return jsonify({'message': 'The event series was updated successfully!'})
                except (KeyError, ValueError) as e:
                    return jsonify({'error': f'Invalid or missing date format: {str(e)}'}), 400
            else:
                event.title = data.get('title', event.title)
                event.description = data.get('description', event.description)
                event.priority = int(data.get('priority', event.priority))
                if user.role in ['teacher', 'admin']:
                    event.tags = data.get('tags', event.tags)
                try:
                    event.start_time = datetime.fromisoformat(data['start_time'])
                    event.end_time = datetime.fromisoformat(data['end_time'])
                except (KeyError, ValueError):
                    return jsonify({'error': 'Invalid or missing date format'}), 400
                if event.end_time <= event.start_time:
                    return jsonify({'error': 'End time must be after the start time.'}), 400
                db.session.commit()
                return jsonify({'message': 'Event updated successfully!'})

        if request.method == 'DELETE':
            scope = request.args.get('scope', 'single')
            print(f"DELETE request received for event {event_id}, scope: {scope}")
            
            if event.is_recurring and scope == 'all':
                # Get the recurrence_group_id from the event
                group_id = event.recurrence_group_id
                print(f"This is a recurring event with group_id: {group_id}")
                
                if group_id:
                    # Find and delete all events with this recurrence_group_id
                    events_to_delete = Event.query.filter_by(recurrence_group_id=group_id).all()
                    count = len(events_to_delete)
                    print(f"Found {count} events to delete with recurrence_group_id {group_id}")
                    
                    for e in events_to_delete:
                        print(f"Deleting event {e.id} with title '{e.title}'")
                        db.session.delete(e)
                    
                    db.session.commit()
                    return jsonify({'message': f'All {count} occurrences of the recurring event were deleted successfully.'})
                else:
                    # If somehow the event is marked recurring but has no group_id
                    db.session.delete(event)
                    db.session.commit()
                    return jsonify({'message': 'Event deleted successfully.'})
            
            elif event.is_recurring and scope == 'this':
                original_date = event.start_time.date()
                if request.args.get('original_date'):
                    try:
                        original_date = datetime.fromisoformat(request.args.get('original_date')).date()
                    except ValueError:
                        pass
                
                existing_exception = EventExceptions.query.filter_by(original_event_id=event.id, exception_date=original_date).first()
                if existing_exception:
                    exception = existing_exception
                else:
                    exception = EventExceptions(original_event_id=event.id, exception_date=original_date)
                    db.session.add(exception)
                
                exception.title = None
                exception.description = None
                exception.priority = None
                exception.tags = None
                exception.start_time = None
                exception.end_time = None
                
                db.session.commit()
                return jsonify({'message': 'This occurrence of the event was deleted.'})
            
            else:
                db.session.delete(event)
                db.session.commit()
                return jsonify({'message': 'Event deleted successfully.'})

    @app.route('/api/events')
    def get_events():
        from models.event import Event
        from models.user import User
        from models.event_exceptions import EventExceptions
        
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorised'}), 401
        
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Different query logic based on user role
        if user.role == 'admin':
            # Admins see all events
            query = Event.query
        elif user.role == 'teacher':
            # Teachers see all events EXCEPT those created by students
            # First, get all student user IDs
            student_ids = [u.id for u in User.query.filter_by(role='student').all()]
            
            # Then filter events to exclude those created by students
            if student_ids:  # Only apply filter if there are students
                query = Event.query.filter(~Event.creator_id.in_(student_ids))
            else:
                query = Event.query
        else:
            # Students and other roles see events based on tags
            user_tags = user.tags
            private_event_condition = and_(
                Event.creator_id == user.id,
                or_(Event.tags == '', Event.tags == None)
            )
            filter_conditions = [private_event_condition]
            if user_tags:
                for tag in user_tags:
                    filter_conditions.append(Event.tags.like(f'%{tag}%'))
            query = Event.query.filter(or_(*filter_conditions))
        
        # Rest of the function remains the same
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
                query = query.filter(
                    Event.start_time < end, 
                    Event.end_time > start
                )
            except Exception:
                return jsonify({'error': 'Invalid date format'}), 400
        
        events = query.all()
        
        # Process events and exceptions as before
        final_events = []
        processed_exceptions = set()

        # Get all relevant exceptions in one query
        event_ids = [e.id for e in events if e.is_recurring]
        exceptions = EventExceptions.query.filter(EventExceptions.original_event_id.in_(event_ids)).all() if event_ids else []
        exception_map = {}
        for exc in exceptions:
            key = (exc.original_event_id, exc.exception_date)
            exception_map[key] = exc

        for event in events:
            if event.is_recurring:
                exception = exception_map.get((event.id, event.start_time.date()))
                if exception:
                    processed_exceptions.add(exception.id)
                    if exception.title is None: # Deleted occurrence
                        continue
                    else: # Modified occurrence
                        final_events.append({
                            'id': event.id,
                            'title': exception.title,
                            'description': exception.description,
                            'priority': exception.priority,
                            'tags': exception.tags,
                            'start_time': exception.start_time.isoformat(),
                            'end_time': exception.end_time.isoformat(),
                            'creator_id': event.creator_id,
                            'creator_role': event.creator.role,
                            'is_recurring': True,
                            'recurrence_group_id': event.recurrence_group_id,
                            'is_exception': True
                        })
                else:
                    final_events.append({
                        'id': event.id,
                        'title': event.title,
                        'description': event.description,
                        'priority': event.priority,
                        'tags': event.tags,
                        'start_time': event.start_time.isoformat(),
                        'end_time': event.end_time.isoformat(),
                        'creator_id': event.creator_id,
                        'creator_role': event.creator.role,
                        'is_recurring': True,
                        'recurrence_group_id': event.recurrence_group_id
                    })
            else:
                final_events.append({
                    'id': event.id,
                    'title': event.title,
                    'description': event.description,
                    'priority': event.priority,
                    'tags': event.tags,
                    'start_time': event.start_time.isoformat(),
                    'end_time': event.end_time.isoformat(),
                    'creator_id': event.creator_id,
                    'creator_role': event.creator.role,
                    'is_recurring': False
                })
        
        return jsonify(final_events)

    @app.route('/profile/info')
    def profile_info():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        from models.user import User
        user = db.session.get(User, session['user_id'])
        
        if not user:
            session.clear()
            return redirect(url_for('login'))
        
        return render_template('profile/info.html', user=user)

    
    @app.route('/profile/account')
    def profile_account():
        return render_template('profile/account.html')

    @app.route('/profile/privacy')
    def profile_privacy():
        return render_template('profile/privacy.html')
    
    @app.route('/profile/preferences')
    def preferences():
        from models.user import User
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login'))
        
        user = db.session.get(User, user_id)
        # Pass the user's saved tags to the template
        return render_template('profile/preferences.html', current_tags=user.profile_tags or '')

    @app.route('/api/profile/tags', methods=['POST'])
    def update_profile_tags():
        from models.user import User
        
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorised'}), 401

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


    @app.route('/api/summarise', methods=['POST'])
    def summarise_event():
        data = request.json
        event_description = data.get('description', '')
        start_time = data.get('start_time', '')
        end_time = data.get('end_time', '')
        title = data.get('title', '')

        # Extract "items to bring" if mentioned (basic heuristic)
        items_to_bring = []
        description_lines = event_description.splitlines()
        for line in description_lines:
            if 'bring' in line.lower():
                parts = line.lower().split('bring', 1)[1].strip()
                items_to_bring = [item.strip() for item in parts.split(',') if item.strip()]
                break

        prompt_text = f"""
        Please summarise the following event, formatting your response using markdown. 
        Use bold headings for the Title and Time and Date sections. 
        List the items to bring as bullet points under an 'Items to bring' heading.

        **Title:** {title}

        **Time and Date:**  
        Start: {start_time}  
        End: {end_time}

        **Description:**  
        {event_description}

        """

        if items_to_bring:
            prompt_text += "**Items to bring:**\n"
            for item in items_to_bring:
                prompt_text += f"- {item}\n"
        else:
            prompt_text += "**Items to bring:** None specified\n"

        SERVICE_ACCOUNT_FILE = 'secrets/gemkey.json'
        SCOPES = ['https://www.googleapis.com/auth/generative-language']

        try:
            # Get bearer token from service account
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            auth_req = google.auth.transport.requests.Request()
            credentials.refresh(auth_req)
            access_token = credentials.token

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                "model": "models/gemini-1.5-flash",  # or gemini-1.5-pro
                "contents": [{
                    "parts": [{
                        "text": prompt_text
                    }]
                }]
            }

            response = requests.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                headers=headers,
                json=payload
            )

            if response.status_code == 200:
                candidates = response.json().get("candidates", [])
                summary = candidates[0]["content"]["parts"][0]["text"] if candidates else "No summary available."
                return jsonify({'summary': summary})
            else:
                print(f"Error: {response.status_code}, Response: {response.text}")
                return jsonify({'error': 'Failed to get summary'}), response.status_code

        except Exception as e:
            print(f"Exception occurred: {e}")
            return jsonify({'error': 'Internal server error'}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host='127.0.0.1', port=5001, debug=True)
