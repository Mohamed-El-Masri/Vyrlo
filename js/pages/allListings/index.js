import { initializeApp } from './bootstrap.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = await initializeApp();
        window.listingsManager = app;
        
        // تهيئة الحالة الأولية
        await app.initializeFromURL();
        await app.loadInitialData();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});
