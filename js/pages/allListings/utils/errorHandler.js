export const handleError = (error, container) => {
    console.error('Error:', error);
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="masry-error">
            <i class="bi bi-exclamation-circle"></i>
            <h3>Something went wrong</h3>
            <p>${error.message || 'Please try again later'}</p>
            <button onclick="window.location.reload()" class="masry-btn masry-btn--retry">
                Try Again
            </button>
        </div>
    `;
};
