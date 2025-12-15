import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  PanResponder,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
// بالإضافة الجديدة للحفظ الدائم
import AsyncStorage from '@react-native-async-storage/async-storage';
// مكتبة الأيقونات (تأكد من تثبيتها: npm install react-native-vector-icons)
import Icon from 'react-native-vector-icons/Feather';

// ===============================================
// MARK: - 1. محرك التيتانيوم لحظر الإعلانات (Titanium Engine) - تم التعديل
// ===============================================
const TitaniumRules = {
  // كلمات إذا وجدت في *نص* العنصر سيتم حذفه
  textFilters: [
    'skip ad', 'skip', 'تخطي', 'تخطى', 'advertisement', 'sponsored',
    'bc.game', 'bet', 'casino', 'bonus', 'deposit', 'spin', 'win',
    'download app', 'open in app'
  ],
  // القائمة البيضاء (استثناء مطلق)
  whitelist: [
    'google', 'youtube', 'cloudflare', 'recaptcha', 'gstatic', 'googleapis',
    'accounts.google', 'oauth', 'signin', 'sso', 'login', 'lek-manga'
  ],
  // محددات CSS للإزالة الفورية (تم تخفيف القيود هنا لحل مشكلة التعليق)
  cssKillList: [
    '.ad', '.ads', '.banner', '[id*="ad-"]', '[class*="ad-"]',
    // ⚠️ تم حذف سطر إخفاء الـ iframe الذي كان يسبب المشكلة
    '[class*="popup"]', '[id*="popup"]',
    '.overlay', '#overlay',
    '[class*="floating"]',
    '[style*="position: fixed"][style*="bottom"]',
    '[style*="z-index: 999"]', '[style*="z-index: 9999"]'
  ]
};

const AdBlockManager = {
  getTitaniumInjection: () => {
    const cssSelectors = TitaniumRules.cssKillList.join(', ');
    const textFilters = JSON.stringify(TitaniumRules.textFilters);
    const whiteListStr = JSON.stringify(TitaniumRules.whitelist);

    return `
      (function() {
        // 1. وضع التخفي (Stealth Mode) لتجاوز البوتات
        try {
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        } catch(e) {}

        // 2. فحص هل الصفحة هي صفحة تحقق Cloudflare؟
        const isCloudflare = document.title.includes('Just a moment') || 
                             document.title.includes('Security Check') ||
                             document.body.innerText.includes('Cloudflare') ||
                             window.location.href.includes('challenge');

        if (isCloudflare) {
            console.log('🛡️ Cloudflare Challenge Detected - AdBlock PAUSED');
            return; // ⛔️ إيقاف الحماية تماماً للسماح بالتحقق
        }

        // 3. التحقق من القائمة البيضاء
        const whitelist = ${whiteListStr};
        const currentUrl = window.location.href.toLowerCase();
        if (whitelist.some(w => currentUrl.includes(w))) {
            console.log('🛡️ WhiteList: Protection Disabled');
            return; 
        }

        console.log('🛡️ Titanium Block Active');

        // 4. حقن CSS (بدون إخفاء الإطارات)
        const style = document.createElement('style');
        style.innerText = \`
          ${cssSelectors} { display: none !important; opacity: 0 !important; pointer-events: none !important; }
          body { overflow-x: hidden; }
        \`;
        document.head.appendChild(style);

        // 5. دالة التنظيف
        function purgeMalware() {
          // تم إزالة حذف الـ iframes لتجنب تدمير التحقق
          
          // تدمير العناصر العائمة والنصوص المزعجة
          const candidates = document.querySelectorAll('div, a, button, span, p');
          const badWords = ${textFilters};
          
          candidates.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
               if (style.zIndex > 50 || style.bottom === '0px' || style.top === '0px') {
                  if (!el.innerText.includes('Home') && !el.innerText.includes('Menu') && !el.innerText.includes('الرئيسية')) {
                      el.remove();
                  }
               }
            }

            if (el.innerText) {
               const text = el.innerText.toLowerCase().trim();
               if (text.length < 50 && badWords.some(w => text.includes(w))) {
                  el.closest('div')?.remove();
                  el.remove();
               }
            }
          });
          
          document.querySelectorAll('a[href*="bc.game"]').forEach(el => el.remove());
        }

        setInterval(purgeMalware, 1500); // إبطاء الفحص قليلاً
      })();
      true;
    `;
  },

  shouldBlockRequest: (url, currentUrl) => {
    const lowerUrl = url.toLowerCase();
    
    // السماح بكل ما هو Cloudflare
    if (lowerUrl.includes('cloudflare') || lowerUrl.includes('challenge')) return false;

    if (TitaniumRules.whitelist.some(w => lowerUrl.includes(w))) return false;
    
    try {
        const urlObj = new URL(url);
        const currentObj = new URL(currentUrl);
        if (urlObj.hostname === currentObj.hostname) return false;
    } catch(e) {}

    const blacklist = ['ad', 'ads', 'tracker', 'analytics', 'doubleclick', 'facebook', 'pop', 'click', 'bet', 'game', 'bonus'];
    if (blacklist.some(w => lowerUrl.includes(w))) return true;

    return false;
  }
};

