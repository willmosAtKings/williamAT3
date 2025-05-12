from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from models.user import User, Task

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///school.db"
    db.init_app(app)

    from models.user import User
    from models.event import Event
    with app.app_context():
        db.create_all()

    return app

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/')
def dashboard():
    return render_template('dashboard')

@app.route('/')
def profile():
    # add logic to route to student/teacher profiles becuase they ahve differnet permissions
    return render_template('profile')

@app.route('/')
def events():
    return render_template('events')

if __name__ == "__main__":
    app.run(debug=True)
