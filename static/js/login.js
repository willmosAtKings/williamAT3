console.log("Login.js is loaded");


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

    const csrfToken = document.querySelector('input[name="csrf_token"]')?.value || '';


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
                window.location.href = '/dashboard';
            } else {
                console.error('Login failed:', responseData.error);
                alert(responseData.error || 'Login failed');

            }
        });
    })
    .catch(function (error) {
        console.error('Error:', error); // delete later
        alert('An error occurred during login');
    });
    
});




  