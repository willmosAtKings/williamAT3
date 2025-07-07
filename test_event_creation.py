#!/usr/bin/env python3
"""
Test script to verify event creation functionality
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:5001"

def test_event_creation_flow():
    """Test the complete event creation flow"""
    session = requests.Session()
    
    print("Testing Event Creation Flow...")
    print("=" * 50)
    
    # Step 1: Register a teacher user
    print("1. Registering a teacher user...")
    register_data = {
        "email": "teacher@test.com",
        "password": "testpass123",
        "username": "Test Teacher",
        "role": "teacher"
    }
    
    response = session.post(f"{BASE_URL}/register", json=register_data)
    print(f"   Registration status: {response.status_code}")
    if response.status_code == 200:
        print("   ✓ Teacher registered successfully")
    elif response.status_code == 409:
        print("   ✓ Teacher already exists, proceeding with login")
    else:
        print(f"   ✗ Registration failed: {response.text}")
        return False
    
    # Step 2: Login as teacher
    print("2. Logging in as teacher...")
    login_data = {
        "email": "teacher@test.com",
        "password": "testpass123"
    }
    
    response = session.post(f"{BASE_URL}/login", json=login_data)
    print(f"   Login status: {response.status_code}")
    if response.status_code == 200:
        print("   ✓ Login successful")
    else:
        print(f"   ✗ Login failed: {response.text}")
        return False
    
    # Step 3: Create an event
    print("3. Creating an event...")
    now = datetime.now()
    start_time = now + timedelta(days=1)
    end_time = start_time + timedelta(hours=2)
    
    event_data = {
        "title": "Test Event",
        "description": "This is a test event created by the test script",
        "priority": 1,
        "genre": "Academic",
        "tags": "test, automated",
        "is_public": True,
        "start_time": start_time.strftime("%Y-%m-%dT%H:%M"),
        "end_time": end_time.strftime("%Y-%m-%dT%H:%M")
    }
    
    response = session.post(f"{BASE_URL}/event/create", json=event_data)
    print(f"   Event creation status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        event_id = result.get('event_id')
        print(f"   ✓ Event created successfully with ID: {event_id}")
    else:
        print(f"   ✗ Event creation failed: {response.text}")
        return False
    
    # Step 4: Fetch events to verify it appears
    print("4. Fetching events to verify creation...")
    response = session.get(f"{BASE_URL}/api/events")
    print(f"   Fetch events status: {response.status_code}")
    if response.status_code == 200:
        events = response.json()
        print(f"   ✓ Found {len(events)} events")
        
        # Check if our test event is in the list
        test_event_found = False
        for event in events:
            if event['title'] == 'Test Event':
                test_event_found = True
                print(f"   ✓ Test event found: {event['title']} - {event['description']}")
                break
        
        if not test_event_found:
            print("   ✗ Test event not found in events list")
            return False
    else:
        print(f"   ✗ Failed to fetch events: {response.text}")
        return False
    
    print("\n" + "=" * 50)
    print("✓ All tests passed! Event creation functionality is working correctly.")
    return True

if __name__ == "__main__":
    try:
        success = test_event_creation_flow()
        if success:
            print("\n🎉 Event creation functionality is working correctly!")
        else:
            print("\n❌ Some tests failed. Please check the issues above.")
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
