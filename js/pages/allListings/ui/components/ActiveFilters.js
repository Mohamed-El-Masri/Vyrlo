export class ActiveFilters {
    static render(filters) {
        const container = document.getElementById('activeFilters');
        if (!container) return;

        const activeFilters = Object.entries(filters)
            .filter(([_, value]) => value && value !== 'all')
            .map(([key, value]) => `
                <div class="masry-active-filter">
                    <span>${this.getFilterLabel(key, value)}</span>
                    <button class="masry-active-filter__remove" 
                            data-filter="${key}"
                            aria-label="Remove ${key} filter">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `).join('');

        container.innerHTML = activeFilters;
    }

    static getFilterLabel(key, value) {
        switch (key) {
            case 'search': return `Search: ${value}`;
            case 'location': return `Location: ${value}`;
            case 'category': return `Category: ${value}`;
            case 'status': return value === 'open' ? 'Open Now' : 'Closed';
            case 'rating': return `${value}+ Stars`;
            default: return '';
        }
    }
}
