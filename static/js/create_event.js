document.getElementById('eventForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const formData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    genre: document.getElementById('genre').value,
    tags: document.getElementById('tags').value,
    is_public: document.getElementById('is_public').checked,
    start_time: document.getElementById('start_time').value,
    end_time: document.getElementById('end_time').value,
  };

  // const csrfToken = document.getElementById('csrf_token').value;

  try {
    const response = await fetch('/event/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      // Optionally reset form or redirect
      this.reset();
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
});