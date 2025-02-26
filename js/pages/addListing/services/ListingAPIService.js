import { getCategories as fetchCategories } from '../../../main/getCategories.js';

export class ListingAPIService {
    static baseUrl = 'https://virlo.vercel.app';
    static headers = {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
    };

    static async createListing(data) {
        try {
            const response = await fetch(`${this.baseUrl}/listing`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error creating listing');
            }

            return await response.json();
        } catch (error) {
            console.error('Create listing error:', error);
            throw error;
        }
    }

    static async updateListing(id, data) {
        try {
            const response = await fetch(`${this.baseUrl}/listing/${id}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error updating listing');
            }

            return await response.json();
        } catch (error) {
            console.error('Update listing error:', error);
            throw error;
        }
    }

    static async uploadImages(files, listingInfo) {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        formData.append('listingName', listingInfo.listingName);

        const response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            headers: { 'Authorization': this.headers.Authorization },
            body: formData
        });

        if (!response.ok) throw new Error('Image upload failed');
        return await response.json();
    }

    static async getDraft(userId) {
        // استرجاع المسودة
    }

    static async saveDraft(data) {
        // حفظ المسودة
    }

    static async getListing(id) {
        try {
            const response = await fetch(`${this.baseUrl}/listing/${id}`);
            if (!response.ok) {
                throw new Error('Listing not found');
            }
            return await response.json();
        } catch (error) {
            console.error('Get listing error:', error);
            throw error;
        }
    }

    static async validateListing(data) {
        try {
            const response = await fetch(`${this.baseUrl}/listing/validate`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            throw new Error('Validation failed');
        }
    }

    static getIconForCategory(category) {
        // تأكد من وجود الفئة أولاً
        if (!category) return 'fas fa-store';

        // 1. استخدام الأيقونة الموجودة في البيانات
        if (category.iconOne && category.iconOne.trim() !== '') {
            return `fas fa-${category.iconOne}`;
        }

        // 2. خريطة الأيقونات الافتراضية حسب اسم الفئة
        const iconMap = {
            'restaurant': 'utensils',
            'cafe': 'coffee',
            'hotel': 'hotel',
            'store': 'store',
            'salon': 'cut',
            'gym': 'dumbbell',
            'clinic': 'clinic-medical',
            'car': 'car',
            'bank': 'university',
            'school': 'school',
            'pharmacy': 'prescription-bottle-alt',
            'bakery': 'bread-slice',
            'market': 'shopping-cart'
        };

        // 3. البحث عن تطابق في اسم الفئة
        const categoryName = category.categoryName || ''; // استخدام قيمة افتراضية فارغة
        const categoryNameLower = categoryName.toLowerCase();
        
        for (const [key, icon] of Object.entries(iconMap)) {
            if (categoryNameLower.includes(key)) {
                return `fas fa-${icon}`;
            }
        }

        // 4. الأيقونة الافتراضية
        return 'fas fa-store';
    }

    static async getCategories() {
        try {
            const categories = await fetchCategories();
            console.log('Raw categories:', categories); // للتأكد من شكل البيانات

            if (!Array.isArray(categories)) {
                console.error('Categories is not an array:', categories);
                return [];
            }

            return categories.map(category => {
                // تأكد من أن الفئة موجودة وتحتوي على البيانات المطلوبة
                if (!category) return null;

                return {
                    id: category._id || '',
                    name: category.categoryName || '',
                    icon: this.getIconForCategory(category),
                    description: category.description || '',
                    amenities: category.amenities || []
                };
            }).filter(Boolean); // إزالة القيم الفارغة

        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    static async searchCategories(query) {
        try {
            const allCategories = await this.getCategories();
            
            if (!query) return allCategories;

            const cleanQuery = query.toLowerCase().trim();
            return allCategories.filter(category => 
                category.name.toLowerCase().includes(cleanQuery) ||
                (category.description && category.description.toLowerCase().includes(cleanQuery))
            );
        } catch (error) {
            console.error('Error searching categories:', error);
            throw error;
        }
    }

    // ... other API methods ...
}
