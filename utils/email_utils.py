from flask_mail import Message
from app import mail, app  # import your mail instance and app

def send_email(to, subject, body):
    with app.app_context():
        msg = Message(subject=subject, recipients=[to], body=body)
        mail.send(msg)
