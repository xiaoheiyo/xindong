const CACHE_NAME = 'xindong-v1';
const ASSETS_TO_CACHE = [
  '/index.html',
  '/favicon.ico',
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 开始缓存资源');
      // 分别添加每个资源,避免一个失败导致全部失败
      return Promise.all(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] 缓存失败: ${url}`, err);
          })
        )
      );
    }).then(() => {
      console.log('[SW] 核心资源缓存完成');
    })
  );
  self.skipWaiting();
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 缓存命中,返回缓存的资源
      if (response) {
        return response;
      }

      // 克隆请求,因为request只能使用一次
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // 检查是否收到有效响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 克隆响应,因为response只能使用一次
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // 网络失败时的fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
