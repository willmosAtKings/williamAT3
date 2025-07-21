/*===== LOGIN FUNCTIONALITY =====*/

/**
 * Toggle password visibility for better user experience
 * Switches between showing and hiding password text
 *
 * @param {string} fieldId - ID of the password input field
 */
function togglePassword(fieldId) {
  const passwordField = document.getElementById(fieldId);
  const toggleIcon = document.getElementById(fieldId + '-toggle-icon');

  // Toggle between password and text input types
  if (passwordField.type === 'password') {
    // Show password
    passwordField.type = 'text';
    toggleIcon.classList.remove('fa-eye');
    toggleIcon.classList.add('fa-eye-slash');
  } else {
    // Hide password
    passwordField.type = 'password';
    toggleIcon.classList.remove('fa-eye-slash');
    toggleIcon.classList.add('fa-eye');
  }
}

/**
 * Handle login form submission
 * Validates input, sends AJAX request, and handles response
 */
document.getElementById('LgnBtn').addEventListener('click', function () {
    // Get form values and trim whitespace
    const password = document.getElementById('password').value.trim();
    const email = document.getElementById('email').value.trim();

    // Basic client-side validation
    if (!password || !email) {
        notify.error('Please fill in all fields');
        return;
    }

    // Send login request to server
    fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // CSRF token commented out - handled by server session
        },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin'  // Include cookies for session management
      })

    .then(function (response) {
        // Parse JSON response and handle success/error
        return response.json().then(function (responseData) {
            if (response.ok) {
                // Login successful - show success message and redirect
                notify.success('Login successful!');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                // Login failed - show error message
                notify.error(responseData.error || 'Login failed');
            }
        });
    })
    .catch(function (error) {
        // Network or other error occurred
        notify.error('An error occurred during login');
        console.error('Login error:', error);
    });

});