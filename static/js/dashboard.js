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
    } else if (view === 'day') {
      // For day view, the start is the current date.
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    } else if (view === 'week') {
      // *** THIS IS THE FIX ***
      // For week view, the start MUST be the Sunday of that week.
      start = new Date(currentDate); // Create a copy
      start.setDate(start.getDate() - start.getDay()); // Go back to Sunday
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

// Helper function to navigate to a specific day
function navigateToDay(date) {
  // Create a new Date object to avoid reference issues
  const targetDate = new Date(date);
  console.log(`Navigating to day: ${targetDate.toDateString()}`);
  
  // Set the current date to the target day
  currentDate = targetDate;
  
  // Switch to day view
  document.getElementById('calendarView').value = 'day';
  
  // Toggle visibility
  document.querySelector('.calendar-grid').style.display = 'none';
  document.getElementById('calendarContainer').style.display = 'block';
  
  // Update display and load events
  updateDateDisplay();
  loadEventsForCurrentView();
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
        navigateToDay(clickedDate);
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
      
      // Add click handler to show event details
      eventDiv.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the cell click
        showEventDetails(event);
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
    const currentHour = now.getHours(); // Get the current hour
    console.log(`Current date for rendering: ${currentDate.toDateString()}, Current hour: ${currentHour}`);

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
      
      // Make day header clickable in week view to navigate to day view
      if (view === 'week') {
        dayHeader.style.cursor = 'pointer';
        dayHeader.addEventListener('click', () => {
          // Navigate to this specific day
          navigateToDay(dayDate);
        });
      }
      
      dayColumn.appendChild(dayHeader);
      
      // Create a container for the hour cells
      const hoursContainer = document.createElement('div');
      hoursContainer.className = 'hours-container';
      
      // Add hour cells to the container
      hours.forEach(hour => {
        const hourCell = document.createElement('div');
        hourCell.className = 'hour-cell';
        
        // Check if this is the current hour on the current day
        const isToday = dayDate.toDateString() === now.toDateString();
        if (isToday && hour === currentHour) {
            hourCell.classList.add('hour-cell-current');
            console.log(`Highlighting hour ${hour} as current`);
        }
        
        hoursContainer.appendChild(hourCell);
      });
      
      dayColumn.appendChild(hoursContainer);
      
      // Create a container for events
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'events-container';
      
      // Filter events for this day
      const dayEvents = events.filter(ev => {
        const evStart = new Date(ev.start_time);
        const evEnd = new Date(ev.end_time);
        
        // Set all dates to midnight for date comparison
        const evStartDay = new Date(evStart);
        evStartDay.setHours(0, 0, 0, 0);
        
        const evEndDay = new Date(evEnd);
        evEndDay.setHours(0, 0, 0, 0);
        
        const currentDayDate = new Date(dayDate);
        currentDayDate.setHours(0, 0, 0, 0);
        
        // Event is on this day if it starts on this day, ends on this day, or spans over this day
        return (
          evStartDay.getTime() <= currentDayDate.getTime() && 
          evEndDay.getTime() >= currentDayDate.getTime()
        );
      });
      
      console.log(`Found ${dayEvents.length} events for day ${dayDate.toDateString()}`);
      
      // Add events as continuous blobs
      dayEvents.forEach(ev => {
        const evStart = new Date(ev.start_time);
        const evEnd = new Date(ev.end_time);
        
        // Adjust start and end times if they're not on this day
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        // If event starts before this day, set start time to beginning of day
        const effectiveStart = evStart < dayStart ? dayStart : evStart;
        
        // If event ends after this day, set end time to end of day
        const effectiveEnd = evEnd > dayEnd ? dayEnd : evEnd;
        
        // Calculate position and height
        const startMinutes = effectiveStart.getHours() * 60 + effectiveStart.getMinutes();
        const endMinutes = effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes();
        
        const topPosition = startMinutes;
        const height = endMinutes - startMinutes;
        
        // Create the event element
        const eventItem = document.createElement('div');
        eventItem.className = `event-item priority-${ev.priority || 0}`;
        eventItem.style.top = `${topPosition}px`;
        eventItem.style.height = `${height}px`;
        
        eventItem.innerHTML = `
          <div class="event-title">${ev.title}</div>
          <div class="event-time">${formatTime(ev.start_time)} - ${formatTime(ev.end_time)}</div>
        `;
        
        // Add click handler to show event details
        eventItem.addEventListener('click', () => {
          showEventDetails(ev);
        });
        
        // Add the event to the events container
        eventsContainer.appendChild(eventItem);
      });
      
      dayColumn.appendChild(eventsContainer);
      
      // Add current time indicator if this is today
      if (dayDate.toDateString() === now.toDateString()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Calculate position in minutes from the top
        const timePosition = currentHour * 60 + currentMinute;
        
        const timeLine = document.createElement('div');
        timeLine.className = 'current-time-line';
        timeLine.style.top = `${timePosition}px`;
        
        // Add the line to the events container to ensure it's on top
        eventsContainer.appendChild(timeLine);
      }
      
      grid.appendChild(dayColumn);
    }
    container.appendChild(grid);
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

// Event modal functionality
const eventModal = document.getElementById('eventModal');
const closeModal = document.querySelector('.close-modal');

// Close the modal when clicking the X
closeModal.addEventListener('click', () => {
  eventModal.style.display = 'none';
});

// Close the modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === eventModal) {
    eventModal.style.display = 'none';
  }
});

