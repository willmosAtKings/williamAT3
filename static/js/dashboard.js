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
      renderMonthCalendar(currentDate, events);
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

function renderMonthCalendar(date = new Date(), events = []) {
  console.log('render MonthCalendar called'); //
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
    
      if (window.location.pathname === '/event/create') {
        // Already on create_event page — just update the date
        window.dispatchEvent(new CustomEvent('changeCreateEventDate', { detail: dateStr }));
      } else {
        // Navigate to create_event page with date in query param
        window.location.href = `/event/create?date=${dateStr}`;
      }
    };
    

    cell.appendChild(dayNum);
    cell.appendChild(addBtn);

    const currentCellDate = new Date(year, month, day);
    currentCellDate.setHours(0, 0, 0, 0);
    
    const dayEvents = events.filter(ev => {
      const start = new Date(ev.start_time);
      const end = new Date(ev.end_time);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return currentCellDate >= start && currentCellDate <= end;
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
  
function renderCalendar(events, view) {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  if (view === 'day') {
    const now = new Date();
    const today = now.toDateString();
    const hours = [...Array(24).keys()];

    const grid = document.createElement('div');
    grid.className = 'timeline-grid';

    const hourLabels = document.createElement('div');
    hourLabels.className = 'hour-labels';

    const timeSlots = document.createElement('div');

    hours.forEach(hour => {
      const label = document.createElement('div');
      label.textContent = `${hour.toString().padStart(2, '0')}:00`;
      hourLabels.appendChild(label);

      const slot = document.createElement('div');
      slot.className = 'hour-slot';

      // Add events that match this hour
      const matching = events.filter(ev => {
        const evDate = new Date(ev.start_time);
        return evDate.toDateString() === today && evDate.getHours() === hour;
      });

      matching.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `
          <div class="event-title">${ev.title}</div>
          <div class="event-time">${formatTime(ev.start_time)}</div>
        `;
        slot.appendChild(item);
      });

      timeSlots.appendChild(slot);
    });

    grid.appendChild(hourLabels);
    grid.appendChild(timeSlots);
    container.appendChild(grid);

    addCurrentTimeLine(container);
  }
}

// Line which shows current time on calendar (day/week)
function addCurrentTimeLine(container) {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();

  const position = (hour * 60 + minutes) * (60 / 60); // 60px per hour

  const line = document.createElement('div');
  line.className = 'current-time-line';
  line.style.top = `${position}px`;

  container.appendChild(line);
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

document.getElementById('calendarView').addEventListener('change', async (e) => {
  const view = e.target.value;

  // get first day of the month
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  // Clear old content
  document.querySelector('.calendar-grid').innerHTML = '';
  document.getElementById('calendarContainer').innerHTML = '';

  // Toggle visibility
  if (view === 'month') {
    document.querySelector('.calendar-grid').style.display = 'grid';
    document.getElementById('calendarContainer').style.display = 'none';
  } else {
    document.querySelector('.calendar-grid').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'block';
  }

  try {
    const res = await fetch(`/api/events?range=${view}&start=${start}`);
    const events = await res.json();

    if (view === 'month') {
      renderMonthCalendar(currentDate, events);
    } else {
      renderCalendar(events, view);
    }
  } catch (err) {
    console.error("Failed to load events", err);
  }
});





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
