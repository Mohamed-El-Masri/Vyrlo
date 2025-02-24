document.addEventListener('DOMContentLoaded', function() {
    const scrollBtn = document.querySelector('.masry-footer__scroll-link');
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });

    // Smooth scroll to top with animation
    scrollBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
