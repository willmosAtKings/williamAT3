// Handle Create Event button click - navigate to create event page
document.querySelector('.create-button').addEventListener('click', function(e) {
  e.preventDefault();
  window.location.href = '/event/create';
});

// Function to load and display events on the dashboard
async function loadEvents() {
  try {
    const response = await fetch('/api/events');
    if (response.ok) {
      const events = await response.json();
      displayEvents(events);
    } else {
      console.error('Failed to load events');
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

// Function to display events on the calendar
function displayEvents(events) {
  // Clear existing events
  document.querySelectorAll('.event-item').forEach(item => item.remove());

  events.forEach(event => {
    const eventDate = new Date(event.start_time);
    const dayNumber = eventDate.getDate();

    // Find the corresponding day cell
    const dayCells = document.querySelectorAll('.day-cell');
    dayCells.forEach(cell => {
      const dayNumberElement = cell.querySelector('.day-number');
      if (dayNumberElement && parseInt(dayNumberElement.textContent) === dayNumber) {
        // Create event element
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
          <div class="event-title">${event.title}</div>
          <div class="event-time">${formatTime(event.start_time)}</div>
        `;

        // Add priority class for styling
        eventElement.classList.add(`priority-${event.priority}`);

        cell.appendChild(eventElement);
      }
    });
  });
}

// Helper function to format time
function formatTime(timeString) {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Load events when the page loads
document.addEventListener('DOMContentLoaded', function() {
  loadEvents();
});