// ===============================================
// MARK: - 2. المخزن المحلي (Storage)
// ===============================================
const Storage = {
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },
};

// ===============================================
// MARK: - 3. مكونات التطبيق الرئيسية
// ===============================================
const SmartBrowser = () => {
  const [tabs, setTabs] = useState([]);
  const [currentTabID, setCurrentTabID] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [history, setHistory] = useState([]);
  const [adsBlocked, setAdsBlocked] = useState(0);
  const [isForcedDarkMode, setIsForcedDarkMode] = useState(false);
  const [showWebsitesBar, setShowWebsitesBar] = useState(false);
  const [showTabsTray, setShowTabsTray] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isToolbarHidden, setIsToolbarHidden] = useState(true);
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [tabToFavorite, setTabToFavorite] = useState(null);
  const webViewRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedWebsites = await Storage.getItem('saved_websites');
    if (savedWebsites) setWebsites(savedWebsites);

    const savedHistory = await Storage.getItem('browser_history_data');
    if (savedHistory)
      setHistory(
        savedHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
      );

    const savedDarkMode = await Storage.getItem('browser_forced_dark_mode_key');
    if (savedDarkMode) setIsForcedDarkMode(savedDarkMode);

    const savedTabs = await Storage.getItem('browser_saved_tabs_list');
    const lastActiveTab = await Storage.getItem('browser_last_active_tab_id');

    if (savedTabs && savedTabs.length > 0) {
      setTabs(savedTabs);
      setCurrentTabID(lastActiveTab || savedTabs[0].id);
    } else {
      const initialTab = {
        id: generateUUID(),
        title: 'البداية',
        url: 'https://google.com/',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
      };
      setTabs([initialTab]);
      setCurrentTabID(initialTab.id);
    }
  };

  const saveTabsState = async (newTabs, newCurrentID) => {
    const tabsData = newTabs.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
    }));
    await Storage.setItem('browser_saved_tabs_list', tabsData);
    await Storage.setItem('browser_last_active_tab_id', newCurrentID);
  };

  const addNewTab = (url = 'https://www.google.com') => {
    const newTab = {
      id: generateUUID(),
      title: 'تبويب جديد',
      url: url,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
    };
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setCurrentTabID(newTab.id);
    saveTabsState(newTabs, newTab.id);
    setShowTabsTray(false);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    const newTabs = tabs.filter((t) => t.id !== id);
    if (currentTabID === id) {
      const newIndex = index === 0 ? 0 : index - 1;
      setCurrentTabID(newTabs[newIndex].id);
      saveTabsState(newTabs, newTabs[newIndex].id);
    } else {
      saveTabsState(newTabs, currentTabID);
    }
    setTabs(newTabs);
  };

  const selectTab = (id) => {
    setCurrentTabID(id);
    saveTabsState(tabs, id);
  };

  const updateTab = (id, updates) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const addWebsite = async (name, url) => {
    const finalUrl = url.toLowerCase().startsWith('http')
      ? url
      : `https://${url}`;
    const newWebsite = {
      id: generateUUID(),
      name,
      url: finalUrl,
      dateAdded: new Date().toISOString(),
    };
    const newWebsites = [newWebsite, ...websites];
    setWebsites(newWebsites);
    await Storage.setItem('saved_websites', newWebsites);
  };

  const deleteWebsite = async (id) => {
    const newWebsites = websites.filter((w) => w.id !== id);
    setWebsites(newWebsites);
    await Storage.setItem('saved_websites', newWebsites);
  };

  const addToHistory = async (title, url) => {
    if (!title || !url || url === 'about:blank') return;
    const first = history[0];
    if (first && first.url === url && Date.now() - new Date(first.date) < 60000)
      return;

    const newItem = {
      id: generateUUID(),
      title,
      url,
      date: new Date().toISOString(),
    };
    const newHistory = [newItem, ...history].slice(0, 1000);
    setHistory(newHistory);
    await Storage.setItem('browser_history_data', newHistory);
  };

  const deleteHistoryItem = async (id) => {
    const newHistory = history.filter((h) => h.id !== id);
    setHistory(newHistory);
    await Storage.setItem('browser_history_data', newHistory);
  };

  const clearAllHistory = async () => {
    setHistory([]);
    await Storage.setItem('browser_history_data', []);
  };

  const toggleDarkMode = () => {
    const newMode = !isForcedDarkMode;
    setIsForcedDarkMode(newMode);
    Storage.setItem('browser_forced_dark_mode_key', newMode);
    const currentTab = tabs.find((t) => t.id === currentTabID);
    if (currentTab && webViewRefs.current[currentTab.id]) {
      applyDarkMode(webViewRefs.current[currentTab.id], newMode);
    }
  };

  const applyDarkMode = (webViewRef, isDark) => {
    if (!webViewRef) return;
    const js = isDark
      ? `if (!document.getElementById('forced-dark-mode-style')) {
      var style = document.createElement('style');
      style.id = 'forced-dark-mode-style';
      style.innerHTML = 'html { filter: invert(100%) hue-rotate(180deg) !important; } img, video, iframe, canvas { filter: invert(100%) hue-rotate(180deg) !important; }';
      document.head.appendChild(style);
    }`
      : `if (document.getElementById('forced-dark-mode-style')) {
      document.getElementById('forced-dark-mode-style').remove();
    }`;
    webViewRef.injectJavaScript(js);
  };

  const currentTab = tabs.find((t) => t.id === currentTabID);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />

      <View style={styles.webViewContainer}>
        {currentTab && (
          <>
            {currentTab.isLoading && (
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            )}
            <WebView
              // تعديل هام: UserAgent متوافق مع Chrome Android لتجاوز الحماية
              userAgent="Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
              key={currentTab.id}
              ref={(ref) => (webViewRefs.current[currentTab.id] = ref)}
              source={{ uri: currentTab.url }}
              onLoad={() => updateTab(currentTab.id, { isLoading: false })}
              onLoadStart={() => updateTab(currentTab.id, { isLoading: true })}
              onLoadEnd={() => updateTab(currentTab.id, { isLoading: false })}
              // ============================================
              // ⛔️ الميزة الجديدة: منع النوافذ المنبثقة نهائياً من المصدر
              // ============================================
              onOpenWindow={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                const { targetUrl } = nativeEvent;
                console.log('⛔️ Blocked Popup Attempt to:', targetUrl);
                // منع الفتح
                return false; 
              }}
              onNavigationStateChange={(navState) => {
                updateTab(currentTab.id, {
                  url: navState.url,
                  title: navState.title || 'موقع',
                  canGoBack: navState.canGoBack,
                  canGoForward: navState.canGoForward,
                  isLoading: navState.loading,
                });

                if (!navState.loading && navState.title && navState.url) {
                  addToHistory(navState.title, navState.url);
                  saveTabsState(
                    tabs.map((t) =>
                      t.id === currentTab.id
                        ? { ...t, title: navState.title, url: navState.url }
                        : t
                    ),
                    currentTab.id
                  );
                  applyDarkMode(
                    webViewRefs.current[currentTab.id],
                    isForcedDarkMode
                  );
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                const shouldBlock = AdBlockManager.shouldBlockRequest(request.url, currentTab.url);
                if (shouldBlock) {
                  setAdsBlocked(prev => prev + 1);
                  return false; 
                }
                return true;
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              javaScriptCanOpenWindowsAutomatically={false}
              setSupportMultipleWindows={false} 
              decelerationRate="normal"
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              injectedJavaScriptBeforeContentLoaded={AdBlockManager.getTitaniumInjection()}
              style={styles.webView}
            />
          </>
        )}
      </View>

      {/* باقي واجهة المستخدم كما هي */}
      {showWebsitesBar && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowWebsitesBar(false)}
          />
          <WebsitesBar
            websites={websites}
            currentURL={currentTab?.url || ''}
            adsBlocked={adsBlocked}
            onClose={() => setShowWebsitesBar(false)}
            onAdd={() => setShowAddWebsite(true)}
            onSelect={(url) => {
              if (webViewRefs.current[currentTabID]) {
                webViewRefs.current[currentTabID].injectJavaScript(
                  `window.location.href = '${url}'; true;`
                );
              }
              setShowWebsitesBar(false);
            }}
            onDelete={deleteWebsite}
          />
        </>
      )}

      {showHistory && (
        <HistoryView
          history={history}
          onClose={() => setShowHistory(false)}
          onSelect={(url) => {
            if (webViewRefs.current[currentTabID]) {
              webViewRefs.current[currentTabID].injectJavaScript(
                `window.location.href = '${url}'; true;`
              );
            }
            setShowHistory(false);
          }}
          onDelete={deleteHistoryItem}
          onClearAll={clearAllHistory}
        />
      )}

      {showTabsTray && (
        <>
          <TouchableOpacity
            style={styles.tabsOverlay}
            activeOpacity={1}
            onPress={() => setShowTabsTray(false)}
          />
          <TabsTray
            tabs={tabs}
            currentTabID={currentTabID}
            onClose={() => setShowTabsTray(false)}
            onSelectTab={(id) => {
              selectTab(id);
              setShowTabsTray(false);
            }}
            onCloseTab={closeTab}
            onAddTab={() => {
              addNewTab();
              setShowTabsTray(false);
            }}
            onFavorite={(tab) => {
              setTabToFavorite(tab);
              setShowAddWebsite(true);
            }}
          />
        </>
      )}

      <FloatingToolbar
        isHidden={isToolbarHidden}
        onToggle={() => setIsToolbarHidden(!isToolbarHidden)}
        onShowWebsites={() => {
          setShowWebsitesBar(true);
          setIsToolbarHidden(true);
        }}
        onShowHistory={() => {
          setShowHistory(true);
          setIsToolbarHidden(true);
        }}
        onToggleDarkMode={toggleDarkMode}
        onReload={() => webViewRefs.current[currentTabID]?.reload()}
        onAddTab={() => addNewTab()}
        onGoBack={() => webViewRefs.current[currentTabID]?.goBack()}
        onGoForward={() => webViewRefs.current[currentTabID]?.goForward()}
        canGoBack={currentTab?.canGoBack || false}
        canGoForward={currentTab?.canGoForward || false}
        isDarkMode={isForcedDarkMode}
        adsBlocked={adsBlocked}
        showWebsitesBar={showWebsitesBar}
      />

      {!showTabsTray && (
        <TouchableOpacity
          style={styles.topDragArea}
          activeOpacity={1}
          onPress={() => setShowTabsTray(true)}
          onMoveShouldSetResponder={() => true}
          onResponderMove={(e) => {
            if (e.nativeEvent.pageY > 10) {
              setShowTabsTray(true);
            }
          }}
        />
      )}

      {showAddWebsite && (
        <AddWebsiteModal
          visible={showAddWebsite}
          onClose={() => {
            setShowAddWebsite(false);
            setTabToFavorite(null);
          }}
          onAdd={addWebsite}
          initialName={tabToFavorite?.title || ''}
          initialUrl={tabToFavorite?.url || ''}
        />
      )}
    </View>
  );
};

