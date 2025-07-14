document.addEventListener('DOMContentLoaded', () => {
  console.log("create_event.js loaded and DOM ready");

  // --- MEGA MENU SETUP ---
  const tagStructure = {
    "Audience": ["public", "student", "teacher", "admin"],
    "Year Level": ["year-7", "year-8", "year-9", "year-10", "year-11", "year-12"],
    "Activity Type": ["sport", "academic", "co-curricular", "assembly", "excursion"],
  };

  const megaMenuDropdown = document.getElementById('mega-menu-dropdown');
  const tagSelectorButton = document.getElementById('tag-selector-button');
  const selectedTagsInput = document.getElementById('selected-tags-input');
  const selectedTagsDisplay = document.getElementById('selected-tags-display');
  let selectedTags = new Set();

  function buildMegaMenu() {
    megaMenuDropdown.innerHTML = '';
    for (const category in tagStructure) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'mega-menu-category';
      const categoryTitle = document.createElement('h4');
      categoryTitle.textContent = category;
      categoryDiv.appendChild(categoryTitle);
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'mega-menu-tags';
      tagStructure[category].forEach(tag => {
        const tagEl = document.createElement('div');
        tagEl.className = 'mega-menu-tag';
        tagEl.textContent = tag;
        tagEl.dataset.tag = tag;
        tagsContainer.appendChild(tagEl);
      });
      categoryDiv.appendChild(tagsContainer);
      megaMenuDropdown.appendChild(categoryDiv);
    }
  }

  function updateSelectedTagsDisplay() {
    selectedTagsDisplay.innerHTML = '';
    selectedTags.forEach(tag => {
      const pill = document.createElement('div');
      pill.className = 'selected-tag-pill';
      pill.innerHTML = `<span>${tag}</span><span class="remove-tag" data-tag="${tag}">×</span>`;
      selectedTagsDisplay.appendChild(pill);
    });
    selectedTagsInput.value = Array.from(selectedTags).join(',');
  }

  tagSelectorButton.addEventListener('click', () => {
    megaMenuDropdown.classList.toggle('show');
  });

  megaMenuDropdown.addEventListener('click', (e) => {
    if (e.target.classList.contains('mega-menu-tag')) {
      const tag = e.target.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        e.target.classList.remove('selected');
      } else {
        selectedTags.add(tag);
        e.target.classList.add('selected');
      }
      updateSelectedTagsDisplay();
    }
  });

  selectedTagsDisplay.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-tag')) {
      const tag = e.target.dataset.tag;
      selectedTags.delete(tag);
      updateSelectedTagsDisplay();
      const tagInMenu = megaMenuDropdown.querySelector(`.mega-menu-tag[data-tag="${tag}"]`);
      if (tagInMenu) {
        tagInMenu.classList.remove('selected');
      }
    }
  });

  window.addEventListener('click', (e) => {
    if (!e.target.closest('.mega-menu-container')) {
      megaMenuDropdown.classList.remove('show');
    }
  });

  buildMegaMenu();
  // --- END MEGA MENU SETUP ---

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

  if (dateFromUrl) {
    selectedDate = dateFromUrl;
    if (eventDatePicker) eventDatePicker.value = selectedDate;
    if (eventDateHidden) eventDateHidden.value = selectedDate;
    const multiStart = document.getElementById('multi_start_date');
    const recStart = document.getElementById('rec_start_date');
    if (multiStart) multiStart.value = selectedDate;
    if (recStart) recStart.value = selectedDate;
    updateDisplayDate();
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
    window.history.replaceState({}, '', newUrl);
  }

  eventDatePicker?.addEventListener('change', (e) => {
    selectedDate = e.target.value;
    eventDateHidden.value = selectedDate;
    updateDisplayDate();
  });

  const toggleInputs = () => {
    const type = document.getElementById('event_type').value;
    const recUnit = document.getElementById('rec_unit')?.value;
    document.getElementById('singleDayInputs').style.display = type === 'single' ? 'block' : 'none';
    document.getElementById('multiDayInputs').style.display = type === 'multi' ? 'block' : 'none';
    document.getElementById('recurringDayInputs').style.display = type === 'recurring' ? 'block' : 'none';
    const weekdaySection = document.getElementById('weekdaySelector');
    if (type === 'recurring' && recUnit === 'weekly') {
      weekdaySection.style.display = 'block';
    } else {
      weekdaySection.style.display = 'none';
    }
    updateDisplayDate();
  };
  
  document.getElementById('event_type')?.addEventListener('change', toggleInputs);
  document.getElementById('rec_unit')?.addEventListener('change', toggleInputs);
  toggleInputs();
  
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

  document.getElementById('multi_start_date')?.addEventListener('change', updateDisplayDate);
  document.getElementById('rec_start_date')?.addEventListener('change', updateDisplayDate);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('event_type').value;
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const tags = document.getElementById('selected-tags-input').value;
    
    // REMOVED: const isPublic = document.getElementById('is_public').checked;

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
        tags,
        // REMOVED: is_public: isPublic,
        start_time: startTimeStr,
        end_time: endTimeStr,
      };

      if (type === 'recurring') {
        payload.rec_unit = repeatUnit;
        payload.rec_interval = parseInt(repeatInterval);
        payload.rec_ends = repeatEnds || null;
        payload.rec_start_date = document.getElementById('rec_start_date').value;
        payload.rec_weekdays = repeatWeekdays;
      }

      // Send POST request
      const response = await fetch('/event/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
