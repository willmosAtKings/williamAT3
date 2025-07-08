document.getElementById('dashboardBtn').addEventListener('click', function (e) {
e.preventDefault(); // prevent default button behavior just in case

fetch('/dashboard', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
    // You can add auth tokens or CSRF headers here if needed
    },
    body: JSON.stringify({}) // Send empty data or some payload
})
.then(response => {
    if (response.redirected) {
    // If server redirects, follow it
    window.location.href = response.url;
    } else {
    return response.json();
    }
})
.then(data => {
    console.log('Dashboard response:', data);

    // window.location.href = data.redirectTo;
})
.catch(error => {
    console.error('Error:', error);
});
});

