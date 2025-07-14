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
    // Hide tag section for students
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
            const eventData = await response.json(); // Changed from 'event' to 'eventData'
    
            // Populate simple fields
            document.getElementById('title').value = eventData.title;
            document.getElementById('description').value = eventData.description;
            document.getElementById('priority').value = eventData.priority;
    
            // Populate datetime-local inputs (requires formatting)
            document.getElementById('start_time').value = eventData.start_time.slice(0, 16);
            document.getElementById('end_time').value = eventData.end_time.slice(0, 16);
    
            // Handle recurring events
            if (eventData.is_recurring) {
                document.getElementById('recurring-options').style.display = 'block';
                
                // Add the exception date to the form data
                const exceptionDate = new Date(eventData.start_time).toISOString().split('T')[0];
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'exception_date';
                hiddenInput.value = exceptionDate;
                form.appendChild(hiddenInput);
            }
    
            // Populate tags
            if (eventData.tags && userRole !== 'student') {
                const tags = eventData.tags.split(',').map(t => t.trim()).filter(Boolean);
                selectedTags = new Set(tags);
                updateSelectedTagsDisplay();
                // Highlight selected tags in the dropdown
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

        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            priority: parseInt(document.getElementById('priority').value),
            start_time: document.getElementById('start_time').value,
            end_time: document.getElementById('end_time').value,
            tags: selectedTagsInput ? selectedTagsInput.value : ''
        };

        if (document.getElementById('recurring-options').style.display !== 'none') {
            payload.edit_scope = document.querySelector('input[name="edit-scope"]:checked').value;
            payload.exception_date = document.getElementById('exception_date').value;
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

    // --- INITIALIZE PAGE ---
    if (userRole !== 'student') {
        buildMegaMenu();
    }
    populateForm();
});
