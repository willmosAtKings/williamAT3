document.getElementById('dashboardBtn').addEventListener('click', function (e) {
    e.preventDefault();

    fetch('/dashboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirectTo) {
            window.location.href = data.redirectTo;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
