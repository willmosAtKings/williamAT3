# Flask extensions initialization
# This file centralizes extension objects to avoid circular imports

from flask_sqlalchemy import SQLAlchemy

# Database instance - initialized here and imported by other modules
# This pattern prevents circular import issues between app.py and models
db = SQLAlchemy()
