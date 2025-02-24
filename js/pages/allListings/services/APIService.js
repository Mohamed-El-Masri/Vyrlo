import { handleNetworkError } from '../utils/errorHandlers.js';

export class APIService {
    constructor(config) {
        this.config = config;
        this.cache = {
            listings: [],
            totalItems: 0,
            consecutiveSameSize: 0,
            lastValue: 1
        };
    }

    async fetchAllListings() {
        try {
            let allListings = [];
            let hasMore = true;
            this.cache.consecutiveSameSize = 0;
            this.cache.lastValue = 1;

            while (hasMore) {
                const params = new URLSearchParams();
                params.set('lastValue', this.cache.lastValue.toString());

                const data = await this.fetchWithRetry(
                    `${this.config.baseUrl}${this.config.endpoints.listings}/?${params}`
                );

                // التحقق من صحة الاستجابة
                if (!data || !Array.isArray(data.listings)) {
                    throw new Error('Invalid API response format');
                }

                // التحقق من تكرار الحجم
                if (allListings.length > 0 && data.totalItems === this.cache.totalItems) {
                    this.cache.consecutiveSameSize++;
                    if (this.cache.consecutiveSameSize >= 3) {
                        hasMore = false;
                        console.log('Stopped: Same size received 3 times consecutively');
                        break;
                    }
                } else {
                    this.cache.consecutiveSameSize = 0;
                }

                // تحديث Cache
                this.cache.totalItems = data.totalItems;
                allListings = [...allListings, ...data.listings];
                this.cache.lastValue++;

                // التحقق من اكتمال جميع العناصر
                if (allListings.length >= data.totalItems) {
                    hasMore = false;
                    console.log('Stopped: All items received');
                    break;
                }
            }

            // حفظ النتائج في الكاش
            this.cache.listings = allListings;
            
            return {
                listings: allListings,
                totalItems: this.cache.totalItems,
                meta: {
                    lastValue: this.cache.lastValue - 1,
                    consecutiveSameSize: this.cache.consecutiveSameSize
                }
            };

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async fetchListingsWithFilters(filters) {
        // استخدام الكاش المحلي للفلترة
        if (this.cache.listings.length > 0) {
            return this.filterCachedListings(filters);
        }

        // إذا لم يكن هناك كاش، قم بتحميل البيانات أولاً
        await this.fetchAllListings();
        return this.filterCachedListings(filters);
    }

    filterCachedListings(filters) {
        let filtered = [...this.cache.listings];

        // تطبيق الفلاتر
        if (filters.name) {
            filtered = filtered.filter(item => 
                item.listingName.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        if (filters.location) {
            filtered = filtered.filter(item => 
                item.location.toLowerCase().includes(filters.location.toLowerCase())
            );
        }

        if (filters.categoryId) {
            filtered = filtered.filter(item => 
                item.categoryId?._id === filters.categoryId
            );
        }

        return {
            listings: filtered,
            totalItems: filtered.length,
            filteredFrom: this.cache.totalItems
        };
    }

    async fetchListings(params) {
        try {
            // تنقية البارامترات وإزالة القيم null و undefined و empty strings
            const queryParams = new URLSearchParams();
            
            // إضافة lastValue دائماً
            queryParams.append('lastValue', params.get('lastValue') || '1');

            // إضافة باقي البارامترات فقط إذا كانت لها قيمة فعلية
            const name = params.get('name');
            const location = params.get('location');
            const categoryId = params.get('categoryId');

            // إضافة البارامترات فقط إذا لها قيمة وليست فارغة أو null
            if (name?.trim()) queryParams.append('name', name);
            if (location?.trim()) queryParams.append('location', location);
            if (categoryId?.trim()) queryParams.append('categoryId', categoryId);

            const url = `${this.config.baseUrl}${this.config.endpoints.listings}/?${queryParams}`;
            console.log('Fetching URL:', url); // للتأكد من الـ URL النهائي

            const response = await this.fetchWithRetry(url);
            return this.validateListingsResponse(response);
        } catch (error) {
            console.error('API Error:', error);
            return { listings: [], totalItems: 0 };
        }
    }

    async fetchCategories() {
        try {
            const response = await this.fetchWithRetry(
                `${this.config.baseUrl}${this.config.endpoints.categories}`
            );
            return response;
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    buildQueryString(params) {
        const queryParams = new URLSearchParams();
        
        if (params.lastValue) queryParams.set('lastValue', params.lastValue);
        if (params.name) queryParams.set('name', params.name);
        if (params.location) queryParams.set('location', params.location);
        if (params.categoryId) queryParams.set('categoryId', params.categoryId);
        
        return queryParams.toString();
    }

    validateListingsResponse(response) {
        if (!response || !Array.isArray(response.listings)) {
            throw new Error('Invalid API response format');
        }
        return {
            listings: response.listings.filter(listing => listing.isActive),
            totalItems: response.totalItems
        };
    }
}
