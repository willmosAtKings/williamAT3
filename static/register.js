document.getElementById('regBtn').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
  
    if (!username || !email || !password) {
      displayMessage("All fields are required.", "error");
      return;
    }
  
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrf_token')  // Optional, if you’re using CSRF protection
        },
        body: JSON.stringify({ username, email, password })
      });
  
      const data = await response.json();
      if (response.ok) {
        displayMessage(data.message || "Registered successfully!", "success");
        window.location.href = "/login";  // Redirect after success
      } else {
        displayMessage(data.message || "Registration failed.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      displayMessage("An error occurred. Try again.", "error");
    }
  });
  
  function displayMessage(msg, type) {
    const messageDiv = document.getElementById('responseMessage');
    messageDiv.textContent = msg;
    messageDiv.className = type;
  }
  

//   function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     return parts.length === 2 ? parts.pop().split(';').shift() : '';
//   }
  