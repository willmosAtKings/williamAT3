window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dateFromUrl = urlParams.get('date');  // e.g. "2025-07-15"
  
  const displayDateEl = document.getElementById('displayDate');
  const eventDatePicker = document.getElementById('event_date_picker');
  const eventDateHidden = document.getElementById('event_date');
  
  if (dateFromUrl) {
    displayDateEl.textContent = dateFromUrl;
    eventDatePicker.value = dateFromUrl;
    eventDateHidden.value = dateFromUrl;
  } else {
    displayDateEl.textContent = '(no date selected)';
  }

  // Update hidden input and displayed date when user picks a new date
  eventDatePicker.addEventListener('change', (e) => {
    const selectedDate = e.target.value;
    eventDateHidden.value = selectedDate;
    displayDateEl.textContent = selectedDate || '(no date selected)';
  });
});


document.getElementById('eventForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const date = document.getElementById('event_date').value;
  if (!date) {
    alert('Please select a date for the event.');
    return;
  }

  const formData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    genre: document.getElementById('genre').value,
    tags: document.getElementById('tags').value,
    is_public: document.getElementById('is_public').checked,
    start_time: `${date}T${document.getElementById('start_time').value}`,  // e.g. "2025-07-15T09:00"
    end_time: `${date}T${document.getElementById('end_time').value}`,      // e.g. "2025-07-15T10:00"
  };

  try {
    const response = await fetch('/event/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      window.location.href = '/dashboard';
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
});
