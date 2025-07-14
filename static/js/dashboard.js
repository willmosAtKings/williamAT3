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
  console.log(`Loading events for ${view} view, currentDate: ${currentDate.toDateString()}`);
  
  try {
    let start;
    if (view === 'month') {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else {
      // Create a new Date object to avoid reference issues
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    }
    
    // Format the date correctly - YYYY-MM-DD
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    console.log(`API call: /api/events?range=${view}&start=${startStr}`);
    
    const response = await fetch(`/api/events?range=${view}&start=${startStr}`);
    
    if (response.ok) {
      const events = await response.json();
      console.log(`Received ${events.length} events:`, events);
      
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
    
    // Make the entire cell clickable to navigate to day view
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', (e) => {
      // Only navigate if the click wasn't on the add button or an event
      if (!e.target.classList.contains('add-event-btn') && 
          !e.target.closest('.event-item') &&
          !e.target.classList.contains('event-title') &&
          !e.target.classList.contains('event-time')) {
        
        // Create a new Date object for the clicked day to avoid reference issues
        const clickedDate = new Date(year, month, day);
        console.log(`Clicked on day: ${clickedDate.toDateString()}`);
        
        // Set the current date to this day
        currentDate = clickedDate;
        
        // Switch to day view
        document.getElementById('calendarView').value = 'day';
        
        // Toggle visibility
        document.querySelector('.calendar-grid').style.display = 'none';
        document.getElementById('calendarContainer').style.display = 'block';
        
        // Update display
        updateDateDisplay();
        
        // Force a new fetch of events specifically for this day
        (async () => {
          try {
            // Format the date correctly - YYYY-MM-DD
            const startStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`;
            console.log(`Fetching events for day view, date: ${clickedDate.toDateString()}, start: ${startStr}`);
            
            const response = await fetch(`/api/events?range=day&start=${startStr}`);
            
            if (response.ok) {
              const events = await response.json();
              console.log(`Received ${events.length} events for day view:`, events);
              
              // Filter events for this specific day
              const dayEvents = events.filter(ev => {
                const evStart = new Date(ev.start_time);
                const evEnd = new Date(ev.end_time);
                
                // Set all dates to midnight for date comparison
                const evStartDay = new Date(evStart);
                evStartDay.setHours(0, 0, 0, 0);
                
                const evEndDay = new Date(evEnd);
                evEndDay.setHours(0, 0, 0, 0);
                
                const clickedDay = new Date(clickedDate);
                clickedDay.setHours(0, 0, 0, 0);
                
                // Event is on this day if it starts on this day, ends on this day, or spans over this day
                return (
                  evStartDay.getTime() <= clickedDay.getTime() && 
                  evEndDay.getTime() >= clickedDay.getTime()
                );
              });
              
              console.log(`Filtered to ${dayEvents.length} events for ${clickedDate.toDateString()}:`, dayEvents);
              renderCalendar(dayEvents, 'day');
            } else {
              console.error('Failed to load events for day view');
            }
          } catch (error) {
            console.error('Error loading events for day view:', error);
          }
        })();
      }
    });
    
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
    addBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent the cell click from triggering
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
      
      // Make sure clicking on events doesn't trigger the cell click
      eventDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        // You can add code here to view/edit the event if desired
      });
      
      cell.appendChild(eventDiv);
    });
    calendarGrid.appendChild(cell);
  }
}

function renderCalendar(events, view) {
  const container = document.getElementById('calendarContainer');
  container.innerHTML = '';
  
  console.log(`Rendering ${view} view with ${events.length} events`);

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
    const startDay = new Date(currentDate);
    if (view === 'week') {
        startDay.setDate(currentDate.getDate() - currentDate.getDay());
    }

    const now = new Date();
    console.log(`Current date for rendering: ${currentDate.toDateString()}`);

    for (let i = 0; i < daysToRender; i++) {
      const dayDate = new Date(startDay);
      dayDate.setDate(startDay.getDate() + i);
      console.log(`Rendering day: ${dayDate.toDateString()}`);
      
      const dayColumn = document.createElement('div');
      dayColumn.className = 'day-column';
      
      const dayHeader = document.createElement('div');
      dayHeader.className = 'grid-header day-header-label';
      if (dayDate.toDateString() === now.toDateString()) {
        dayHeader.classList.add('today');
      }
      dayHeader.innerHTML = `<div class="day-name">${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</div><div class="day-number">${dayDate.getDate()}</div>`;
      dayColumn.appendChild(dayHeader);
      
      let totalEventsForDay = 0;
      
      hours.forEach(hour => {
        const hourCell = document.createElement('div');
        hourCell.className = 'hour-cell';
        
        if (dayDate.toDateString() === now.toDateString() && hour === now.getHours()) {
            hourCell.classList.add('hour-cell-current');
        }
        
        // Simplified event filtering
        const dayEvents = events.filter(ev => {
          const evStart = new Date(ev.start_time);
          const evEnd = new Date(ev.end_time);
          
          // Check if the event overlaps with this hour
          const hourStart = new Date(dayDate);
          hourStart.setHours(hour, 0, 0, 0);
          
          const hourEnd = new Date(dayDate);
          hourEnd.setHours(hour + 1, 0, 0, 0);
          
          return (evStart < hourEnd && evEnd > hourStart);
        });
        
        console.log(`Day ${dayDate.toDateString()}, Hour ${hour}: Found ${dayEvents.length} events`);
        totalEventsForDay += dayEvents.length;
        
        dayEvents.forEach(ev => {
          console.log(`Rendering event: ${ev.title} at ${ev.start_time}`);
          const evStart = new Date(ev.start_time);
          const evEnd = new Date(ev.end_time);
          const item = document.createElement('div');
          item.className = `event-item priority-${ev.priority || 0}`;
          
          let topPercent = 0;
          let heightPercent = 0;

          if (evStart.getHours() < hour) {
            topPercent = 0;
          } else if (evStart.getHours() === hour) {
            topPercent = (evStart.getMinutes() / 60) * 100;
          } else {
            // This shouldn't happen with our filtering, but just in case
            topPercent = 0;
          }

          if (evEnd.getHours() > hour + 1) {
            heightPercent = 100 - topPercent;
          } else if (evEnd.getHours() === hour + 1) {
            heightPercent = 100 - topPercent;
            if (evEnd.getMinutes() === 0) {
              // If it ends exactly at the next hour, fill the entire slot
              heightPercent = 100 - topPercent;
            } else {
              // If it ends within the next hour
              heightPercent = ((evEnd.getMinutes() / 60) * 100);
            }
          } else if (evEnd.getHours() === hour) {
            // Event starts and ends in the same hour
            heightPercent = ((evEnd.getMinutes() - evStart.getMinutes()) / 60) * 100;
          }

          // Ensure minimum height for visibility
          heightPercent = Math.max(heightPercent, 10);

          item.style.top = `${topPercent}%`;
          item.style.height = `${heightPercent}%`;
          
          item.innerHTML = `<div class="event-title">${ev.title}</div><div class="event-time">${formatTime(ev.start_time)}</div>`;
          hourCell.appendChild(item);
        });
        dayColumn.appendChild(hourCell);
      });
      
      console.log(`Total events for day ${dayDate.toDateString()}: ${totalEventsForDay}`);
      grid.appendChild(dayColumn);
    }
    container.appendChild(grid);

    // Add current time indicator
    const todayColumn = Array.from(grid.querySelectorAll('.day-column .day-header-label.today')).pop()?.parentElement;
    if (todayColumn) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Calculate position in pixels
      const timePosition = 40 + (currentHour * 60) + (currentMinute);
      
      const timeLine = document.createElement('div');
      timeLine.className = 'current-time-line';
      timeLine.style.top = `${timePosition}px`;
      todayColumn.appendChild(timeLine);
    }
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
