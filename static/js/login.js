/*===== LOGIN FUNCTIONALITY =====*/

// Password toggle functionality
function togglePassword(fieldId) {
  const passwordField = document.getElementById(fieldId);
  const toggleIcon = document.getElementById(fieldId + '-toggle-icon');

  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    passwordField.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

document.getElementById('LgnBtn').addEventListener('click', function () {
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!password || !email) {
        notify.error('Please fill in all fields');
        return;
    }

    fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin'
      })

    .then(function (response) {
        return response.json().then(function (responseData) {
            if (response.ok) {
                notify.success('Login successful!');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                notify.error(responseData.error || 'Login failed');
            }
        });
    })
    .catch(function (error) {
        notify.error('An error occurred during login');
    });
    
});