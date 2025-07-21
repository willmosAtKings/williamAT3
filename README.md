# School Calendar Web App - EventEase

<!-- Comprehensive documentation for the EventEase calendar application -->
<!-- This README provides setup instructions, feature overview, and technical details -->

An intelligent calendar web application built using Flask and SQLite. Designed for students, teachers, parents, and admins to collaboratively manage academic events, track assessments, and receive smart notifications.

## Table of Contents

- [Features](#features)  
- [Screenshots](#screenshots)  
- [Tech Stack](#tech-stack)  
- [Prerequisites](#prerequisites)  
- [Running The App](#running-the-app)  
- [Running Locally](#running-locally)  
- [File Structure Overview](#file-structure-overview)  
- [Upload & Parsing Process](#upload--parsing-process)  
- [Study Schedule Generation](#study-schedule-generation)  
- [Environment Variables](#environment-variables)  
- [Security Notes](#security-notes)  
- [Acknowledgements](#acknowledgements)

## Features

- Role-based login system (Student, Teacher, Parent, Admin)
- Full calendar UI with day/week/month views
- Event creation with attachments (PDFs, Docs, Slides)
- Recurring events with customisable frequency and start date
- Teacher-only private notes for internal use
- AI chatbot assistant to summarise and explain events
- Notification system filtered by class or year group
- Attendance tracking linked to calendar events
- Responsive layout with dynamic popout schedule sidebar

## Screenshots

_Screenshots coming soon._

## Tech Stack

- **Backend**: Python, Flask, SQLite, SQLAlchemy  
- **Frontend**: HTML, CSS, JavaScript (Vanilla), Jinja2  
- **Libraries**: Flask-Mail, Flask-Migrate, APScheduler  
- **AI**: ChatGPT integration for summarisation  
- **Dev Tools**: Alembic, python-dotenv

## Prerequisites

- Python 3.8+  
- Flask  
- SQLite (or another SQLAlchemy-compatible DB)  
- Virtual environment (recommended)  
- SMTP account for email notifications

## Running The App

### Initialize and migrate the database:

```bash
flask db upgrade
```

### Start the Flask development server:

```bash
flask run
```

## Running Locally

- Access the app at `http://127.0.0.1:5000`
- Login as different user roles to test permissions
- Use the calendar UI to create and manage events

## File Structure Overview

```text
/app.py               - Main Flask app & routes  
/extensions.py        - Extensions initialization (db, mail, scheduler)  
/models/              - Database models (User, Event, Notifications, Exceptions)  
/migrations/          - Alembic migration scripts  
/static/              - CSS, JS, images  
/templates/           - HTML templates with Jinja2  
/utils/               - Utility scripts (email sending, parsing)  
/scheduler.py         - Background job scheduler for notifications  
/dashboard.js         - Frontend calendar logic  
```

## Upload & Parsing Process

- Users can upload supporting files (PDF, Docs, Slides) when creating events  
- Files are validated and securely stored  
- Metadata (e.g. file title, creation date) is parsed to assist with tagging and scheduling

## Study Schedule Generation

- Study schedules can be created manually or with AI assistance  
- Schedules are tied to events on the calendar  
- Notifications help students stay on track with upcoming assessments and milestones

## Environment Variables

Create a `.env` file or configure these in your shell environment:

```env
MAIL_SERVER=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
SECRET_KEY=your_flask_secret_key
DATABASE_URL=sqlite:///app.db
```

## Security Notes

- Passwords are securely hashed using industry standards  
- Role-based access control prevents unauthorised actions  
- Session data is protected with Flask’s secret key  
- All uploaded files are validated and scanned before storage  
- HTTPS is recommended in production

## Acknowledgements

- My dad
- Rahul Singh Shankarling
