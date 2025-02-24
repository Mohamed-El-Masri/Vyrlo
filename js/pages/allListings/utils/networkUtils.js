export const checkConnection = () => {
    return new Promise((resolve) => {
        if (navigator.onLine) {
            // Double check with a fetch request
            fetch('https://virlo.vercel.app/ping', { method: 'HEAD' })
                .then(() => resolve(true))
                .catch(() => resolve(false));
        } else {
            resolve(false);
        }
    });
};

export const setupNetworkListeners = (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
};
