"""
Simple input validation utilities following existing codebase patterns
Provides security validation without changing application functionality
"""
import re
import html
from datetime import datetime

def validate_email(email):
    """
    Validate email format and sanitize input
    Returns sanitized email if valid, None if invalid
    Follows RFC 5321 standards for email validation
    """
    if not email or not isinstance(email, str):
        return None

    # Basic sanitization - escape HTML and normalize
    email = html.escape(email.strip().lower())

    # Length check - RFC 5321 limit
    if len(email) > 254:
        return None

    # Basic email pattern validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(email_pattern, email):
        return email
    return None

def validate_password(password):
    """
    Basic password validation for security
    Checks for null bytes, minimum/maximum length
    Returns True if password format is acceptable
    """
    if not password or not isinstance(password, str):
        return False

    # Security check - remove null bytes and validate length
    if '\x00' in password or len(password) < 8 or len(password) > 128:
        return False

    return True

def sanitize_string(value, max_length=1000):
    """
    Sanitize string input to prevent XSS and other attacks
    Removes dangerous characters, escapes HTML, limits length
    Returns clean string safe for database storage and display
    """
    if not value:
        return ""

    if not isinstance(value, str):
        value = str(value)

    # Remove null bytes and normalize line endings
    value = value.replace('\x00', '').replace('\r\n', '\n').replace('\r', '\n')

    # Basic HTML escape to prevent XSS
    value = html.escape(value.strip())

    # Limit length to prevent DoS attacks
    if len(value) > max_length:
        value = value[:max_length]

    return value

def validate_role(role):
    """
    Validate user role against allowed values
    Only allows predefined roles for security
    """
    if not isinstance(role, str):
        return False
    return role in ['student', 'teacher', 'admin']

def validate_priority(priority):
    """
    Validate event priority (0-3 range)
    Ensures priority is a valid integer within acceptable range
    """
    try:
        priority_int = int(priority)
        return 0 <= priority_int <= 3
    except (ValueError, TypeError):
        return False

def validate_datetime_string(dt_str, format_str="%Y-%m-%dT%H:%M"):
    """
    Validate datetime string format
    Ensures datetime strings match expected format before parsing
    """
    if not isinstance(dt_str, str):
        return False
    try:
        datetime.strptime(dt_str, format_str)
        return True
    except (ValueError, TypeError):
        return False

def validate_integer(value, min_val=None, max_val=None):
    """
    Validate integer within specified range
    Useful for validating numeric inputs with bounds checking
    """
    try:
        int_val = int(value)
        if min_val is not None and int_val < min_val:
            return False
        if max_val is not None and int_val > max_val:
            return False
        return True
    except (ValueError, TypeError):
        return False

def sanitize_tags(tags):
    """
    Sanitize tags input for safe storage and display
    Removes dangerous characters while preserving comma separators
    """
    if not tags:
        return ""

    # Basic sanitization with length limit
    tags = sanitize_string(tags, 500)

    # Remove potentially dangerous characters but preserve commas for tag separation
    tags = re.sub(r'[<>"\']', '', tags)

    return tags

def safe_get_json(request):
    """
    Safely parse JSON data from request
    Includes payload size limits to prevent DoS attacks
    Returns None if JSON is invalid or too large
    """
    try:
        data = request.get_json()
        if data is None:
            return None

        # Check for extremely large payloads (DoS protection)
        if len(str(data)) > 50000:  # 50KB limit
            return None

        return data
    except Exception:
        return None

def handle_db_error(operation="operation"):
    """
    Return generic error message for database errors
    Hides technical details from users for security
    """
    return {'error': 'Oops! Something went wrong.'}, 500

def handle_validation_error(message):
    """
    Return standardized validation error response
    Provides user-friendly error messages
    """
    return {'error': message}, 400
