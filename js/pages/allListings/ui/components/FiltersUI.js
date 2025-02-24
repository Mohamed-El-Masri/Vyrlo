export class FiltersUI {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Status Filters
        document.querySelectorAll('.masry-status__btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleStatusClick(btn));
        });

        // Rating Filter
        const ratingStars = document.querySelector('.masry-rating-stars');
        if (ratingStars) {
            ratingStars.addEventListener('click', (e) => this.handleRatingClick(e));
        }

        // Category Filter
        document.querySelectorAll('.masry-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.handleCategoryChange(checkbox));
        });
    }

    handleStatusClick(button) {
        document.querySelectorAll('.masry-status__btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });

        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
    }

    handleRatingClick(event) {
        const star = event.target.closest('.masry-rating-star');
        if (!star) return;

        const rating = parseInt(star.dataset.rating);
        const stars = document.querySelectorAll('.masry-rating-star');

        stars.forEach((s, index) => {
            s.classList.toggle('active', 5 - index <= rating);
        });
    }

    handleCategoryChange(checkbox) {
        const label = checkbox.closest('.masry-checkbox');
        label.classList.toggle('checked', checkbox.checked);
    }
}
