
class PerformanceManager {
    constructor() {
        this.virtualScroller = null;
        this.imageObserver = null;
        this.initImageLazyLoading();
    }

    // Virtual Scrolling
    initVirtualScroll(container, items, itemHeight) {
        this.virtualScroller = {
            container,
            items,
            itemHeight,
            visibleItems: Math.ceil(container.clientHeight / itemHeight) + 2,
            firstVisibleItem: 0
        };

        container.addEventListener('scroll', this.handleVirtualScroll.bind(this));
        this.updateVirtualScroll();
    }

    handleVirtualScroll() {
        requestAnimationFrame(() => {
            const scrollTop = this.virtualScroller.container.scrollTop;
            this.virtualScroller.firstVisibleItem = Math.floor(scrollTop / this.virtualScroller.itemHeight);
            this.updateVirtualScroll();
        });
    }

    updateVirtualScroll() {
        const { container, items, itemHeight, visibleItems, firstVisibleItem } = this.virtualScroller;
        const visibleRange = items.slice(firstVisibleItem, firstVisibleItem + visibleItems);
        
        container.style.height = `${items.length * itemHeight}px`;
        container.innerHTML = '';
        
        visibleRange.forEach((item, index) => {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.top = `${(firstVisibleItem + index) * itemHeight}px`;
            element.style.height = `${itemHeight}px`;
            element.innerHTML = item;
            container.appendChild(element);
        });
    }

    // Image Lazy Loading
    initImageLazyLoading() {
        this.imageObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            },
            { rootMargin: '50px' }
        );
    }

    observeImage(imgElement) {
        if (this.imageObserver && imgElement.dataset.src) {
            this.imageObserver.observe(imgElement);
        }
    }

    // Memory Management
    clearCache() {
        if (this.virtualScroller) {
            this.virtualScroller.items = [];
            this.virtualScroller.container.innerHTML = '';
        }
        
        // Clear image observers
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
    }
}

export const performanceManager = new PerformanceManager();
