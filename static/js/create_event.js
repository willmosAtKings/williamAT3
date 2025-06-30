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
  
    try {
      const response = await fetch('/event/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': '{{ csrf_token }}'  // pass this if you use csrf protection
        },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
        // Optionally redirect or update page dynamically
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });
  