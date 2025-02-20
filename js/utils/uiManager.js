
class UIManager {
    constructor() {
        this.intersectionObserver = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { threshold: 0.1 }
        );
    }

    // Smooth Animations
    initAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(el => this.intersectionObserver.observe(el));
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                this.intersectionObserver.unobserve(entry.target);
            }
        });
    }

    // Loading States
    showLoading(element) {
        element.classList.add('loading');
        element.setAttribute('aria-busy', 'true');
    }

    hideLoading(element) {
        element.classList.remove('loading');
        element.setAttribute('aria-busy', 'false');
    }

    // Error States
    showError(message, container) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-state';
        errorElement.innerHTML = `
            <div class="error-animation">
                <lottie-player
                    src="../animations/error.json"
                    background="transparent"
                    speed="1"
                    style="width: 100px; height: 100px;"
                    autoplay
                ></lottie-player>
            </div>
            <h3>${message}</h3>
            <button class="retry-button">Retry</button>
        `;
        container.appendChild(errorElement);
    }
}

export const uiManager = new UIManager();
