// تحديث وتصحيح تصدير الدالة
export async function setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/js/main/serviceWorker.js');
            console.log('ServiceWorker registration successful:', registration);
            return registration;
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
            return null;
        }
    }
    return null;
}

// تكوين الـ Cache
const CACHE_NAME = 'vyrlo-listings-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/main/style.css',
    '/css/pages/allListings.css',
    '/js/pages/allListings/index.js',
    '/images/defaults/listing-placeholder.svg'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// التعامل مع الطلبات
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إرجاع النسخة المخزنة إذا وجدت
                if (response) {
                    return response;
                }

                // جلب وتخزين طلب جديد
                return fetch(event.request).then(response => {
                    // التحقق من صحة الاستجابة
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // نسخ الاستجابة لأن الطلب يمكن استخدامه مرة واحدة فقط
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// تحديث الـ Cache
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
