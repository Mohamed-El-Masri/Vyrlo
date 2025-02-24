import { APIService } from './services/APIService.js';
import { UIManager } from './ui/UIManager.js';
import { FilterManager } from './managers/FilterManager.js';
import { ListingsManager } from './ListingsManager.js';
import { config } from './config.js';

export async function initializeApp() {
    try {
        // 1. إنشاء ListingsManager أولاً
        const listingsManager = new ListingsManager({
            api: new APIService(config.api),
            config
        });

        // 2. إنشاء FilterManager مع تمرير ListingsManager
        const filterManager = new FilterManager(listingsManager);
        
        // 3. إنشاء UIManager مع تمرير FilterManager
        const ui = new UIManager(listingsManager, filterManager);

        // 4. تحديث ListingsManager بالمكونات
        listingsManager.ui = ui;
        listingsManager.filterManager = filterManager;

        // 5. تهيئة البيانات
        await listingsManager.loadInitialData();
        
        // 6. معالجة URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('categoryId')) {
            await listingsManager.filterByCategory(urlParams.get('categoryId'));
        }

        return listingsManager;

    } catch (error) {
        console.error('Failed to initialize application:', error);
        throw error;
    }
}
