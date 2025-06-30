document.getElementById('regBtn').addEventListener('click', function () {
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

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data),
        credentials: 'same-origin'
    })
    .then(function (response) {
        return response.json().then(function (responseData) {
            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = '/login';
            } else {
                console.error('Registration failed:', responseData.error);
                alert(responseData.error || 'Registration failed');
            }
        });
    })
    .catch(function (error) {
        console.error('Error:', error);
        alert('An error occurred during registration');
    });
});
