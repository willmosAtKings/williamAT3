window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const dateFromUrl = urlParams.get('date');
  const displayDateEl = document.getElementById('displayDate');
  const eventDatePicker = document.getElementById('event_date_picker');
  const eventDateHidden = document.getElementById('event_date');

  if (dateFromUrl) {
    displayDateEl.textContent = dateFromUrl;
    eventDatePicker.value = dateFromUrl;
    eventDateHidden.value = dateFromUrl;
  }

  eventDatePicker.addEventListener('change', (e) => {
    eventDateHidden.value = e.target.value;
    displayDateEl.textContent = e.target.value || '(no date selected)';
  });

  // Toggle form sections
  document.getElementById('event_type').addEventListener('change', function () {
    const type = this.value;
    document.getElementById('dateInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringInputs').style.display = type === 'recurring' ? 'block' : 'none';
  });
});

document.getElementById('eventForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const type = document.getElementById('event_type').value;

  const data = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    genre: document.getElementById('genre').value,
    tags: document.getElementById('tags').value,
    is_public: document.getElementById('is_public').checked,
  };

  if (type === 'single') {
    const date = document.getElementById('event_date').value;
    if (!date) return alert('Please select a date.');

    data.start_time = `${date}T${document.getElementById('start_time').value}`;
    data.end_time = `${date}T${document.getElementById('end_time').value}`;
    data.is_recurring = false;
  }

  if (type === 'multi') {
    const sd = document.getElementById('multi_start_date').value;
    const ed = document.getElementById('multi_end_date').value;
    const st = document.getElementById('multi_start_time').value;
    const et = document.getElementById('multi_end_time').value;

    if (!sd || !ed || !st || !et) return alert('Please complete all start/end fields.');

    data.start_time = `${sd}T${st}`;
    data.end_time = `${ed}T${et}`;
    data.is_recurring = false;
  }

  if (type === 'recurring') {
    const unit = document.getElementById('rec_unit').value;
    const interval = parseInt(document.getElementById('rec_interval').value);
    const ends = document.getElementById('rec_ends').value;

    const weekdays = Array.from(document.querySelectorAll('#recurringInputs input[type=checkbox]:checked'))
      .map(cb => cb.value);

    const today = new Date().toISOString().split('T')[0];
    data.start_time = `${today}T09:00`;
    data.end_time = `${today}T10:00`;

    data.is_recurring = true;
    data.recurrence = {
      unit: unit,
      interval: interval,
      weekdays: weekdays.length > 0 ? weekdays : undefined,
      ends: ends || null
    };
  }

  try {
    const response = await fetch('/event/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const res = await response.json();
    if (response.ok) {
      alert(res.message);
      window.location.href = '/dashboard';
    } else {
      alert('Error: ' + (res.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
});