// Function to format date range for display
function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if same day
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  } else {
    // Multi-day event
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
}

// Function to format recurrence pattern
function formatRecurrence(recurrence) {
  if (!recurrence) return '';
  
  let pattern = 'Repeats ';
  
  switch (recurrence.frequency) {
    case 'daily':
      pattern += 'every day';
      break;
    case 'weekly':
      pattern += 'every week';
      if (recurrence.days && recurrence.days.length > 0) {
        pattern += ` on ${recurrence.days.join(', ')}`;
      }
      break;
    case 'monthly':
      pattern += 'every month';
      if (recurrence.dayOfMonth) {
        pattern += ` on day ${recurrence.dayOfMonth}`;
      }
      break;
    case 'yearly':
      pattern += 'every year';
      break;
  }
  
  if (recurrence.until) {
    const untilDate = new Date(recurrence.until);
    pattern += ` until ${untilDate.toLocaleDateString()}`;
  } else if (recurrence.count) {
    pattern += ` for ${recurrence.count} occurrences`;
  }
  
  return pattern;
}

// Function to show event details in modal
function showEventDetails(event) {
  // Set event title and priority
  document.getElementById('eventTitle').textContent = event.title;
  
  const priorityBadge = document.getElementById('eventPriority');
  priorityBadge.textContent = ['Low', 'Medium', 'High'][event.priority] || 'Low';
  priorityBadge.className = 'event-badge ' + ['low', 'medium', 'high'][event.priority] || 'low';
  
  // Set date and time
  document.getElementById('eventDate').textContent = formatDateRange(event.start_time, event.end_time);
  
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  document.getElementById('eventTime').textContent = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
  
  // Handle recurrence
  const recurrenceInfo = document.getElementById('eventRecurrenceInfo');
  if (event.is_recurring && event.recurrence) {
    recurrenceInfo.style.display = 'flex';
    document.getElementById('eventRecurrence').textContent = formatRecurrence(event.recurrence);
  } else {
    recurrenceInfo.style.display = 'none';
  }
  
  // Set description
  document.getElementById('eventDescription').textContent = event.description || 'No description provided.';
  
  // Set tags
  const tagsContainer = document.getElementById('eventTags');
  tagsContainer.innerHTML = '';
  
  if (event.tags) {
    let tags = [];
    if (typeof event.tags === 'string') {
      tags = event.tags.split(',').map(tag => tag.trim());
    } else if (Array.isArray(event.tags)) {
      tags = event.tags;
    }
    
    tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'tag';
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });
  }
  
  // Set up edit and delete buttons
  document.getElementById('editEventBtn').onclick = () => {
    window.location.href = `/event/edit/${event.id}`;
  };
  
  document.getElementById('deleteEventBtn').onclick = () => {
    if (confirm('Are you sure you want to delete this event?')) {
      fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      }).then(response => {
        if (response.ok) {
          eventModal.style.display = 'none';
          loadEventsForCurrentView(); // Refresh the calendar
        } else {
          alert('Failed to delete event');
        }
      }).catch(error => {
        console.error('Error deleting event:', error);
        alert('An error occurred while deleting the event');
      });
    }
  };
  
  // Show the modal
  eventModal.style.display = 'block';
}
