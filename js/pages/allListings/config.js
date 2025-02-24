export const config = {
    api: {
        baseUrl: 'https://virlo.vercel.app',
        endpoints: {
            listings: '/listing',
            categories: '/categories'
        }
    },
    view: {
        grid: {
            desktop: 4,
            tablet: 3,
            mobile: 1
        },
        initialCount: 8,
        loadMoreCount: 4
    },
    filters: {
        debounceTime: 300,
        minSearchLength: 2
    },
    cache: {
        duration: 15 * 60 * 1000, // 15 minutes
        keys: {
            listings: 'vyrlo_listings_cache',
            categories: 'vyrlo_categories_cache'
        }
    }
};
