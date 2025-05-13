from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy


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
        return render_template('index.html')

    @app.route('/dashboard')
    def dashboard():
        return render_template('dashboard')

    @app.route('/profile')
    def profile():
        # add logic to route to student/teacher profiles becuase they ahve differnet permissions
        return render_template('profile')

    @app.route('/events')
    def events():
        return render_template('events')

    return app



if __name__ == "__main__": 
    app = create_app() 
    app.run(debug=True)
