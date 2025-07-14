document.addEventListener('DOMContentLoaded', () => {
  console.log("create_event.js loaded and DOM ready");

  const urlParams = new URLSearchParams(window.location.search);
  const dateFromUrl = urlParams.get('date');

  const displayDateEl = document.getElementById('displayDate');
  const eventDatePicker = document.getElementById('event_date_picker');
  const eventDateHidden = document.getElementById('event_date');
  const form = document.getElementById('eventForm');

  let selectedDate = null;

  function updateDisplayDate() {
    const type = document.getElementById('event_type').value;

    if (type === 'single') {
      const single = document.getElementById('event_date_picker').value;
      displayDateEl.textContent = single || '(no date selected)';
    } else if (type === 'multi') {
      const multiStart = document.getElementById('multi_start_date').value;
      displayDateEl.textContent = multiStart || '(no date selected)';
    } else if (type === 'recurring') {
      const recStart = document.getElementById('rec_start_date')?.value;
      displayDateEl.textContent = recStart || '(no date selected)';
    }
  }

  // Prefill date from URL
  if (dateFromUrl) {
    selectedDate = dateFromUrl;

    if (eventDatePicker) eventDatePicker.value = selectedDate;
    if (eventDateHidden) eventDateHidden.value = selectedDate;

    const multiStart = document.getElementById('multi_start_date');
    const recStart = document.getElementById('rec_start_date');

    if (multiStart) multiStart.value = selectedDate;
    if (recStart) recStart.value = selectedDate;

    updateDisplayDate();

    // Clean URL
    urlParams.delete('date');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }

  // Keep selected date up to date for single-day
  eventDatePicker?.addEventListener('change', (e) => {
    selectedDate = e.target.value;
    eventDateHidden.value = selectedDate;
    updateDisplayDate();
  });

  // Event type toggle
  const toggleInputs = () => {
    const type = document.getElementById('event_type').value;
    const recUnit = document.getElementById('rec_unit')?.value;
  
    document.getElementById('singleDayInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringDayInputs').style.display = type === 'recurring' ? 'block' : 'none';
  
    // If recurring + weekly → show checkboxes
    const weekdaySection = document.getElementById('weekdaySelector');
    if (type === 'recurring' && recUnit === 'weekly') {
      weekdaySection.style.display = 'block';
    } else {
      weekdaySection.style.display = 'none';
    }
  
    updateDisplayDate();
  };
  
  // Attach this event handler AFTER DOM loads
  document.getElementById('event_type')?.addEventListener('change', toggleInputs);
  
  // Also recheck weekday display if the repeat unit changes
  document.getElementById('rec_unit')?.addEventListener('change', toggleInputs);
  
  // Run on load
  toggleInputs();
  

  // Update date if sent from dashboard via JS event
  window.addEventListener('changeCreateEventDate', (e) => {
    const newDate = e.detail;
    selectedDate = newDate;

    if (eventDatePicker) eventDatePicker.value = newDate;
    if (eventDateHidden) eventDateHidden.value = newDate;

    const multiStart = document.getElementById('multi_start_date');
    const recStart = document.getElementById('rec_start_date');
    const recEnds = document.getElementById('rec_ends');

    if (multiStart) multiStart.value = newDate;
    if (recStart) recStart.value = newDate;
    if (recEnds) recEnds.value = newDate;

    updateDisplayDate();
    toggleInputs();
  });

  // Also update display text when switching input values manually
  document.getElementById('multi_start_date')?.addEventListener('change', updateDisplayDate);
  document.getElementById('rec_start_date')?.addEventListener('change', updateDisplayDate);

  // Handle form submit to send event data via fetch POST
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('event_type').value;
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const genre = document.getElementById('genre').value.trim();
    const tags = document.getElementById('tags').value.trim();
    const isPublic = document.getElementById('is_public').checked;

    let startTimeStr = null;
    let endTimeStr = null;
    let repeatUnit = null;
    let repeatInterval = null;
    let repeatEnds = null;
    let repeatWeekdays = [];

    try {
      if (type === 'single') {
        const date = document.getElementById('event_date_picker').value;
        const startTime = document.getElementById('start_time').value;
        const endTime = document.getElementById('end_time').value;

        if (!date || !startTime || !endTime) {
          alert('Please fill in date, start time, and end time.');
          return;
        }

        startTimeStr = `${date}T${startTime}`;
        endTimeStr = `${date}T${endTime}`;
      }
      else if (type === 'multi') {
        const startDate = document.getElementById('multi_start_date').value;
        const startTime = document.getElementById('multi_start_time').value;
        const endDate = document.getElementById('multi_end_date').value;
        const endTime = document.getElementById('multi_end_time').value;

        if (!startDate || !startTime || !endDate || !endTime) {
          alert('Please fill in start date/time and end date/time for multi-day event.');
          return;
        }

        startTimeStr = `${startDate}T${startTime}`;
        endTimeStr = `${endDate}T${endTime}`;
      }
      else if (type === 'recurring') {
        const startDate = document.getElementById('rec_start_date').value;
        const startTime = document.getElementById('start_time_rec').value;
        const endTime = document.getElementById('end_time_rec').value;
        repeatUnit = document.getElementById('rec_unit').value;
        repeatInterval = document.getElementById('rec_interval').value;
        repeatEnds = document.getElementById('rec_ends').value;
      
        if (!startDate || !startTime || !endTime || !repeatUnit || !repeatInterval) {
          alert('Please fill in all required fields for recurring event.');
          return;
        }
      
        startTimeStr = `${startDate}T${startTime}`;
        endTimeStr = `${startDate}T${endTime}`;

        // Get checked weekdays if weekly recurrence
        if (repeatUnit === 'weekly') {
          repeatWeekdays = Array.from(document.querySelectorAll('#weekdaySelector input[type="checkbox"]:checked')).map(cb => cb.value);
          if (repeatWeekdays.length === 0) {
            alert('Please select at least one weekday for weekly recurring event.');
            return;
          }
        }
      }

      // Prepare JSON payload
      const payload = {
        event_type: type,
        title,
        description,
        priority: parseInt(priority),
        genre,
        tags,
        is_public: isPublic,
        start_time: startTimeStr,
        end_time: endTimeStr,
      };

      // Add recurring fields if applicable
      if (type === 'recurring') {
        payload.rec_unit = repeatUnit;
        payload.rec_interval = parseInt(repeatInterval);
        payload.rec_ends = repeatEnds || null;
        payload.rec_start_date = document.getElementById('rec_start_date').value;
        payload.rec_weekdays = repeatWeekdays;  // keep weekdays array if any
      }

      // Send POST request
      const response = await fetch('/event/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Include CSRF token here if used
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Event created successfully!');
        window.location.href = '/dashboard';
      } else {
        alert('Error creating event: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Unexpected error: ' + err.message);
      console.error(err);
    }
  });

});
