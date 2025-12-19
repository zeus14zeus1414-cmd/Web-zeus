
// ===============================================
// MARK: - 1. محرك التيتانيوم لحظر الإعلانات (Titanium Engine) - أداء محسن
// ===============================================
const TitaniumRules = {
  // كلمات قوية للحظر
  textFilters: [
    'skip ad', 'تخطي الاعلان', 'advertisement', 'sponsored',
    'bc.game', 'bet', 'casino', 'bonus', 'deposit', 'spin', 'win', 'تحميل التطبيق'
  ],
  whitelist: [
    'google', 'youtube', 'cloudflare', 'recaptcha', 'gstatic', 'googleapis', 'lek-manga'
  ],
  // محددات CSS قوية للإخفاء الفوري
  cssKillList: [
    '.ad', '.ads', '.banner', '[id^="ad-"]', '[class^="ad-"]',
    '.overlay', '#overlay', '.popup', '#popup',
    '[class*="floating"]',
    '[style*="position: fixed"][style*="bottom"]',
    '[style*="z-index: 99999"]', 'iframe[src*="ads"]', 'iframe[src*="doubleclick"]'
  ]
};

const AdBlockManager = {
  getTitaniumInjection: (userScripts = [], customBlockRules = []) => {
    
    const customCss = customBlockRules.map(rule => `${rule} { display: none !important; visibility: hidden !important; }`).join(' ');
    const generalCss = TitaniumRules.cssKillList.join(', ') + ' { display: none !important; visibility: hidden !important; }';
    const combinedCss = generalCss + ' ' + customCss;
    
    const scriptsStr = JSON.stringify(userScripts);
    const textFilters = JSON.stringify(TitaniumRules.textFilters);

    return `
      (function() {
        // --- 1. CSS Injection (Fast & Passive) ---
        const style = document.createElement('style');
        style.id = 'titanium-style-blocker';
        style.textContent = \`${combinedCss}\`; 
        (document.head || document.documentElement).appendChild(style);

        window.addCustomRule = function(selector) {
            try {
                const s = document.getElementById('titanium-style-blocker');
                if (s) s.textContent += \` \${selector} { display: none !important; }\`;
            } catch(e) {}
        };

        // --- 2. The "Aggressive" Hunter (Active JS) ---
        // OPTIMIZATION: تعمل الحلقة كل 4 ثواني بدلاً من ثانية واحدة لتخفيف الحمل على المتصفح
        
        const badWords = ${textFilters};
        
        function aggressiveClean() {
            // طلب إطار زمني خامل للتنفيذ (requestIdleCallback) إن وجد لتجنب تجميد الواجهة
            if (window.requestIdleCallback) {
                requestIdleCallback(runCleaningLogic);
            } else {
                setTimeout(runCleaningLogic, 10);
            }
        }

        function runCleaningLogic() {
            try {
                // 1. تنظيف الروابط السيئة
                const links = document.querySelectorAll('a');
                for (let i = 0; i < links.length; i++) {
                    const href = links[i].href.toLowerCase();
                    if (href.includes('bc.game') || href.includes('bet') || href.includes('pop')) {
                        links[i].remove();
                    }
                }

                // 2. صيد النوافذ المنبثقة (Popups) والعناصر العائمة
                const candidates = document.querySelectorAll('div, iframe, section');
                for (let i = 0; i < candidates.length; i++) {
                    const el = candidates[i];
                    if (el.offsetParent === null) continue;

                    const style = window.getComputedStyle(el);
                    
                    if (style.position === 'fixed' || style.position === 'absolute') {
                        const z = parseInt(style.zIndex);
                        if (!isNaN(z) && z > 900) {
                             const rect = el.getBoundingClientRect();
                             if (rect.height > 100 && rect.top > 50) {
                                 el.remove();
                                 continue;
                             }
                        }
                    }

                    if (el.tagName === 'DIV' && el.innerText.length < 100 && el.innerText.length > 3) {
                        const txt = el.innerText.toLowerCase();
                        if (badWords.some(w => txt.includes(w))) {
                            el.remove();
                        }
                    }
                }
            } catch(e) {}
        }

        // تشغيل الفحص "القوي" كل 4 ثواني (تم التعديل لتسريع المتصفح)
        setInterval(aggressiveClean, 4000);
        
        if (document.readyState === 'complete') aggressiveClean();
        else window.addEventListener('load', aggressiveClean);

        // --- 3. User Scripts ---
        try {
            const scripts = ${scriptsStr};
            scripts.forEach(script => {
                if (script.active && (script.domain === '*' || window.location.href.includes(script.domain))) {
                     try { eval('(function() { ' + script.code + ' })();'); } catch(e){}
                }
            });
        } catch(e) {}

      })();
      true;
    `;
  },

  shouldBlockRequest: (url, currentUrl) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('cloudflare') || lowerUrl.includes('challenge')) return false;
    
    const blacklist = [
        'doubleclick.net', 'googlesyndication', 'facebook.com/tr', 'google-analytics', 
        'adnxs', 'popcash', 'popads', 'mc.yandex.ru', 'gemini', 'exoclick', 'propellerads'
    ];
    
    if (blacklist.some(w => lowerUrl.includes(w))) return true;
    return false;
  }
};

export default AdBlockManager;
