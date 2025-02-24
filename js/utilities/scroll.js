export const initScrollToTop = () => {
    const scrollBtn = document.querySelector('.masry-footer__scroll-link');
    
    if (!scrollBtn) return;

    // Show/hide button with fade effect
    const toggleScrollButton = () => {
        const scrollPosition = window.scrollY;
        if (scrollPosition > 300) {
            scrollBtn.style.opacity = Math.min(scrollPosition / 500, 1);
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = 0;
            setTimeout(() => {
                if (scrollBtn.style.opacity === '0') {
                    scrollBtn.style.visibility = 'hidden';
                }
            }, 300);
        }
    };

    // Smooth scroll with easing
    const scrollToTop = (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    window.addEventListener('scroll', toggleScrollButton);
    scrollBtn.addEventListener('click', scrollToTop);
};
