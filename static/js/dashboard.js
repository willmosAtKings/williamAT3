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
      renderCalendar(currentDate, events);
    } else {
      console.error('Failed to load events');
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

const calendarGrid = document.querySelector('.calendar-grid');
const monthYear = document.getElementById('monthYear');

let currentDate = new Date();

function renderCalendar(date = new Date(), events = []) {
  console.log('renderCalendar called');
  const calendarGrid = document.querySelector('.calendar-grid');

  // Clear all children (headers + days)
  calendarGrid.innerHTML = '';

  // Re-add weekday headers
  const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const day of headers) {
    const header = document.createElement('div');
    header.classList.add('day-header');
    header.textContent = day;
    calendarGrid.appendChild(header);
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  monthYear.textContent = date.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.classList.add('day-cell');

    const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
    const weekNumber = Math.floor((firstDayOfMonth + day - 1) / 7);

    cell.style.gridColumn = dayOfWeek + 1;
    cell.style.gridRow = weekNumber + 2;

    const dayNum = document.createElement('div');
    dayNum.classList.add('day-number');
    dayNum.textContent = day;

    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.classList.add('add-event-btn');
    addBtn.onclick = () => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      window.location.href = `/event/create?date=${dateStr}`;
    };

    cell.appendChild(dayNum);
    cell.appendChild(addBtn);

    const dayEvents = events.filter(ev => {
      const evDate = new Date(ev.start_time);
      return (
        evDate.getFullYear() === year &&
        evDate.getMonth() === month &&
        evDate.getDate() === day
      );
    });

    dayEvents.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.classList.add('event-item', `priority-${event.priority}`);
      eventDiv.innerHTML = `
        <div class="event-title">${event.title}</div>
        <div class="event-time">${formatTime(event.start_time)}</div>
      `;
      cell.appendChild(eventDiv);
    });

    calendarGrid.appendChild(cell);
  }
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

document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  loadEvents();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  loadEvents();
});
