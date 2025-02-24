export class URLManager {
    static updateURL(filters) {
        const params = new URLSearchParams();
        Object.entries(filters)
            .filter(([_, value]) => value !== null && value !== 'all')
            .forEach(([key, value]) => params.set(key, value));
        
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }

    static getFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        return {
            category: params.get('categoryId'),
            search: params.get('name'),
            location: params.get('location'),
            status: params.get('status') || 'all',
            rating: params.get('rating')
        };
    }
}
