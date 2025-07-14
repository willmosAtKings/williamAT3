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
    // Display the selected date
    const selectedDay = currentDate.toDateString();
    const hours = [...Array(24).keys()];

    // Add date display at the top
    const dateHeader = document.createElement('h3');
    dateHeader.textContent = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    container.appendChild(dateHeader);

    const grid = document.createElement('div');
    grid.className = 'timeline-grid';

    const hourLabels = document.createElement('div');
    hourLabels.className = 'hour-labels';

    const timeSlots = document.createElement('div');
    timeSlots.className = 'time-slots';

    hours.forEach(hour => {
      const label = document.createElement('div');
      label.textContent = `${hour.toString().padStart(2, '0')}:00`;
      hourLabels.appendChild(label);

      const slot = document.createElement('div');
      slot.className = 'hour-slot';

      // Add events that match this hour or span across it
      const matching = events.filter(ev => {
        const evStart = new Date(ev.start_time);
        const evEnd = new Date(ev.end_time);
        
        // Check if event is on the selected day
        if (evStart.toDateString() !== selectedDay && evEnd.toDateString() !== selectedDay) {
          return false;
        }
        
        // Check if event starts or spans this hour
        const hourStart = new Date(currentDate);
        hourStart.setHours(hour, 0, 0, 0);
        
        const hourEnd = new Date(currentDate);
        hourEnd.setHours(hour, 59, 59, 999);
        
        return (evStart <= hourEnd && evEnd >= hourStart);
      });

      matching.forEach(ev => {
        const evStart = new Date(ev.start_time);
        const evEnd = new Date(ev.end_time);
        
        const item = document.createElement('div');
        item.className = `event-item priority-${ev.priority || 0}`;
        
        // Calculate position and height based on start/end times
        if (evStart.getHours() === hour) {
          // Event starts in this hour
          const minutesOffset = evStart.getMinutes();
          item.style.top = `${minutesOffset}px`;
          
          // Calculate duration in minutes (capped to this hour if spanning multiple)
          const endMinute = evEnd.getHours() > hour ? 59 : evEnd.getMinutes();
          const duration = endMinute - minutesOffset;
          
          // Set minimum height for very short events
          item.style.height = `${Math.max(duration, 25)}px`;
        } else if (evStart.getHours() < hour && evEnd.getHours() > hour) {
          // Event spans this entire hour
          item.style.top = '0px';
          item.style.height = '59px';
        }
        
        item.innerHTML = `
          <div class="event-title">${ev.title}</div>
          <div class="event-time">${formatTime(ev.start_time)} - ${formatTime(ev.end_time)}</div>
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
  
  // Update button labels based on view
  if (view === 'month') {
    document.getElementById('prevMonth').textContent = '←';
    document.getElementById('nextMonth').textContent = '→';
  } else if (view === 'week') {
    document.getElementById('prevMonth').textContent = '←';
    document.getElementById('nextMonth').textContent = '→';
  } else if (view === 'day') {
    document.getElementById('prevMonth').textContent = '←';
    document.getElementById('nextMonth').textContent = '→';
  }
  
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

  // Load events for the current view
  loadEventsForCurrentView();


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

// Update the click handlers for prev/next buttons
document.getElementById('prevMonth').addEventListener('click', () => {
  const view = document.getElementById('calendarView').value;
  
  if (view === 'month') {
    currentDate.setMonth(currentDate.getMonth() - 1);
  } else if (view === 'day') {
    currentDate.setDate(currentDate.getDate() - 1);
  } else if (view === 'week') {
    currentDate.setDate(currentDate.getDate() - 7);
  }
  
  loadEventsForCurrentView();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  const view = document.getElementById('calendarView').value;
  
  if (view === 'month') {
    currentDate.setMonth(currentDate.getMonth() + 1);
  } else if (view === 'day') {
    currentDate.setDate(currentDate.getDate() + 1);
  } else if (view === 'week') {
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  loadEventsForCurrentView();
});

// Helper function to load events based on current view
async function loadEventsForCurrentView() {
  const view = document.getElementById('calendarView').value;
  
  try {
    let start;
    if (view === 'month') {
      // First day of month for month view
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else {
      // Current date for day/week view
      start = new Date(currentDate);
    }
    
    const startStr = start.toISOString().split('T')[0];
    const response = await fetch(`/api/events?range=${view}&start=${startStr}`);
    
    if (response.ok) {
      const events = await response.json();
      
      if (view === 'month') {
        renderMonthCalendar(currentDate, events);
      } else {
        renderCalendar(events, view);
      }
    } else {
      console.error('Failed to load events');
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

