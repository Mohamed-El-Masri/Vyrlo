document.addEventListener('DOMContentLoaded', function() {
    // Get error details from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('code') || '404';
    const errorMessage = urlParams.get('message') || 'Page not found';

    // Update error message if provided in URL
    const messageElement = document.querySelector('.error-message');
    if (messageElement && urlParams.has('message')) {
        messageElement.textContent = errorMessage;
    }

    // Handle back button
    const backButton = document.querySelector('.error-btn');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (document.referrer) {
                // Go back to previous page if available
                window.location.href = document.referrer;
            } else {
                // Go to home page if no referrer
                window.location.href = '/';
            }
        });
    }

    // Log error for tracking (optional)
    console.log(`Error occurred: ${errorCode} - ${errorMessage}`);
});
