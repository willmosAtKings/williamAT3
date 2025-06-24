

document.getElementById('LgnBtn').addEventListener('click', function () {
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!password || !email) {
        alert('Please fill in all fields');
        return;
    }

    const data = {
        password: password,
        email: email
    };

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin'
      })

    .then(function (response) {
        return response.json().then(function (responseData) {
            if (response.ok) {
                alert('Login successful!');
            } else {
                console.error('Login failed:', responseData.error);
                alert(responseData.error || 'Registration failed');
            }
        });
    })
    .catch(function (error) {
        console.error('Error:', error);
        alert('An error occurred during Login');
    });
});




  