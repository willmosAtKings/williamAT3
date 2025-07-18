document.addEventListener('DOMContentLoaded', () => {
    console.log("edit_event.js loaded");

    // --- GET EVENT ID FROM URL ---
    const pathParts = window.location.pathname.split('/');
    const eventId = pathParts[pathParts.length - 1];

    if (!eventId) {
        alert("No event ID found!");
        window.location.href = '/dashboard';
        return;
    }

    // --- FORM AND MEGA MENU ELEMENTS ---
    const form = document.getElementById('eventForm');
    const userRole = document.body.dataset.userRole;
    const tagSection = document.getElementById('tag-section');
    const deleteButton = document.getElementById('deleteEventBtn'); // Get the delete button
    const megaMenuDropdown = document.getElementById('mega-menu-dropdown');
    const tagSelectorButton = document.getElementById('tag-selector-button');
    const selectedTagsInput = document.getElementById('selected-tags-input');
    const selectedTagsDisplay = document.getElementById('selected-tags-display');
    let selectedTags = new Set();

    const tagStructure = {
        "Audience": ["public", "student", "teacher", "admin"],
        "Year Level": ["year-7", "year-8", "year-9", "year-10", "year-11", "year-12"],
        "Activity Type": ["sport", "academic", "co-curricular", "assembly", "excursion"],
    };

    // --- UI LOGIC ---
    if (userRole === 'student') {
        if (tagSection) tagSection.style.display = 'none';
    }

    function buildMegaMenu() {
        if (!megaMenuDropdown) return;
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
        if (!selectedTagsDisplay) return;
        selectedTagsDisplay.innerHTML = '';
        selectedTags.forEach(tag => {
            const pill = document.createElement('div');
            pill.className = 'selected-tag-pill';
            pill.innerHTML = `<span>${tag}</span><span class="remove-tag" data-tag="${tag}">×</span>`;
            selectedTagsDisplay.appendChild(pill);
        });
        if (selectedTagsInput) {
            selectedTagsInput.value = Array.from(selectedTags).join(',');
        }
    }

    if (tagSelectorButton) {
        tagSelectorButton.addEventListener('click', () => {
            megaMenuDropdown.classList.toggle('show');
        });
    }

    if (megaMenuDropdown) {
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
    }

    if (selectedTagsDisplay) {
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
    }

    window.addEventListener('click', (e) => {
        if (megaMenuDropdown && !e.target.closest('.mega-menu-container')) {
            megaMenuDropdown.classList.remove('show');
        }
    });

    // --- DATA FETCHING AND FORM POPULATION ---
    async function populateForm() {
        try {
            const response = await fetch(`/api/event/${eventId}`);
            if (!response.ok) {
                throw new Error('Could not fetch event data.');
            }
            const eventData = await response.json();
            console.log("Event data received:", eventData);

            // Populate basic fields
            document.getElementById('title').value = eventData.title;
            document.getElementById('description').value = eventData.description;
            document.getElementById('priority').value = eventData.priority;
            
            // Split datetime into date and time components
            const startDateTime = new Date(eventData.start_time);
            const endDateTime = new Date(eventData.end_time);
            
            // Format dates as YYYY-MM-DD
            const startDate = startDateTime.toISOString().split('T')[0];
            const endDate = endDateTime.toISOString().split('T')[0];
            
            // Format times as HH:MM
            const startTime = startDateTime.toTimeString().slice(0, 5);
            const endTime = endDateTime.toTimeString().slice(0, 5);
            
            // Determine if this is a multi-day event
            const isMultiDay = startDate !== endDate;
            
            // Show different inputs based on event type
            if (eventData.is_recurring) {
                // For recurring events, only show time inputs
                document.getElementById('singleDayInputs').style.display = 'none';
                document.getElementById('multiDayInputs').style.display = 'none';
                document.getElementById('recurringTimeInputs').style.display = 'block';
                
                document.getElementById('rec_start_time').value = startTime;
                document.getElementById('rec_end_time').value = endTime;
                
                // Store dates as hidden fields for submission
                const hiddenStartDate = document.createElement('input');
                hiddenStartDate.type = 'hidden';
                hiddenStartDate.id = 'hidden_start_date';
                hiddenStartDate.value = startDate;
                form.appendChild(hiddenStartDate);
                
                // Show recurring options
                const recurringOptions = document.getElementById('recurringEventOptions');
                if (recurringOptions) {
                    recurringOptions.style.display = 'block';
                    
                    // Store the recurrence group ID and original date for the backend
                    const hiddenGroupId = document.createElement('input');
                    hiddenGroupId.type = 'hidden';
                    hiddenGroupId.id = 'recurrence_group_id';
                    hiddenGroupId.value = eventData.recurrence_group_id;
                    form.appendChild(hiddenGroupId);
                    
                    const hiddenOrigDate = document.createElement('input');
                    hiddenOrigDate.type = 'hidden';
                    hiddenOrigDate.id = 'original_date';
                    hiddenOrigDate.value = startDate;
                    form.appendChild(hiddenOrigDate);
                }
            } else if (isMultiDay) {
                // For multi-day events, show separate start/end date and time inputs
                document.getElementById('singleDayInputs').style.display = 'none';
                document.getElementById('multiDayInputs').style.display = 'block';
                document.getElementById('recurringTimeInputs').style.display = 'none';
                
                document.getElementById('multi_start_date').value = startDate;
                document.getElementById('multi_start_time').value = startTime;
                document.getElementById('multi_end_date').value = endDate;
                document.getElementById('multi_end_time').value = endTime;
            } else {
                // For single-day events, show one date with start/end times
                document.getElementById('singleDayInputs').style.display = 'block';
                document.getElementById('multiDayInputs').style.display = 'none';
                document.getElementById('recurringTimeInputs').style.display = 'none';
                
                document.getElementById('event_date').value = startDate;
                document.getElementById('single_start_time').value = startTime;
                document.getElementById('single_end_time').value = endTime;
            }

            // Tags handling
            if (eventData.tags && userRole !== 'student') {
                const tags = eventData.tags.split(',').map(t => t.trim()).filter(Boolean);
                selectedTags = new Set(tags);
                updateSelectedTagsDisplay();
                tags.forEach(tag => {
                    const tagEl = megaMenuDropdown.querySelector(`.mega-menu-tag[data-tag="${tag}"]`);
                    if (tagEl) tagEl.classList.add('selected');
                });
            }

        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
            window.location.href = '/dashboard';
        }
    }

    // --- FORM SUBMISSION ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let startDateTime, endDateTime;
        
        // Get the appropriate date and time values based on event type
        if (document.getElementById('recurringTimeInputs').style.display !== 'none') {
            // Recurring event - combine hidden dates with visible times
            const startDate = document.getElementById('hidden_start_date').value;
            const startTime = document.getElementById('rec_start_time').value;
            
            startDateTime = `${startDate}T${startTime}:00`;
            endDateTime = `${startDate}T${document.getElementById('rec_end_time').value}:00`;
        } else if (document.getElementById('multiDayInputs').style.display !== 'none') {
            // Multi-day event - combine separate start/end dates and times
            const startDate = document.getElementById('multi_start_date').value;
            const startTime = document.getElementById('multi_start_time').value;
            const endDate = document.getElementById('multi_end_date').value;
            const endTime = document.getElementById('multi_end_time').value;
            
            startDateTime = `${startDate}T${startTime}:00`;
            endDateTime = `${endDate}T${endTime}:00`;
        } else {
            // Single-day event - combine one date with start/end times
            const eventDate = document.getElementById('event_date').value;
            const startTime = document.getElementById('single_start_time').value;
            const endTime = document.getElementById('single_end_time').value;
            
            startDateTime = `${eventDate}T${startTime}:00`;
            endDateTime = `${eventDate}T${endTime}:00`;
        }

        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: parseInt(document.getElementById('priority').value),
            start_time: startDateTime,
            end_time: endDateTime,
            tags: selectedTagsInput ? selectedTagsInput.value : ''
        };

        // Add recurring event data if applicable
        const recurringOptions = document.getElementById('recurringEventOptions');
        if (recurringOptions && recurringOptions.style.display !== 'none') {
            const editScope = document.getElementById('edit-scope-dropdown').value; // Changed from radio button to dropdown
            payload.edit_scope = editScope;
            payload.recurrence_group_id = document.getElementById('recurrence_group_id').value;
            payload.original_date = document.getElementById('original_date').value;
        }

        console.log("Submitting payload:", payload);

        try {
            const response = await fetch(`/api/event/${eventId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.href = '/dashboard';
            } else {
                throw new Error(result.error || 'Failed to update event.');
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });



    // --- FORM SUBMISSION (UPDATE) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let startDateTime, endDateTime;
        
        // Get the appropriate date and time values based on event type
        if (document.getElementById('recurringTimeInputs').style.display !== 'none') {
            // Recurring event - combine hidden dates with visible times
            const startDate = document.getElementById('hidden_start_date').value;
            const startTime = document.getElementById('rec_start_time').value;
            
            startDateTime = `${startDate}T${startTime}:00`;
            endDateTime = `${startDate}T${document.getElementById('rec_end_time').value}:00`;
        } else {
            // Non-recurring event - combine visible date with times
            const eventDate = document.getElementById('event_date').value;
            const startTime = document.getElementById('start_time').value;
            const endTime = document.getElementById('end_time').value;
            
            startDateTime = `${eventDate}T${startTime}:00`;
            endDateTime = `${eventDate}T${endTime}:00`;
        }

        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: parseInt(document.getElementById('priority').value),
            start_time: startDateTime,
            end_time: endDateTime,
            tags: selectedTagsInput ? selectedTagsInput.value : ''
        };

        // Add recurring event data if applicable
        const recurringOptions = document.getElementById('recurringEventOptions');
        if (recurringOptions && recurringOptions.style.display !== 'none') {
            const editScope = document.querySelector('input[name="edit-scope"]:checked').value;
            payload.edit_scope = editScope;
            payload.recurrence_group_id = document.getElementById('recurrence_group_id').value;
            payload.original_date = document.getElementById('original_date').value;
        }

        console.log("Submitting payload:", payload);

        try {
            const response = await fetch(`/api/event/${eventId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.href = '/dashboard';
            } else {
                throw new Error(result.error || 'Failed to update event.');
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });


    // --- FORM SUBMISSION (UPDATE) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let startDateTime, endDateTime;
        
        // Get the appropriate date and time values based on event type
        if (document.getElementById('recurringTimeInputs').style.display !== 'none') {
            // Recurring event - combine hidden dates with visible times
            const startDate = document.getElementById('hidden_start_date').value;
            const startTime = document.getElementById('rec_start_time').value;
            const endDate = document.getElementById('hidden_end_date').value;
            const endTime = document.getElementById('rec_end_time').value;
            
            startDateTime = `${startDate}T${startTime}:00`;
            endDateTime = `${endDate}T${endTime}:00`;
        } else {
            // Non-recurring event - combine visible dates and times
            const startDate = document.getElementById('start_date').value;
            const startTime = document.getElementById('start_time').value;
            const endDate = document.getElementById('end_date').value;
            const endTime = document.getElementById('end_time').value;
            
            startDateTime = `${startDate}T${startTime}:00`;
            endDateTime = `${endDate}T${endTime}:00`;
        }

        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: parseInt(document.getElementById('priority').value),
            start_time: startDateTime,
            end_time: endDateTime,
            tags: selectedTagsInput ? selectedTagsInput.value : ''
        };

        // Add recurring event data if applicable
        const recurringOptions = document.getElementById('recurringEventOptions');
        if (recurringOptions && recurringOptions.style.display !== 'none') {
            const editScope = document.querySelector('input[name="edit-scope"]:checked').value;
            payload.edit_scope = editScope;
            payload.recurrence_group_id = document.getElementById('recurrence_group_id').value;
            payload.original_date = document.getElementById('original_date').value;
        }

        console.log("Submitting payload:", payload);

        try {
            const response = await fetch(`/api/event/${eventId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.href = '/dashboard';
            } else {
                throw new Error(result.error || 'Failed to update event.');
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });

    // --- DELETE BUTTON LOGIC ---
    deleteButton.addEventListener('click', async () => {
        const recurringOptions = document.getElementById('recurringEventOptions');
        let confirmationText = "Are you sure you want to delete this event? This action cannot be undone.";
        
        // If it's a recurring event, ask which instances to delete
        let deleteScope = 'single';
        let originalDate = '';
        
        if (recurringOptions && recurringOptions.style.display !== 'none') {
            const result = confirm("This is a recurring event. Do you want to delete all occurrences in the series?");
            if (result) {
                deleteScope = 'all';
                confirmationText = "Are you sure you want to delete ALL occurrences of this recurring event? This action cannot be undone.";
            } else {
                deleteScope = 'this';
                confirmationText = "Are you sure you want to delete only this occurrence of the recurring event? This action cannot be undone.";
                // Get the original date from the hidden input
                originalDate = document.getElementById('original_date')?.value || '';
            }
        }
        
        if (confirm(confirmationText)) {
            try {
                let url = `/api/event/${eventId}?scope=${deleteScope}`;
                if (deleteScope === 'this' && originalDate) {
                    url += `&original_date=${originalDate}`;
                }
                
                console.log(`Sending DELETE request to: ${url}`);
                
                const response = await fetch(url, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                console.log("Delete response:", result);
                
                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/dashboard';
                } else {
                    throw new Error(result.error || 'Failed to delete event.');
                }
            } catch (error) {
                console.error("Error deleting event:", error);
                alert(error.message);
            }
        }
    });

    // --- INITIALISE PAGE ---
    if (userRole !== 'student') {
        buildMegaMenu();
    }
    populateForm();
});
