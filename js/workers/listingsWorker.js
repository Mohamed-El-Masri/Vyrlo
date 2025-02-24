self.onmessage = function(e) {
    const { listings, page, itemsPerPage } = e.data;

    // فلترة القوائم النشطة
    const activeListings = listings.filter(listing => listing.isActive === true)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // حساب إجمالي الصفحات
    const totalPages = Math.ceil(activeListings.length / itemsPerPage);

    // حساب القوائم للصفحة الحالية
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentPageListings = activeListings.slice(start, end);

    self.postMessage({
        activeListings,
        currentPageListings,
        totalPages
    });
}; 