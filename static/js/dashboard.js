/*===== TAB SWITCHING FUNCTIONALITY =====*/

function toggleSchedulePanel() {
  const panel = document.getElementById('schedulePanel');
  const list = document.getElementById('notifications-list');

  panel.classList.toggle('hidden');

  // Only fetch events if the panel is now visible
  if (!panel.classList.contains('hidden')) {
    list.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading events...</span>
      </div>
    `;
    fetchUpcomingEvents();
  }
}


function switchTab(tabName) {
  // Remove active class from all tabs and content
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Add active class to selected tab and content
  document.getElementById(tabName + '-tab').classList.add('active');
  document.getElementById(tabName + '-content').classList.add('active');

  // Load content based on tab
  if (tabName === 'notifications') {
    loadNotifications();
  }
  
  const dateNav = document.getElementById('dateNavigation');
  if (tabName === 'notifications') {
    dateNav.style.display = 'none';
  } else {
    dateNav.style.display = 'flex';
  }

}

/*===== NOTIFICATIONS FUNCTIONALITY =====*/

async function loadSchedule() {
  const notificationsList = document.getElementById('notifications-list');

  try {
    const response = await fetch('/api/notifications');

    if (response.ok) {
      const data = await response.json();

      if (data.length === 0) {
        notificationsList.innerHTML = `
          <div class="no-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>No upcoming events in the next few days.</p>
          </div>
        `;
      } else {
        notificationsList.innerHTML = data.map(event => `
          <div class="notification-item priority-${event.priority}" onclick="handleNotificationClick(${event.id}, '${event.title.replace(/'/g, "\\'")}')">
            <div class="notification-item-title">${event.title}</div>
            <div class="notification-item-time">${event.time}</div>
            <div class="notification-item-description">${event.description}</div>
          </div>
        `).join('');
      }
    } else {
      throw new Error('Failed to load');
    }
  } catch (error) {
    notificationsList.innerHTML = `
      <div class="no-notifications">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading notifications.</p>
      </div>
    `;
  }
}

// Optional: function to handle clicking a notification (navigate to event page or open modal)
function handleNotificationClick(eventId, title) {
  window.location.href = `/event/${eventId}`;
  // Or trigger modal logic if you have one
}

function handleNotificationClick(eventId, eventTitle) {
  // If you still want to ensure the calendar/dashboard is visible,
  // you can put any code here to show the calendar view if needed.

  // Find and open the event modal for this event using the event ID
  setTimeout(() => {
    // First try to find by data-event-id attribute
    const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
    if (eventElement) {
      eventElement.click();
      return;
    }

    // Fallback: search by title in event items
    const eventElements = document.querySelectorAll('.event-item');
    for (let element of eventElements) {
      if (element.textContent.includes(eventTitle)) {
        element.click();
        break;
      }
    }
  }, 100);
}



document.addEventListener('DOMContentLoaded', function() {
  // Handle Create Event button click - navigate to create event page
  document.querySelector('.create-button').addEventListener('click', function(e) {
    e.preventDefault();
    const date = currentDate;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    window.location.href = `/event/create?date=${dateStr}`;
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
      } else if (view === 'day') {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      } else if (view === 'week') {
        start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
      }
      
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

      
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

  // Helper function to navigate to a specific day
  function navigateToDay(date) {
    const targetDate = new Date(date);
    currentDate = targetDate;
    document.getElementById('calendarView').value = 'day';
    document.querySelector('.calendar-grid').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'block';
    updateDateDisplay();
    loadEventsForCurrentView();
  }

  function renderMonthCalendar(date = new Date(), events = []) {
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
      
      cell.addEventListener('click', (e) => {
        if (!e.target.closest('.add-event-btn') && !e.target.closest('.event-item')) {
          navigateToDay(new Date(year, month, day));
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
        e.stopPropagation();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        window.location.href = `/event/create?date=${dateStr}`;
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
        
        eventDiv.addEventListener('click', (e) => {
          e.stopPropagation();
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

      if (view !== 'day' && view !== 'week') return;

      const hours = [...Array(24).keys()];
      const grid = document.createElement('div');
      grid.className = view === 'day' ? 'timeline-grid' : 'week-grid';

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

      const daysToRender = view === 'day' ? 1 : 7;
      const startDay = new Date(currentDate);
      if (view === 'week') {
          startDay.setDate(currentDate.getDate() - currentDate.getDay());
      }

      const now = new Date();

      for (let i = 0; i < daysToRender; i++) {
          const dayDate = new Date(startDay);
          dayDate.setDate(startDay.getDate() + i);
          
          const dayColumn = document.createElement('div');
          dayColumn.className = 'day-column';
          
          const dayHeader = document.createElement('div');
          dayHeader.className = 'grid-header day-header-label';
          if (dayDate.toDateString() === now.toDateString()) {
              dayHeader.classList.add('today');
          }
          dayHeader.innerHTML = `<div class="day-name">${dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</div><div class="day-number">${dayDate.getDate()}</div>`;
          if (view === 'week') {
              dayHeader.addEventListener('click', () => navigateToDay(dayDate));
          }
          dayColumn.appendChild(dayHeader);
          
          const hoursContainer = document.createElement('div');
          hoursContainer.className = 'hours-container';
          hours.forEach(hour => {
              const hourCell = document.createElement('div');
              hourCell.className = 'hour-cell';
              if (dayDate.toDateString() === now.toDateString() && hour === now.getHours()) {
                  hourCell.classList.add('hour-cell-current');
              }
              hoursContainer.appendChild(hourCell);
          });
          dayColumn.appendChild(hoursContainer);
          
          const eventsContainer = document.createElement('div');
          eventsContainer.className = 'events-container';

          const dayEvents = events
              .map(ev => ({ ...ev, start: new Date(ev.start_time), end: new Date(ev.end_time) }))
              .filter(ev => {
                  const dayStart = new Date(dayDate);
                  dayStart.setHours(0, 0, 0, 0);
                  const dayEnd = new Date(dayDate);
                  dayEnd.setHours(23, 59, 59, 999);
                  return ev.start < dayEnd && ev.end > dayStart;
              });
          
          dayEvents.sort((a, b) => a.start - b.start || b.end - a.end);

          const eventGroups = [];
          dayEvents.forEach(event => {
              let placed = false;
              for (const group of eventGroups) {
                  const lastEventInGroup = group[group.length - 1];
                  if (event.start >= lastEventInGroup.end) {
                      group.push(event);
                      placed = true;
                      break;
                  }
              }
              if (!placed) {
                  eventGroups.push([event]);
              }
          });

          dayEvents.forEach(event => {
              const overlappingEvents = dayEvents.filter(e => e.start < event.end && e.end > event.start);
              const columns = [];
              overlappingEvents.forEach(e => {
                  let placed = false;
                  for (const col of columns) {
                      if (!col.some(c => c.start < e.end && c.end > e.start)) {
                          col.push(e);
                          placed = true;
                          break;
                      }
                  }
                  if (!placed) {
                      columns.push([e]);
                  }
              });

              const totalColumns = columns.length;
              let eventColumn = -1;
              for (let i = 0; i < columns.length; i++) {
                  if (columns[i].includes(event)) {
                      eventColumn = i;
                      break;
                  }
              }

              const width = 100 / totalColumns;
              const left = eventColumn * width;

              const dayStart = new Date(dayDate);
              dayStart.setHours(0, 0, 0, 0);
              const effectiveStart = event.start < dayStart ? dayStart : event.start;
              const startMinutes = effectiveStart.getHours() * 60 + effectiveStart.getMinutes();
              const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
              const duration = Math.max(0, endMinutes - startMinutes);

              const eventItem = document.createElement('div');
              eventItem.className = `event-item priority-${event.priority || 0}`;
              eventItem.style.top = `${startMinutes}px`;
              eventItem.style.height = `${duration}px`;
              eventItem.style.left = `${left}%`;
              eventItem.style.width = `calc(${width}% - 4px)`;
              
              eventItem.innerHTML = `<div class="event-title">${event.title}</div><div class="event-time">${formatTime(event.start_time)} - ${formatTime(event.end_time)}</div>`;
              eventItem.addEventListener('click', () => showEventDetails(event));
              eventsContainer.appendChild(eventItem);
          });

          dayColumn.appendChild(eventsContainer);

          if (dayDate.toDateString() === now.toDateString()) {
              const timePosition = now.getHours() * 60 + now.getMinutes();
              const timeLine = document.createElement('div');
              timeLine.className = 'current-time-line';
              timeLine.style.top = `${timePosition}px`;
              eventsContainer.appendChild(timeLine);
          }
          
          grid.appendChild(dayColumn);
      }
      container.appendChild(grid);
  }

  function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

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

  const eventModal = document.getElementById('eventModal');
  const closeModal = document.querySelector('.close-modal');

  closeModal.addEventListener('click', () => {
    eventModal.style.display = 'none';
    document.getElementById('eventSummaryContainer').style.display = 'none';
    document.getElementById('eventSummaryText').textContent = '';
  });

  window.addEventListener('click', (event) => {
    if (event.target === eventModal) {
      eventModal.style.display = 'none';
      document.getElementById('eventSummaryContainer').style.display = 'none';
      document.getElementById('eventSummaryText').textContent = '';
    }
  });

  function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
  }

  function formatRecurrence(recurrence) {
    if (!recurrence) return '';
    
    let pattern = 'Repeats ';
    
    switch (recurrence.frequency) {
      case 'daily': pattern += 'every day'; break;
      case 'weekly': pattern += `every week on ${recurrence.days.join(', ')}`; break;
      case 'monthly': pattern += `every month on day ${recurrence.dayOfMonth}`; break;
      case 'yearly': pattern += 'every year'; break;
    }
    
    if (recurrence.until) {
      pattern += ` until ${new Date(recurrence.until).toLocaleDateString()}`;
    } else if (recurrence.count) {
      pattern += ` for ${recurrence.count} occurrences`;
    }
    
    return pattern;
  }

  const summariseBtn = document.getElementById('summariseBtn');
  if (summariseBtn) {
    summariseBtn.addEventListener('click', async () => {
      const summaryContainer = document.getElementById('summaryModal');
      const summaryText = document.getElementById('summaryResult');
      summaryContainer.style.display = 'block';
      summaryText.textContent = 'Loading summary...';

      try {
        const eventId = summariseBtn.getAttribute('data-event-id');

        const response = await fetch(`/api/event/${eventId}`);
        const eventData = await response.json();

        console.log('Sending summarise request');
        const summaryResponse = await fetch('/api/summarise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });

        if (!summaryResponse.ok) throw new Error('Failed to get summary');

        const summaryData = await summaryResponse.json();
        summaryText.innerHTML = marked.parse(summaryData.summary || 'No summary available.');

      } catch (error) {
        summaryText.textContent = 'Error loading summary. Please try again.';
        console.error('Error:', error);
      }
    });
  }

  function showEventDetails(event) {
    const currentUserRole = document.body.getAttribute('data-user-role');
    const currentUserId = parseInt(document.body.getAttribute('data-user-id'), 10);

    const eventId = event.id;
    const summariseBtn = document.getElementById('summariseBtn');
    summariseBtn.setAttribute('data-event-id', eventId);

    document.getElementById('eventTitle').textContent = event.title;
    const priorityBadge = document.getElementById('eventPriority');
    priorityBadge.textContent = ['Low', 'Medium', 'High'][event.priority] || 'Low';
    priorityBadge.className = 'event-badge ' + (['low', 'medium', 'high'][event.priority] || 'low');
    
    document.getElementById('eventDate').textContent = formatDateRange(event.start_time, event.end_time);
    document.getElementById('eventTime').textContent = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
    
    const recurrenceInfo = document.getElementById('eventRecurrenceInfo');
    if (event.is_recurring) {
      recurrenceInfo.style.display = 'flex';
      document.getElementById('eventRecurrence').textContent = `This is a recurring event.`;
    } else {
      recurrenceInfo.style.display = 'none';
    }
    
    document.getElementById('eventDescription').textContent = event.description || 'No description provided.';
    
    const tagsContainer = document.getElementById('eventTags');
    tagsContainer.innerHTML = '';
    if (event.tags) {
      const tags = typeof event.tags === 'string' ? event.tags.split(',').map(tag => tag.trim()) : event.tags;
      tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });
    }
    
    const editButton = document.getElementById('editEventBtn');
    let canEdit = false;

    if (currentUserRole === 'admin') {
      canEdit = true;
    } else if (currentUserRole === 'teacher' && event.creator_role !== 'student') {
      canEdit = true;
    } else if (currentUserRole === 'student' && event.creator_id === currentUserId) {
      canEdit = true;
    }

    if (canEdit) {
      editButton.style.display = 'inline-block';
      editButton.onclick = () => {
        window.location.href = `/event/edit/${event.id}`;
      };
    } else {
      editButton.style.display = 'none';
    }

    // Set up notification toggle
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationToggleText = document.getElementById('notificationToggleText');
    const notificationControl = document.querySelector('.event-notifications-control');

    // Show/hide notification control based on edit permissions
    if (canEdit) {
      notificationControl.style.display = 'flex';

      // Set initial state
      const isNotificationsSilenced = event.notifications_silenced || false;
      notificationToggle.checked = !isNotificationsSilenced;
      notificationToggleText.textContent = isNotificationsSilenced ? 'Notifications silenced' : 'Notifications enabled';

      // Handle toggle change
      notificationToggle.onchange = async () => {
        try {
          const response = await fetch(`/api/event/${event.id}/toggle-notifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();

          if (response.ok) {
            // Update the text based on the new state
            notificationToggleText.textContent = result.notifications_silenced ? 'Notifications silenced' : 'Notifications enabled';

            // Update the event object for consistency
            event.notifications_silenced = result.notifications_silenced;
          } else {
            // Revert the toggle if the request failed
            notificationToggle.checked = !notificationToggle.checked;
            notify.error('Failed to update notification settings: ' + (result.error || 'Unknown error'));
          }
        } catch (error) {
          // Revert the toggle if the request failed
          notificationToggle.checked = !notificationToggle.checked;
          notify.error('Failed to update notification settings: ' + error.message);
        }
      };
    } else {
      notificationControl.style.display = 'none';
    }

    eventModal.style.display = 'block';
  }

  updateDateDisplay();
  loadEventsForCurrentView();
});

function closeSummaryModal() {
  const summaryModal = document.getElementById('summaryModal');
  if (summaryModal) {
    summaryModal.style.display = 'none';
  }
}


  
const scheduleBtn = document.getElementById('scheduleBtn');
const schedulePopout = document.getElementById('schedulePopout');
const mainContent = document.querySelector('.main-content');
const navbar = document.querySelector('.navbar');

scheduleBtn.addEventListener('click', () => {
  schedulePopout.classList.toggle('active');
  mainContent.classList.toggle('shifted');
  navbar.classList.toggle('shifted');
});
