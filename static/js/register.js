/*===== REGISTRATION FUNCTIONALITY =====*/

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

// Password strength checker
function checkPasswordStrength(password) {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score++;
  else feedback.push('at least 8 characters');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('numbers');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('special characters');

  return { score, feedback };
}

// Update password strength indicator
function updatePasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthFill = document.getElementById('strength-fill');
  const strengthText = document.getElementById('strength-text');

  if (!password) {
    strengthFill.style.width = '0%';
    strengthFill.className = 'strength-fill';
    strengthText.textContent = 'Password strength';
    return;
  }

  const { score, feedback } = checkPasswordStrength(password);
  const percentage = (score / 5) * 100;

  strengthFill.style.width = percentage + '%';

  if (score <= 2) {
    strengthFill.className = 'strength-fill weak';
    strengthText.textContent = 'Weak - Add ' + feedback.slice(0, 2).join(', ');
  } else if (score === 3) {
    strengthFill.className = 'strength-fill fair';
    strengthText.textContent = 'Fair - Add ' + feedback.join(', ');
  } else if (score === 4) {
    strengthFill.className = 'strength-fill good';
    strengthText.textContent = 'Good - Add ' + feedback.join(', ');
  } else {
    strengthFill.className = 'strength-fill strong';
    strengthText.textContent = 'Strong password';
  }
}

// Check password match
function checkPasswordMatch() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const matchIndicator = document.getElementById('password-match');

  if (!confirmPassword) {
    matchIndicator.textContent = '';
    matchIndicator.className = 'password-match';
    return false;
  }

  if (password === confirmPassword) {
    matchIndicator.textContent = '✓ Passwords match';
    matchIndicator.className = 'password-match match';
    return true;
  } else {
    matchIndicator.textContent = '✗ Passwords do not match';
    matchIndicator.className = 'password-match no-match';
    return false;
  }
}

// Add event listeners
document.getElementById('password').addEventListener('input', updatePasswordStrength);
document.getElementById('confirm-password').addEventListener('input', checkPasswordMatch);
document.getElementById('password').addEventListener('input', checkPasswordMatch);

document.getElementById('regBtn').addEventListener('click', function () {
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;

    // Validation
    if (!password || !confirmPassword || !email) {
        notify.error('Please fill in all fields');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        notify.error('Please enter a valid email address');
        return;
    }

    // Password strength validation
    const { score } = checkPasswordStrength(password);
    if (score < 3) {
        notify.error('Password is too weak. Please choose a stronger password.');
        return;
    }

    // Password match validation
    if (!checkPasswordMatch()) {
        notify.error('Passwords do not match');
        return;
    }

    const data = {
        password: password,
        email: email,
        role: role
    };

    //const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            //'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data),
        credentials: 'same-origin'
    })
    .then(function (response) {
        return response.json().then(function (responseData) {
            if (response.ok) {
                notify.success('Registration successful! Please login.');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                notify.error(responseData.error || 'Registration failed');
            }
        });
    })
    .catch(function () {
        notify.error('An error occurred during registration');
    });
});
