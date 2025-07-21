"""
Simple input validation utilities following existing codebase patterns
"""
import re
import html
from datetime import datetime

def validate_email(email):
    """Validate email format and sanitize"""
    if not email or not isinstance(email, str):
        return None
    
    # Basic sanitization
    email = html.escape(email.strip().lower())
    
    # Length check
    if len(email) > 254:  # RFC 5321 limit
        return None
    
    # Basic email pattern
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if re.match(email_pattern, email):
        return email
    return None

def validate_password(password):
    """Basic password validation"""
    if not password or not isinstance(password, str):
        return False
    
    # Remove null bytes and check length
    if '\x00' in password or len(password) < 8 or len(password) > 128:
        return False
    
    return True

def sanitize_string(value, max_length=1000):
    """Sanitize string input"""
    if not value:
        return ""
    
    if not isinstance(value, str):
        value = str(value)
    
    # Remove null bytes and control characters
    value = value.replace('\x00', '').replace('\r\n', '\n').replace('\r', '\n')
    
    # Basic HTML escape
    value = html.escape(value.strip())
    
    # Limit length
    if len(value) > max_length:
        value = value[:max_length]
    
    return value

def validate_role(role):
    """Validate user role"""
    if not isinstance(role, str):
        return False
    return role in ['student', 'teacher', 'admin']

def validate_priority(priority):
    """Validate event priority"""
    try:
        priority_int = int(priority)
        return 0 <= priority_int <= 3
    except (ValueError, TypeError):
        return False

def validate_datetime_string(dt_str, format_str="%Y-%m-%dT%H:%M"):
    """Validate datetime string format"""
    if not isinstance(dt_str, str):
        return False
    try:
        datetime.strptime(dt_str, format_str)
        return True
    except (ValueError, TypeError):
        return False

def validate_integer(value, min_val=None, max_val=None):
    """Validate integer within range"""
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
    """Sanitize tags input"""
    if not tags:
        return ""
    
    # Basic sanitization
    tags = sanitize_string(tags, 500)
    
    # Remove potentially dangerous characters but preserve commas
    tags = re.sub(r'[<>"\']', '', tags)
    
    return tags

def safe_get_json(request):
    """Safely get JSON data from request"""
    try:
        data = request.get_json()
        if data is None:
            return None
        
        # Check for extremely large payloads
        if len(str(data)) > 50000:  # 50KB limit
            return None
            
        return data
    except Exception:
        return None

def handle_db_error(operation="operation"):
    """Return generic error message for database errors"""
    return {'error': 'Oops! Something went wrong.'}, 500

def handle_validation_error(message):
    """Return validation error message"""
    return {'error': message}, 400
