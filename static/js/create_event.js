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


    // deletes date from url
    urlParams.delete('date');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState({}, '', newUrl);
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
  
    document.getElementById('singleDayInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringDayInputs').style.display = type === 'recurring' ? 'block' : 'none';
  
    if (selectedDate) {
      eventDatePicker.value = selectedDate;
      eventDateHidden.value = selectedDate;
      displayDateEl.textContent = selectedDate;
  
      const multiStart = document.getElementById('multi_start_date');
      const multiEnd = document.getElementById('multi_end_date');
      const recEnds = document.getElementById('rec_ends');
  
      if (multiStart) multiStart.value = selectedDate;
      if (multiEnd) multiEnd.value = selectedDate;
      if (recEnds) recEnds.value = selectedDate;
    }
  };

  document.getElementById('event_type').addEventListener('change', toggleInputs);
  toggleInputs(); // Run on page load

  window.addEventListener('changeCreateEventDate', (e) => {
    const newDate = e.detail;
    selectedDate = newDate;
  
    const displayDateEl = document.getElementById('displayDate');
    const eventDatePicker = document.getElementById('event_date_picker');
    const eventDateHidden = document.getElementById('event_date');
  
    if (eventDatePicker) eventDatePicker.value = newDate;
    if (eventDateHidden) eventDateHidden.value = newDate;
    if (displayDateEl) displayDateEl.textContent = newDate;
  
    const multiStart = document.getElementById('multi_start_date');
    const multiEnd = document.getElementById('multi_end_date');
    const recEnds = document.getElementById('rec_ends');
  
    if (multiStart) multiStart.value = newDate;
    if (multiEnd) multiEnd.value = newDate;
    if (recEnds) recEnds.value = newDate;
  
    // Also re-run the event type toggling to reflect changes
    toggleInputs();
  });

  if (!displayDateEl.textContent || displayDateEl.textContent === '{{date}}') {
    displayDateEl.textContent = selectedDate || '(no date selected)';
  }
  

});
