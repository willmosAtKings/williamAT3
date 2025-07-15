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

            // Populate basic fields as before
            document.getElementById('title').value = eventData.title;
            document.getElementById('description').value = eventData.description;
            document.getElementById('priority').value = eventData.priority;
            document.getElementById('start_time').value = eventData.start_time.slice(0, 16);
            document.getElementById('end_time').value = eventData.end_time.slice(0, 16);

            // Show recurring options if this is a recurring event
            if (eventData.is_recurring) {
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
                    hiddenOrigDate.value = eventData.start_time.split('T')[0];
                    form.appendChild(hiddenOrigDate);
                }
            }

            // Tags handling as before
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

    // --- FORM SUBMISSION (UPDATE) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: parseInt(document.getElementById('priority').value),
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value,
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
        if (recurringOptions && recurringOptions.style.display !== 'none') {
            const result = confirm("This is a recurring event. Do you want to delete all occurrences in the series?");
            if (result) {
                deleteScope = 'all';
                confirmationText = "Are you sure you want to delete ALL occurrences of this recurring event? This action cannot be undone.";
            } else {
                confirmationText = "Are you sure you want to delete only this occurrence of the recurring event? This action cannot be undone.";
            }
        }
        
        if (confirm(confirmationText)) {
            try {
                const url = deleteScope === 'all' ? 
                    `/api/event/${eventId}?scope=all` : 
                    `/api/event/${eventId}?scope=single`;
                    
                const response = await fetch(url, {
                    method: 'DELETE'
                });
                const result = await response.json();
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
