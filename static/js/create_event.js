document.addEventListener('DOMContentLoaded', () => {
  console.log("create_event.js loaded and DOM ready");

  const urlParams = new URLSearchParams(window.location.search);
  const dateFromUrl = urlParams.get('date');

  const displayDateEl = document.getElementById('displayDate');
  const eventDatePicker = document.getElementById('event_date_picker');
  const eventDateHidden = document.getElementById('event_date');

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
    const recEnds = document.getElementById('rec_ends');

    if (multiStart) multiStart.value = selectedDate;
    if (recStart) recStart.value = selectedDate;
    if (recEnds) recEnds.value = selectedDate;

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

    document.getElementById('singleDayInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringDayInputs').style.display = type === 'recurring' ? 'block' : 'none';

    updateDisplayDate();
  };

  document.getElementById('event_type').addEventListener('change', toggleInputs);
  toggleInputs(); // Run on load

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

  // Final fallback
  if (!displayDateEl.textContent || displayDateEl.textContent === '{{date}}') {
    updateDisplayDate();
  }

  // Also update display text when switching input values manually
  document.getElementById('multi_start_date')?.addEventListener('change', updateDisplayDate);
  document.getElementById('rec_start_date')?.addEventListener('change', updateDisplayDate);
});
