export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const isCurrentlyOpen = (openingTimes) => {
    if (!openingTimes) return false;

    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });

    const schedule = openingTimes[day];
    if (!schedule || schedule.status === 'close') return false;

    return isTimeInRange(time, schedule.from, schedule.to);
};

export const isTimeInRange = (current, start, end) => {
    const parseTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const currentMinutes = parseTime(current);
    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

export const createQueryString = (params) => {
    return Object.entries(params)
        .filter(([_, value]) => value != null && value !== '')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
};

export const parseQueryString = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        name: params.get('name'),
        location: params.get('location'),
        categoryId: params.get('categoryId'),
        rating: params.get('rating'),
        status: params.get('status') || 'all'
    };
};

// تحسين أداء التحميل
export const optimizeImage = (url, width = 300) => {
    if (!url) return '../images/defaults/listing-placeholder.svg';
    // يمكن إضافة منطق لتحسين الصور هنا
    return url;
};
