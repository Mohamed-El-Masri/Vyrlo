export const handleNetworkError = (error) => {
    const isOffline = !navigator.onLine;
    const message = isOffline ? 
        'You are offline. Please check your internet connection.' :
        'Network error. Please try again later.';
        
    showError(message, isOffline ? 'offline' : 'error');
    console.error('Network Error:', error);
};

export const showError = (message, type = 'error') => {
    const container = document.getElementById('listingsContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="masry-message masry-message--${type}">
            <i class="bi bi-exclamation-circle"></i>
            <h3>${type === 'error' ? 'Something went wrong' : 'Notice'}</h3>
            <p>${message}</p>
            ${type === 'error' ? `
                <button onclick="window.location.reload()" class="masry-btn masry-btn--retry">
                    <i class="bi bi-arrow-clockwise"></i>
                    Try Again
                </button>
            ` : ''}
        </div>
    `;
};

export const handleAPIError = (error) => {
    console.error('API Error:', error);
    showError('Failed to fetch data from server. Please try again later.');
};

export const handleValidationError = (error) => {
    console.warn('Validation Error:', error);
    return false;
};
