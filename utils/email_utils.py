# Email utility functions for sending notifications
from flask_mail import Mail, Message

# Initialize Mail extension without app context (prevents circular imports)
mail = Mail()

def init_mail(app):
    """
    Initialize Flask-Mail with the application context
    Called during app creation to configure email settings

    Args:
        app: Flask application instance with email configuration
    """
    mail.init_app(app)

def send_email(app, to, subject, body):
    """
    Send email notification to a user
    Used for event reminders and system notifications

    Args:
        app: Flask application instance for context
        to: Recipient email address
        subject: Email subject line
        body: Email body content (plain text)
    """
    with app.app_context():
        # Create and send email message
        msg = Message(subject=subject, recipients=[to], body=body)
        mail.send(msg)
