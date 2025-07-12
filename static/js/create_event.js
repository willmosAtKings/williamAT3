document.addEventListener('DOMContentLoaded', () => {
  console.log("create_event.js loaded and DOM ready");

  const urlParams = new URLSearchParams(window.location.search);
  const dateFromUrl = urlParams.get('date');

  const displayDateEl = document.getElementById('displayDate');
  const eventDatePicker = document.getElementById('event_date_picker');
  const eventDateHidden = document.getElementById('event_date');

  // Autofill date from URL
  if (dateFromUrl) {
    displayDateEl.textContent = dateFromUrl;
    eventDatePicker.value = dateFromUrl;
    eventDateHidden.value = dateFromUrl;
  }

  // Sync visible date picker with hidden input
  eventDatePicker.addEventListener('change', (e) => {
    const val = e.target.value;
    eventDateHidden.value = val;
    displayDateEl.textContent = val || '(no date selected)';
  });

  // Toggle section visibility based on selected type
  const toggleInputs = () => {
    const type = document.getElementById('event_type').value;
    document.getElementById('dateInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringInputs').style.display = type === 'recurring' ? 'block' : 'none';
  };

  document.getElementById('event_type').addEventListener('change', toggleInputs);
  toggleInputs(); // Run on page load too

  // Submit handler
  document.getElementById('eventForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log("Form submit triggered");

    const type = document.getElementById('event_type').value;

    const data = {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      priority: document.getElementById('priority').value,
      genre: document.getElementById('genre').value.trim(),
      tags: document.getElementById('tags').value.trim(),
      is_public: document.getElementById('is_public').checked,
    };

    if (type === 'single') {
      const date = document.getElementById('event_date').value;
      const start = document.getElementById('start_time')?.value || '09:00';
      const end = document.getElementById('end_time')?.value || '10:00';

      if (!date) return alert('Please select a valid date.');

      data.start_time = `${date}T${start}`;
      data.end_time = `${date}T${end}`;
      data.is_recurring = false;
    }

    if (type === 'multi') {
      const sd = document.getElementById('multi_start_date').value;
      const ed = document.getElementById('multi_end_date').value;
      const st = document.getElementById('multi_start_time').value;
      const et = document.getElementById('multi_end_time').value;

      if (!sd || !ed || !st || !et) {
        return alert('Please fill all multi-day start/end fields.');
      }

      data.start_time = `${sd}T${st}`;
      data.end_time = `${ed}T${et}`;
      data.is_recurring = false;
    }

    if (type === 'recurring') {
      const unit = document.getElementById('rec_unit').value;
      const interval = parseInt(document.getElementById('rec_interval').value);
      const ends = document.getElementById('rec_ends').value;

      const weekdays = Array.from(
        document.querySelectorAll('#recurringInputs input[type=checkbox]:checked')
      ).map(cb => cb.value);

      const today = new Date().toISOString().split('T')[0];
      data.start_time = `${today}T09:00`;
      data.end_time = `${today}T10:00`;

      data.is_recurring = true;
      data.recurrence = {
        unit,
        interval,
        weekdays: weekdays.length > 0 ? weekdays : undefined,
        ends: ends || null
      };
    }

    console.log("📦 Sending event data:", data);

    try {
      const response = await fetch('/event/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Event created!');
        window.location.href = '/dashboard';
      } else {
        console.error('Server returned error:', result);
        alert(result.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error: ' + err.message);
    }
  });
});
