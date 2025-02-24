export class LoadingIndicator {
    static show() {
        const template = document.getElementById('skeletonTemplate');
        const container = document.getElementById('listingsContainer');
        if (!template || !container) return;

        // تحديد عدد العناصر حسب حجم الشاشة
        const count = window.innerWidth >= 1200 ? 8 : 
                     window.innerWidth >= 992 ? 6 : 
                     window.innerWidth >= 768 ? 4 : 2;

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            fragment.appendChild(template.content.cloneNode(true));
        }

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    static hide() {
        const container = document.getElementById('listingsContainer');
        if (!container) return;
        
        const skeletons = container.querySelectorAll('.masry-skeleton');
        skeletons.forEach(skeleton => skeleton.remove());
    }

    static showLoadMore() {
        const btn = document.getElementById('loadMore');
        if (!btn) return;

        btn.disabled = true;
        btn.classList.add('loading');
        btn.innerHTML = `
            <div class="masry-loading-spinner"></div>
            <span>Loading...</span>
        `;
    }

    static hideLoadMore() {
        const btn = document.getElementById('loadMore');
        if (!btn) return;

        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = `
            <span>Load More</span>
            <i class="bi bi-arrow-down"></i>
        `;
    }
}
