export class ListingCardUI {
    create(listing) {
        if (!listing) return '';

        return `
            <article class="masry-listing-card" data-id="${listing._id}">
                ${this.createImage(listing)}
                ${this.createContent(listing)}
            </article>
        `;
    }

    createImage(listing) {
        return `
            <div class="masry-listing-image">
                <img src="${listing.mainImage || '../images/defaults/listing-placeholder.svg'}" 
                     alt="${listing.listingName}"
                     loading="lazy"
                     data-src="${listing.mainImage}">
                ${this.createBadges(listing)}
            </div>
        `;
    }

    createBadges(listing) {
        const isOpen = this.isCurrentlyOpen(listing);
        const category = this.getCategoryInfo(listing);

        return `
            <div class="masry-listing-badges">
                <span class="masry-badge ${isOpen ? 'open' : 'closed'}">
                    ${isOpen ? 'Open Now' : 'Closed'}
                </span>
                <span class="masry-badge category">
                    ${category.categoryName}
                </span>
            </div>
        `;
    }

    createContent(listing) {
        return `
            <div class="masry-listing-content">
                ${this.createHeader(listing)}
                ${this.createInfo(listing)}
                ${this.createFooter(listing)}
            </div>
        `;
    }

    isCurrentlyOpen(listing) {
        if (!listing.openingTimes) return false;

        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' });
        const time = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });

        const todaySchedule = listing.openingTimes[day];
        if (!todaySchedule || todaySchedule.status === 'close') return false;

        return this.isTimeInRange(time, todaySchedule.from, todaySchedule.to);
    }

    getCategoryInfo(listing) {
        return listing.categoryId ? 
            (typeof listing.categoryId === 'object' ? listing.categoryId : { categoryName: 'Uncategorized' }) 
            : { categoryName: 'Uncategorized' };
    }

    isTimeInRange(current, start, end) {
        const parseTime = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const currentMinutes = parseTime(current);
        const startMinutes = parseTime(start);
        const endMinutes = parseTime(end);

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
}
