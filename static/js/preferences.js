document.addEventListener('DOMContentLoaded', () => {
    console.log("profile_preferences.js loaded");

    // This structure should be the same as in create_event.js
    // In a real app, you might fetch this from an API
    const tagStructure = {
        "Year Level": ["year-7", "year-8", "year-9", "year-10", "year-11", "year-12"],
        "Co-Curricular": ["sport", "chess-club", "debate-team", "photography"],
        // Add more categories here
    };

    const megaMenuDropdown = document.getElementById('mega-menu-dropdown');
    const tagSelectorButton = document.getElementById('tag-selector-button');
    const selectedTagsInput = document.getElementById('selected-tags-input');
    const selectedTagsDisplay = document.getElementById('selected-tags-display');
    const saveButton = document.getElementById('saveTagsBtn');
    
    // Read the user's currently saved tags from the data attribute in the HTML
    const currentUserTagsDiv = document.getElementById('user-current-tags');
    const initialTags = currentUserTagsDiv.dataset.currentTags.split(',').filter(Boolean); // filter(Boolean) removes empty strings
    let selectedTags = new Set(initialTags);

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
                // Pre-select the tag if it's in the user's initial set
                if (selectedTags.has(tag)) {
                    tagEl.classList.add('selected');
                }
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

    saveButton.addEventListener('click', async () => {
        const tagsToSave = selectedTagsInput.value;
        console.log("Saving tags:", tagsToSave);

        try {
            const response = await fetch('/api/profile/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tags: tagsToSave }),
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
            } else {
                alert('Error: ' + (result.error || 'Could not save tags.'));
            }
        } catch (error) {
            console.error("Failed to save tags:", error);
            alert("An unexpected error occurred.");
        }
    });

    // Initial setup
    buildMegaMenu();
    updateSelectedTagsDisplay();
});