// ===============================================
// MARK: - المكونات الفرعية والأنماط (لم تتغير)
// ===============================================

const TabsTray = ({
  tabs,
  currentTabID,
  onClose,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onFavorite,
}) => {
  return (
    <View style={styles.tabsTray}>
      <View style={styles.tabsTrayHandle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TabCard
              key={tab.id}
              tab={tab}
              isSelected={tab.id === currentTabID}
              onSelect={() => onSelectTab(tab.id)}
              onClose={() => onCloseTab(tab.id)}
              onFavorite={() => onFavorite(tab)}
            />
          ))}
          <TouchableOpacity style={styles.addTabButton} onPress={onAddTab}>
            <Text style={styles.addTabIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const TabCard = ({ tab, isSelected, onSelect, onClose, onFavorite }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.tabCard, isSelected && styles.tabCardSelected]}
      onPress={onSelect}
      onLongPress={() => setShowMenu(true)}>
      <Image
        source={{
          uri: `https://www.google.com/s2/favicons?domain=${tab.url}&sz=128`,
        }}
        style={styles.tabIcon}
      />
      <Text
        style={[styles.tabTitle, isSelected && styles.tabTitleSelected]}
        numberOfLines={2}>
        {tab.title}
      </Text>
      <TouchableOpacity style={styles.tabCloseButton} onPress={onClose}>
        <Text
          style={[
            styles.tabCloseIcon,
            isSelected && styles.tabCloseIconSelected,
          ]}>
          ×
        </Text>
      </TouchableOpacity>

      {showMenu && (
        <Modal
          transparent
          visible={showMenu}
          onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity
            style={styles.menuOverlay}
            onPress={() => setShowMenu(false)}>
            <View style={styles.contextMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onFavorite();
                  setShowMenu(false);
                }}>
                <Text style={styles.menuText}>⭐ إضافة للمفضلة</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </TouchableOpacity>
  );
};

