class ErrorHandler {
    static handleError(error, redirectTo404 = true) {
        console.error('Error occurred:', error);

        const errorMessages = {
            400: 'Bad Request - Invalid input provided',
            401: 'Unauthorized - Please login to continue',
            403: 'Forbidden - You don\'t have permission',
            404: 'Page Not Found',
            500: 'Internal Server Error',
            503: 'Service Temporarily Unavailable'
        };

        const errorMessage = errorMessages[error.status] || 'An unexpected error occurred';

        if (redirectTo404) {
            this.redirectToErrorPage(error.status || 404, errorMessage);
            return;
        }

        this.showErrorMessage(errorMessage, 'error-container');
    }

    static showErrorMessage(message, containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.role = 'alert';
            errorDiv.textContent = message;
            container.appendChild(errorDiv);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }

    static redirectToErrorPage(errorCode, errorMessage) {
        const params = new URLSearchParams();
        params.append('code', errorCode);
        params.append('message', errorMessage);
        
        window.location.href = `/pages/404.html?${params.toString()}`;
    }

    static showToast(message, type = 'error') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Example usage:
/*
try {
    // Some code that might throw an error
    throw { status: 403, message: 'Access denied' };
} catch (error) {
    ErrorHandler.handleError(error);
}

// Or directly redirect with custom message:
// ErrorHandler.redirectToErrorPage(500, 'Custom error message');
*/
