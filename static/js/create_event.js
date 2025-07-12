document.getElementById('eventForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const date = document.getElementById('event_date').value; // from hidden input

  const formData = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value,
    genre: document.getElementById('genre').value,
    tags: document.getElementById('tags').value,
    is_public: document.getElementById('is_public').checked,
    start_time: `${date}T${document.getElementById('start_time').value}`,
    end_time: `${date}T${document.getElementById('end_time').value}`,
  };
  

  // const csrfToken = document.getElementById('csrf_token').value;
  // document.querySelectorAll('.day-cell').forEach(cell => {
  //   cell.addEventListener('click', function () {
  //     const date = this.getAttribute('data-date');
  //     window.location.href = `/create_event?date=${date}`;
  //   });
  // });
  

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
      // Redirect back to dashboard after successful creation
      window.location.href = '/dashboard';
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
    }

    window.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const date = urlParams.get('date');
      if (date) {
        document.getElementById('event_date').value = date;
      }
    });

});