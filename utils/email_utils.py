from flask_mail import Mail, Message

mail = Mail()  # Initialize Mail without an app

def init_mail(app):
    mail.init_app(app)  # Initialize Mail with the app context

def send_email(app, to, subject, body):
    with app.app_context():
        msg = Message(subject=subject, recipients=[to], body=body)
        mail.send(msg)
