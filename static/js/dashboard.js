// Handle Create Event button click - navigate to create event page
document.querySelector('.create-button').addEventListener('click', function(e) {
  e.preventDefault();
  window.location.href = '/event/create';
});

const calendarGrid = document.querySelector('.calendar-grid');
let currentDate = new Date();

// Function to update the date display based on current view and date
function updateDateDisplay() {
  const view = document.getElementById('calendarView').value;
  const dateDisplay = document.getElementById('currentDateDisplay');
  
  if (view === 'month') {
    dateDisplay.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (view === 'week') {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const formatOptions = { month: 'short', day: 'numeric' };
    dateDisplay.textContent = `${weekStart.toLocaleDateString('en-US', formatOptions)} - ${weekEnd.toLocaleDateString('en-US', formatOptions)}, ${currentDate.getFullYear()}`;
  } else if (view === 'day') {
    dateDisplay.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
}

// Function to load and display events based on current view
async function loadEventsForCurrentView() {
  const view = document.getElementById('calendarView').value;
  
  try {
    let start;
    if (view === 'month') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else {
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
      updateDateDisplay();
    } else {
      console.error('Failed to load events');
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

function renderMonthCalendar(date = new Date(), events = []) {
  // ... (This function remains unchanged)
  console.log('render MonthCalendar called');
  const calendarGrid = document.querySelector('.calendar-grid');
  calendarGrid.innerHTML = '';
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
        window.dispatchEvent(new CustomEvent('changeCreateEventDate', { detail: dateStr }));
      } else {
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
      eventDiv.innerHTML = `<div class="event-title">${event.title}</div><div class="event-time">${formatTime(event.start_time)}</div>`;
      cell.appendChild(eventDiv);
    });
    calendarGrid.appendChild(cell);
  }
}
  
function renderCalendar(events, view) {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';

  if (view === 'day' || view === 'week') {
    const hours = [...Array(24).keys()];
    const grid = document.createElement('div');
    grid.className = view === 'day' ? 'timeline-grid' : 'week-grid';

    // Create the time column (leftmost column)
    const timeColumn = document.createElement('div');
    timeColumn.className = 'time-column';
    const timeHeader = document.createElement('div');
    timeHeader.className = 'grid-header time-header';
    timeColumn.appendChild(timeHeader);
    hours.forEach(hour => {
      const hourLabel = document.createElement('div');
      hourLabel.className = 'hour-label';
      hourLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
      timeColumn.appendChild(hourLabel);
    });
    grid.appendChild(timeColumn);

    // Determine loop for days (1 for day view, 7 for week view)
    const daysToRender = view === 'day' ? 1 : 7;
    const startDay = view === 'day' ? currentDate : new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));

    for (let i = 0; i < daysToRender; i++) {
      const dayDate = new Date(startDay);
      dayDate.setDate(startDay.getDate() + i);
      
      const dayColumn = document.createElement('div');
      dayColumn.className = 'day-column';
      
      const dayHeader = document.createElement('div');
      dayHeader.className = 'grid-header day-header-label';
      if (dayDate.toDateString() === new Date().toDateString()) {
        dayHeader.classList.add('today');
      }
      dayHeader.innerHTML = `<div class="day-name">${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</div><div class="day-number">${dayDate.getDate()}</div>`;
      dayColumn.appendChild(dayHeader);
      
      hours.forEach(hour => {
        const hourCell = document.createElement('div');
        hourCell.className = 'hour-cell';
        
        const dayEvents = events.filter(ev => {
          const evStart = new Date(ev.start_time);
          const evEnd = new Date(ev.end_time);
          if (evStart.toDateString() !== dayDate.toDateString()) return false;
          const hourStart = new Date(dayDate);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(dayDate);
          hourEnd.setHours(hour + 1, 0, 0, 0);
          return evStart < hourEnd && evEnd > hourStart;
        });
        
        dayEvents.forEach(ev => {
          const evStart = new Date(ev.start_time);
          const evEnd = new Date(ev.end_time);
          const item = document.createElement('div');
          item.className = `event-item priority-${ev.priority || 0}`;
          
          const startMinutes = evStart.getMinutes();
          const endMinutes = evEnd.getMinutes();
          
          if (evStart.getHours() === hour) {
            item.style.top = `${(startMinutes / 60) * 100}%`;
            const duration = (evEnd.getTime() - evStart.getTime()) / (1000 * 60);
            item.style.height = `${(duration / 60) * 100}%`;
          } else { // Event starts before this hour
            item.style.top = '0%';
            const duration = (evEnd.getTime() - new Date(dayDate.setHours(hour, 0, 0, 0)).getTime()) / (1000 * 60);
            item.style.height = `${(duration / 60) * 100}%`;
          }
          
          item.innerHTML = `<div class="event-title">${ev.title}</div><div class="event-time">${formatTime(ev.start_time)}</div>`;
          hourCell.appendChild(item);
        });
        dayColumn.appendChild(hourCell);
      });
      grid.appendChild(dayColumn);
    }
    container.appendChild(grid);

    // Add current time indicator
    const now = new Date();
    const todayColumn = Array.from(grid.querySelectorAll('.day-column .day-header-label')).find(h => h.classList.contains('today'));
    if (todayColumn) {
      const parentColumn = todayColumn.parentElement;
      const timePosition = (now.getHours() * 60 + now.getMinutes()) / (24 * 60) * 100;
      const timeLine = document.createElement('div');
      timeLine.className = 'current-time-line';
      timeLine.style.top = `calc(${timePosition}% + 40px)`; // 40px is header height
      parentColumn.appendChild(timeLine);
    }
  }
}

// Helper function to format time
function formatTime(timeString) {
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Event Listeners
document.getElementById('calendarView').addEventListener('change', () => {
  document.querySelector('.calendar-grid').innerHTML = '';
  document.getElementById('calendarContainer').innerHTML = '';
  const view = document.getElementById('calendarView').value;
  if (view === 'month') {
    document.querySelector('.calendar-grid').style.display = 'grid';
    document.getElementById('calendarContainer').style.display = 'none';
  } else {
    document.querySelector('.calendar-grid').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'block';
  }
  updateDateDisplay();
  loadEventsForCurrentView();
});

document.getElementById('prevMonth').addEventListener('click', () => {
  const view = document.getElementById('calendarView').value;
  if (view === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
  else if (view === 'day') currentDate.setDate(currentDate.getDate() - 1);
  else if (view === 'week') currentDate.setDate(currentDate.getDate() - 7);
  updateDateDisplay();
  loadEventsForCurrentView();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  const view = document.getElementById('calendarView').value;
  if (view === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
  else if (view === 'day') currentDate.setDate(currentDate.getDate() + 1);
  else if (view === 'week') currentDate.setDate(currentDate.getDate() + 7);
  updateDateDisplay();
  loadEventsForCurrentView();
});

document.addEventListener('DOMContentLoaded', function() {
  updateDateDisplay();
  loadEventsForCurrentView();
});
