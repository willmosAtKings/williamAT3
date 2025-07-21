# Database initialization script
# Run this script to create all database tables based on model definitions
# Usage: python create_db.py

from extensions import db

# Create all database tables defined in the models
# This reads the model definitions and creates corresponding SQL tables
db.create_all()
