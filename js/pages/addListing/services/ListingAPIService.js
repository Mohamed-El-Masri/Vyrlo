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

    // ... other API methods ...
}