const WebsitesBar = ({
  websites,
  currentURL,
  adsBlocked,
  onClose,
  onAdd,
  onSelect,
  onDelete,
}) => {
  return (
    <View style={styles.websitesBar}>
      <View style={styles.websitesHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAdd}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
        <View style={styles.websitesHeaderText}>
          <Text style={styles.websitesTitle}>مواقعي</Text>
          {adsBlocked > 0 && (
            <Text style={styles.adsBlockedText}>تم حظر {adsBlocked} إعلان</Text>
          )}
        </View>
      </View>
      <View style={styles.divider} />
      {websites.length === 0 ? (
        <View style={styles.emptyWebsites}>
          <Text style={styles.emptyIcon}>🌐</Text>
          <Text style={styles.emptyText}>لا توجد مواقع</Text>
        </View>
      ) : (
        <ScrollView>
          {websites.map((website) => (
            <WebsiteRow
              key={website.id}
              website={website}
              isActive={currentURL.includes(extractDomain(website.url))}
              onPress={() => onSelect(website.url)}
              onDelete={() => onDelete(website.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const WebsiteRow = ({ website, isActive, onPress, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.websiteRow, isActive && styles.websiteRowActive]}
      onPress={onPress}
      onLongPress={() => setShowMenu(true)}>
      <View style={styles.websiteIcon}>
        <Image
          source={{
            uri: `https://www.google.com/s2/favicons?domain=${website.url}&sz=128`,
          }}
          style={styles.favicon}
        />
      </View>
      <View style={styles.websiteInfo}>
        <Text style={styles.websiteName} numberOfLines={1}>
          {website.name}
        </Text>
        <Text style={styles.websiteDomain} numberOfLines={1}>
          {extractDomain(website.url)}
        </Text>
      </View>
      {isActive && <View style={styles.activeIndicator} />}

      {showMenu && (
        <Modal
          transparent
          visible={showMenu}
          onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity
            style={styles.menuOverlay}
            onPress={() => setShowMenu(false)}>
            <View style={styles.contextMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onDelete();
                  setShowMenu(false);
                }}>
                <Text style={[styles.menuText, { color: '#ff4444' }]}>
                  🗑️ حذف
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </TouchableOpacity>
  );
};

const HistoryView = ({ history, onClose, onSelect, onDelete, onClearAll }) => {
  const groupedHistory = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const groups = {
      اليوم: [],
      الأمس: [],
      'هذا الأسبوع': [],
      'هذا الشهر': [],
      أقدم: [],
    };

    history.forEach((item) => {
      const date = new Date(item.date);
      if (date >= today) groups['اليوم'].push(item);
      else if (date >= yesterday) groups['الأمس'].push(item);
      else if (date >= weekAgo) groups['هذا الأسبوع'].push(item);
      else if (date >= monthAgo) groups['هذا الشهر'].push(item);
      else groups['أقدم'].push(item);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [history]);

  return (
    <View style={styles.historyView}>
      <View style={styles.historyHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
        <Text style={styles.historyTitle}>سجل التاريخ</Text>
        <TouchableOpacity onPress={onClearAll}>
          <Text style={styles.deleteAllIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
      {history.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryIcon}>🕐</Text>
          <Text style={styles.emptyHistoryText}>السجل فارغ تماماً</Text>
        </View>
      ) : (
        <ScrollView>
          {groupedHistory.map(([section, items]) => (
            <View key={section}>
              <View style={styles.historySectionHeader}>
                <Text style={styles.historySectionTitle}>{section}</Text>
              </View>
              {items.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onPress={() => onSelect(item.url)}
                  onDelete={() => onDelete(item.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const HistoryItem = ({ item, onPress, onDelete }) => {
  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
      <Image
        source={{
          uri: `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`,
        }}
        style={styles.historyIcon}
      />
      <View style={styles.historyInfo}>
        <Text style={styles.historyItemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.historyItemUrl} numberOfLines={1}>
          {item.url}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.historyDeleteButton}>
        <Text style={styles.historyDeleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const FloatingToolbar = ({
  isHidden,
  onToggle,
  onShowWebsites,
  onShowHistory,
  onToggleDarkMode,
  onReload,
  onAddTab,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
  isDarkMode,
  adsBlocked,
  showWebsitesBar,
}) => {
  const slideAnim = useRef(new Animated.Value(80)).current;

  // إعداد مستجيب اللمس للسحب
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // تفعيل المستجيب فقط إذا كان السحب أفقياً ولليمين
        return gestureState.dx > 10 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        // إذا سحب المستخدم مسافة كافية نحو اليمين (أكثر من 50 بكسل)
        if (gestureState.dx > 50 && !isHidden) {
          onToggle(); // قم بإغلاق الشريط
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isHidden ? 80 : 0,
      useNativeDriver: true,
      friction: 8, // إضافة نعومة للحركة
      tension: 40,
    }).start();
  }, [isHidden, slideAnim]);

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers} // ربط مستجيب اللمس بالشريط
        style={[
          styles.floatingToolbar,
          { transform: [{ translateX: slideAnim }] },
        ]}>
        <TouchableOpacity style={styles.toolbarButton} onPress={onShowWebsites}>
          <Icon name="globe" size={24} color="#fff" />
          {adsBlocked > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolbarButton} onPress={onShowHistory}>
          <Icon name="clock" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.toolbarDivider} />
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onToggleDarkMode}>
          <Icon 
            name="moon" 
            size={24} 
            color={isDarkMode ? '#00008B' : '#fff'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolbarButton} onPress={onReload}>
          <Icon name="refresh-cw" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toolbarButton} onPress={onAddTab}>
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onGoBack}
          disabled={!canGoBack}>
          <Icon 
            name="chevron-left" 
            size={24} 
            color="#fff" 
            style={!canGoBack ? styles.disabledIcon : null}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={onGoForward}
          disabled={!canGoForward}>
          <Icon 
            name="chevron-right" 
            size={24} 
            color="#fff" 
            style={!canGoForward ? styles.disabledIcon : null}
          />
        </TouchableOpacity>
      </Animated.View>
      
      {isHidden && (
        <TouchableOpacity style={styles.toolbarShowArea} onPress={onToggle} />
      )}
    </>
  );
};

const AddWebsiteModal = ({
  visible,
  onClose,
  onAdd,
  initialName,
  initialUrl,
}) => {
  const [name, setName] = useState(initialName);
  const [url, setUrl] = useState(initialUrl);

  const handleAdd = () => {
    if (name && url) {
      onAdd(name, url);
      onClose();
      setName('');
      setUrl('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>إضافة موقع</Text>
          <TextInput
            style={styles.input}
            placeholder="الاسم"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="الرابط"
            placeholderTextColor="#888"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleAdd}
              disabled={!name || !url}>
              <Text style={styles.modalButtonTextPrimary}>إضافة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ===============================================
// MARK: - الوظائف المساعدة
// ===============================================
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
};

const { width, height } = Dimensions.get('window');

// ===============================================
// MARK: - الأنماط
// ===============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '30%',
    backgroundColor: '#007AFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.01)',
    zIndex: 5,
  },
  tabsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 29,
  },
  tabsTray: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 30,
    paddingTop: 10,
  },
  tabsTrayHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabCard: {
    width: 140,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 15,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCardSelected: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    transform: [{ scale: 1.05 }],
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
  },
  tabTitle: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tabTitleSelected: {
    color: '#4da6ff',
  },
  tabCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 5,
  },
  tabCloseIcon: {
    fontSize: 24,
    color: '#fff',
  },
  tabCloseIconSelected: {
    color: '#666',
  },
  addTabButton: {
    width: 140,
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTabIcon: {
    fontSize: 40,
    color: 'rgba(255,255,255,0.8)',
  },
  websitesBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#1a1a1a',
    zIndex: 6,
  },
  websitesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  closeIcon: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 10,
  },
  addIcon: {
    fontSize: 28,
    color: '#007AFF',
    marginRight: 10,
  },
  websitesHeaderText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  websitesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  adsBlockedText: {
    fontSize: 11,
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyWebsites: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  websiteRowActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  websiteIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor:
      'linear-gradient(135deg, rgba(33,150,243,0.8), rgba(156,39,176,0.6))',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  favicon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  websiteInfo: {
    flex: 1,
  },
  websiteName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  websiteDomain: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  historyView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F2027',
    zIndex: 100,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteAllIcon: {
    fontSize: 28,
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryIcon: {
    fontSize: 80,
  },
  emptyHistoryText: {
    fontSize: 18,
    color: '#888',
    marginTop: 20,
  },
  historySectionHeader: {
    backgroundColor: 'rgba(33,150,243,0.2)',
    padding: 12,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  historyItemUrl: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  historyDeleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  historyDeleteIcon: {
    fontSize: 18,
  },
  floatingToolbar: {
    position: 'absolute',
    right: 0,
    top: '40%',
    // 1. تغيير الخلفية إلى رمادي غامق جداً
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    // 2. إضافة إطار أبيض شفاف لتمييز الشريط عن المواقع السوداء
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRightWidth: 0, // إزالة الإطار من جهة الحافة
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, // زيادة الظل قليلاً
    shadowRadius: 5,
    elevation: 5,
    zIndex: 4,
  },
  toolbarButton: {
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  toolbarIcon: {
    fontSize: 24,
    color: '#fff', // 3. تحويل الأيقونات للون الأبيض
  },
  disabledIcon: {
    opacity: 0.3,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
  },
  toolbarDivider: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)', // 4. تحويل الخط الفاصل للون فاتح
    marginBottom: 20,
  },
  
  
  
  toolbarShowArea: {
    position: 'absolute',
    right: 0,
    top: '40%',
    width: 25,
    height: 200,
    zIndex: 10,
  },
  topDragArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
  },
  menuItem: {
    padding: 15,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default SmartBrowser;