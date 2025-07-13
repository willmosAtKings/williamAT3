document.addEventListener('DOMContentLoaded', () => {
  console.log("create_event.js loaded and DOM ready");

  const urlParams = new URLSearchParams(window.location.search);
  const dateFromUrl = urlParams.get('date');

  const displayDateEl = document.getElementById('displayDate');
  const eventDatePicker = document.getElementById('event_date_picker');
  const eventDateHidden = document.getElementById('event_date');

  let selectedDate = null;

  // Prefill date from URL
  if (dateFromUrl) {
    selectedDate = dateFromUrl;
    eventDatePicker.value = selectedDate;
    eventDateHidden.value = selectedDate;
    displayDateEl.textContent = selectedDate;

    // Also prefill multi-day and recurring fields
    const multiStart = document.getElementById('multi_start_date');
    const multiEnd = document.getElementById('multi_end_date');
    const recEnds = document.getElementById('rec_ends');

    if (multiStart) multiStart.value = selectedDate;
    if (multiEnd) multiEnd.value = selectedDate;
    if (recEnds) recEnds.value = selectedDate;
  }

  // Keep selected date up to date
  eventDatePicker.addEventListener('change', (e) => {
    selectedDate = e.target.value;
    eventDateHidden.value = selectedDate;
    displayDateEl.textContent = selectedDate || '(no date selected)';
  });

  // Toggle input sections based on event type
  const toggleInputs = () => {
    const type = document.getElementById('event_type').value;

    document.getElementById('dateInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringInputs').style.display = type === 'recurring' ? 'block' : 'none';

    // Re-insert selected date into the relevant section
    if (selectedDate) {
      if (type === 'single') {
        eventDatePicker.value = selectedDate;
        eventDateHidden.value = selectedDate;
        displayDateEl.textContent = selectedDate;
      } else if (type === 'multi') {
        document.getElementById('multi_start_date').value = selectedDate;
        document.getElementById('multi_end_date').value = selectedDate;
      } else if (type === 'recurring') {
        document.getElementById('rec_ends').value = selectedDate;
      }
    }
  };

  document.getElementById('event_type').addEventListener('change', toggleInputs);
  toggleInputs(); // Run on page load
});
