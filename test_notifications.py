#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:5001"

def test_notifications_functionality():
    """Test the notifications functionality"""
    session = requests.Session()
    
    print("Testing Notifications Functionality...")
    print("=" * 50)
    
    # Step 1: Register a test user
    print("1. Registering a test user...")
    register_data = {
        'email': f'testnotifications_{datetime.now().strftime("%Y%m%d_%H%M%S")}@example.com',
        'password': 'TestPassword123!',
        'role': 'teacher'
    }
    
    response = session.post(f"{BASE_URL}/register", json=register_data)
    print(f"   Registration status: {response.status_code}")
    if response.status_code != 200:
        print(f"   ✗ Registration failed: {response.text}")
        return False
    print("   ✓ User registered successfully")
    
    # Step 2: Login
    print("2. Logging in...")
    login_data = {
        'email': register_data['email'],
        'password': register_data['password']
    }
    
    response = session.post(f"{BASE_URL}/login", json=login_data)
    print(f"   Login status: {response.status_code}")
    if response.status_code != 200:
        print(f"   ✗ Login failed: {response.text}")
        return False
    print("   ✓ Login successful")
    
    # Step 3: Create a future event for notifications
    print("3. Creating a future event...")
    future_date = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
    future_time = "14:00"
    
    event_data = {
        'title': 'Test Notification Event',
        'description': 'This event should appear in notifications',
        'priority': 1,
        'event_type': 'single',
        'start_time': f'{future_date}T{future_time}',
        'end_time': f'{future_date}T15:00',
        'tags': 'test,notification'
    }
    
    response = session.post(f"{BASE_URL}/event/create", json=event_data)
    print(f"   Event creation status: {response.status_code}")
    if response.status_code != 200:
        print(f"   ✗ Event creation failed: {response.text}")
        return False
    
    result = response.json()
    event_id = result.get('event_id')
    print(f"   ✓ Event created successfully with ID: {event_id}")
    
    # Step 4: Test notifications API
    print("4. Testing notifications API...")
    response = session.get(f"{BASE_URL}/api/notifications")
    print(f"   Notifications API status: {response.status_code}")
    if response.status_code != 200:
        print(f"   ✗ Failed to fetch notifications: {response.text}")
        return False
    
    notifications = response.json()
    print(f"   ✓ Found {len(notifications)} notifications")
    
    # Check if our test event appears in notifications
    test_event_found = False
    for notification in notifications:
        if notification['title'] == 'Test Notification Event':
            test_event_found = True
            print(f"   ✓ Test event found in notifications: {notification['title']}")
            print(f"     Time: {notification['time']}")
            print(f"     Priority: {notification['priority']}")
            break
    
    if not test_event_found:
        print("   ✗ Test event not found in notifications")
        print(f"   Available notifications: {[n['title'] for n in notifications]}")
        return False
    
    # Step 5: Test the old notifications route for backward compatibility
    print("5. Testing backward compatibility...")
    response = session.get(f"{BASE_URL}/notifications", headers={'X-Requested-With': 'XMLHttpRequest'})
    print(f"   Old notifications route status: {response.status_code}")
    if response.status_code == 200:
        old_notifications = response.json()
        print(f"   ✓ Old route works, found {len(old_notifications)} notifications")
    else:
        print(f"   ⚠ Old route failed: {response.text}")
    
    print("\n" + "=" * 50)
    print("✓ All notifications tests passed!")
    return True

if __name__ == "__main__":
    try:
        success = test_notifications_functionality()
        if success:
            print("\n🎉 Notifications functionality is working correctly!")
        else:
            print("\n❌ Some tests failed. Please check the issues above.")
    except Exception as e:
        print(f"\n💥 Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
