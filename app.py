from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash #
from flask import make_response #
from auth.auth import AuthService




db = SQLAlchemy()

def create_app():

    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db" # creates an instance of my database - app.db (can be opened by sqllite)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)

    from models.user import User # creates pyc files for python to use, dw about them
    from models.event import Event
    with app.app_context():
        db.create_all()

    @app.route('/')
    def index(): # route funtions are not accessed but this is fine
        return render_template('register.html')

    @app.route('/login', methods = ['POST', 'GET'])
    def login():
        if request.method == "POST":
            username = request.form["username"]
            password = request.form["password"]
        if AuthService.login(username, password):
            return redirect(url_for(""))
        else:
            return "Login failed", 401
        
        return render_template("login.html")
    
    @app.route('/logout')
    def logout():
        token = request.cookies.get('session_token')
        user = User.query.filter_by(session_token=token).first()
        if user:
            user.session_token = None
            db.session.commit()
        response = make_response(redirect('/login'))
        response.delete_cookie('session_token')
        return response

    @app.route('/register', methods=['POST', 'GET'])
    def register():
        if request.method == 'POST':
            username = request.form.get('username')
            email = request.form.get('email') # btw i REALLY love rocco... - rahul Shankarling II, son of Pramod Shankarling
            password = request.form.get('password')

            if not username or not email or not password:
                return "Missing fields", 400

            if User.query.filter_by(username=username).first():
                return "Username already exists", 409

            hashed_password = generate_password_hash(password)
            new_user = User(username=username, email=email, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()

            return redirect(url_for('login'))  # or wherever you want to send them

        return render_template('register.html')  # Your HTML form


    @app.route('/profile')
    def profile():
        # add logic to route to student/teacher profiles becuase they ahve differnet permissions
        return render_template('profile.html')

    @app.route('/events')
    def events():
        return render_template('events.html')

    return app



if __name__ == "__main__": 
    app = create_app() 
    app.run(debug=True)
