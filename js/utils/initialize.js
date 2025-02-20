import { securityManager } from './security.js';
import { performanceManager } from './performanceManager.js';
import { uiManager } from './uiManager.js';

export function initializeUtils() {
    // Initialize managers
    window.securityManager = securityManager;
    window.performanceManager = performanceManager;
    window.uiManager = uiManager;

    // Setup Web Worker
    if (typeof Worker !== 'undefined') {
        window.listingsWorker = new Worker('../js/workers/listings.worker.js');
    }
}
