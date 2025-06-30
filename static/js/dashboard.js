document.getElementById('create-button').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const data = {
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    genre: formData.get('genre'),
    tags: formData.get('tags'),
    is_public: formData.get('is_public') === 'on',
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  };

  try {
    const response = await fetch('/event/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'X-CSRF-Token': '{{ csrf_token }}'
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById('message').textContent = 'Successful' + result.message;
      form.reset();
    } else {
      document.getElementById('message').textContent = 'Unsuccessful' + (result.error || 'Something went wrong');
    }
  } catch (err) {
    console.error(err);
    document.getElementById('message').textContent = 'Failed to send request';
  }
});
