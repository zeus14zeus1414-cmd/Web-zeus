
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Text,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Linking, // ✅ For direct downloads
  Clipboard as RNClipboard // Legacy
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather as Icon } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print'; // For PDF Feature
import * as Speech from 'expo-speech'; // For Speak Feature

// Import Logic
import AdBlockManager from '../core/AdBlockEngine';
import Storage from '../core/Storage';
import { generateUUID } from '../core/Helpers';
import ReaderModeEngine from '../core/ReaderModeEngine'; 
import ImageExtractionEngine from '../core/ImageExtractionEngine'; 
import DevToolsEngine from '../core/DevToolsEngine'; 
import FeatureScripts from '../core/FeatureScripts'; 
import PageMods from '../core/PageMods'; 
// Removed DownloadEngine

// Import Styles
import styles from '../styles/AppStyles';

// Import Components
import ImageGalleryView from '../components/ImageGalleryView'; 
import ConsoleView from '../components/ConsoleView';
import ScriptManagerView from '../components/ScriptManagerView';
import TabsTray from '../components/TabsTray';
import WebsitesBar from '../components/WebsitesBar';
import HistoryView from '../components/HistoryView';
import FloatingToolbar from '../components/FloatingToolbar';
import AddWebsiteModal from '../components/AddWebsiteModal';
import NativeReaderView from '../components/NativeReaderView';
import NetworkInspectorView from '../components/NetworkInspectorView';
import StorageManagerView from '../components/StorageManagerView';
import InspectorModal from '../components/InspectorModal';
import BlockedElementsView from '../components/BlockedElementsView'; 
// Removed DownloadsView

const SmartBrowser = () => {
  const [tabs, setTabs] = useState([]);
  const [currentTabID, setCurrentTabID] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [history, setHistory] = useState([]);
  const [adsBlocked, setAdsBlocked] = useState(0);
  
  // Feature Flags
  const [isForcedDarkMode, setIsForcedDarkMode] = useState(false);
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [isTranslatorActive, setIsTranslatorActive] = useState(false); // Toggle State
  const [isIncognito, setIsIncognito] = useState(false); // New Feature

  // UI Visibilities
  const [showWebsitesBar, setShowWebsitesBar] = useState(false);
  const [showTabsTray, setShowTabsTray] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isToolbarHidden, setIsToolbarHidden] = useState(true);
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [tabToFavorite, setTabToFavorite] = useState(null);

  // -- Tools States --
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showScriptManager, setShowScriptManager] = useState(false);
  const [userScripts, setUserScripts] = useState([]);
  
  // -- Block Manager --
  const [showBlockedManager, setShowBlockedManager] = useState(false);
  const [customBlockRules, setCustomBlockRules] = useState([]); 

  // -- Reader Mode & Gallery --
  const [readerVisible, setReaderVisible] = useState(false);
  const [readerData, setReaderData] = useState(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  // -- DevTools States --
  const [showNetworkInspector, setShowNetworkInspector] = useState(false);
  const [networkLogs, setNetworkLogs] = useState([]);
  const [showStorageManager, setShowStorageManager] = useState(false);
  const [storageData, setStorageData] = useState(null);
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [inspectedElement, setInspectedElement] = useState(null); 
  
  // -- New Features States --
  const [showFindBar, setShowFindBar] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResultCount, setFindResultCount] = useState(0);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [sourceCodeText, setSourceCodeText] = useState('');

  const webViewRefs = useRef({});

useEffect(() => {
  StatusBar.setHidden(true, 'fade');
}, []);

useEffect(() => {
  loadData();
}, []);


  const loadData = async () => {
    const savedWebsites = await Storage.getItem('saved_websites');
    if (savedWebsites) setWebsites(savedWebsites);

    const savedHistory = await Storage.getItem('browser_history_data');
    if (savedHistory) setHistory(savedHistory.sort((a, b) => new Date(b.date) - new Date(a.date)));

    const savedDarkMode = await Storage.getItem('browser_forced_dark_mode_key');
    if (savedDarkMode) setIsForcedDarkMode(savedDarkMode);

    // Persistent Desktop Mode
    const savedDesktopMode = await Storage.getItem('browser_desktop_mode');
    if (savedDesktopMode) setIsDesktopMode(savedDesktopMode);

    const savedScripts = await Storage.getItem('user_custom_scripts');
    if (savedScripts) setUserScripts(savedScripts);

    const savedRules = await Storage.getItem('user_custom_block_rules');
    if (savedRules) setCustomBlockRules(savedRules);

    const savedTabs = await Storage.getItem('browser_saved_tabs_list');
    const lastActiveTab = await Storage.getItem('browser_last_active_tab_id');

    if (savedTabs && savedTabs.length > 0) {
      setTabs(savedTabs);
      setCurrentTabID(lastActiveTab || savedTabs[0].id);
    } else {
      const initialTab = {
        id: generateUUID(),
        title: 'البداية',
        url: 'https://duckduckgo.com/',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
      };
      setTabs([initialTab]);
      setCurrentTabID(initialTab.id);
    }
  };

  const saveTabsState = async (newTabs, newCurrentID) => {
    // If Incognito, don't save state
    if (isIncognito) return;

    const tabsData = newTabs.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
    }));
    await Storage.setItem('browser_saved_tabs_list', tabsData);
    await Storage.setItem('browser_last_active_tab_id', newCurrentID);
  };

  const addNewTab = (url = 'https://duckduckgo.com/') => {
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
    setConsoleLogs([]); 
    setNetworkLogs([]); 
    setInspectedElement(null); 
    setIsInspectorActive(false); 
    // Reset translator state when changing tabs? Optional. Let's keep it per app session for now.
    setIsTranslatorActive(false);
  };

  const updateTab = (id, updates) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const addWebsite = async (name, url) => {
    const finalUrl = url.toLowerCase().startsWith('http') ? url : `https://${url}`;
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

  const saveUserScripts = async (scripts) => {
    setUserScripts(scripts);
    await Storage.setItem('user_custom_scripts', scripts);
    if (webViewRefs.current[currentTabID]) {
        webViewRefs.current[currentTabID].reload();
    }
  };

  // --- Blocking Logic ---
  const addBlockRule = async (selector) => {
      // 1. Save Persistent
      const newRules = [...customBlockRules, selector];
      setCustomBlockRules(newRules);
      await Storage.setItem('user_custom_block_rules', newRules);
      
      // 2. Instant Apply in Current Webview
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(`
              if(window.addCustomRule) {
                  window.addCustomRule('${selector}');
              }
              true;
          `);
      }

      setInspectedElement(null); // Close modal
      Alert.alert('✅ تم الحظر', 'تم إخفاء العنصر بنجاح وحفظ القاعدة.');
  };

  const removeBlockRule = async (ruleToDelete) => {
      const newRules = customBlockRules.filter(r => r !== ruleToDelete);
      setCustomBlockRules(newRules);
      await Storage.setItem('user_custom_block_rules', newRules);
      
      Alert.alert('تم التعديل', 'قم بتحديث الصفحة لظهور العنصر مرة أخرى.', [
          {text: 'تحديث الآن', onPress: () => webViewRefs.current[currentTabID]?.reload()},
          {text: 'لاحقاً'}
      ]);
  };

  // ===========================================
  // Message Handling
  // ===========================================
  const handleWebViewMessage = (event) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        
        switch(data.type) {
            case 'CONSOLE_LOG':
                setConsoleLogs(prev => [...prev, {
                    id: generateUUID(),
                    level: data.level,
                    message: data.payload,
                    timestamp: new Date().toLocaleTimeString()
                }].slice(-200)); 
                break;
            
            case 'NETWORK_LOG': 
                if (showNetworkInspector) {
                    setNetworkLogs(prev => [data.payload, ...prev].slice(0, 50));
                }
                break;

            case 'ELEMENT_INSPECTED': 
                setInspectedElement(data.payload);
                setIsInspectorActive(false); 
                break;

            case 'STORAGE_DATA': 
                setStorageData(data.payload);
                break;

            case 'READER_EXTRACTED':
                setReaderData(data.payload); 
                setReaderVisible(true);      
                break;
            
            case 'IMAGES_EXTRACTED':
                setGalleryImages(data.payload);
                setGalleryVisible(true);
                break;
            
            case 'FIND_RESULT':
                setFindResultCount(data.payload);
                break;
            
            case 'VIEW_SOURCE':
                setSourceCodeText(data.payload);
                setShowSourceCode(true);
                break;
            
            case 'ACTION_COMPLETE':
                Alert.alert('تم العملية', data.payload);
                break;
        }
    } catch (e) {}
  };


  const executeConsoleCommand = (command) => {
    if (webViewRefs.current[currentTabID]) {
        const jsCode = `
            try {
                const result = eval(${JSON.stringify(command)});
                console.log('👈 ' + result);
            } catch (e) {
                console.error(e.message);
            }
            true;
        `;
        webViewRefs.current[currentTabID].injectJavaScript(jsCode);
    }
  };

    const activateReaderMode = () => {
    if (webViewRefs.current[currentTabID]) {
        webViewRefs.current[currentTabID].injectJavaScript(
            ReaderModeEngine.getExtractionScript()
        );
    }
  };

  const activateImageGallery = () => {
    if (webViewRefs.current[currentTabID]) {
        webViewRefs.current[currentTabID].injectJavaScript(
            ImageExtractionEngine.getExtractionScript()
        );
    }
  };

  // --- DevTools Toggle Functions ---
  
  const toggleNetworkInspector = () => {
    setShowNetworkInspector(true);
    if (webViewRefs.current[currentTabID]) {
        webViewRefs.current[currentTabID].injectJavaScript(DevToolsEngine.getNetworkInterceptorScript());
        webViewRefs.current[currentTabID].injectJavaScript(DevToolsEngine.getToggleNetworkScript(true));
    }
  };

  const closeNetworkInspector = () => {
      setShowNetworkInspector(false);
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(DevToolsEngine.getToggleNetworkScript(false));
      }
  };

  const toggleDomInspector = () => {
      const newState = !isInspectorActive;
      setIsInspectorActive(newState);
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(DevToolsEngine.getDomInspectorScript(newState));
      }
      if (newState) {
          Alert.alert('وضع الفحص', 'اضغط على العنصر الذي تريد فحصه أو حظره.');
      }
  };

  const openStorageManager = () => {
      setShowStorageManager(true);
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(DevToolsEngine.getStorageReaderScript());
      }
  };

  const updateStorage = (type, key, value, action) => {
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(DevToolsEngine.getStorageUpdaterScript(type, key, value, action));
      }
  };

  const toggleDesktopMode = () => {
      const newState = !isDesktopMode;
      setIsDesktopMode(newState);
      Storage.setItem('browser_desktop_mode', newState); // Persistent Save
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].reload();
      }
      Alert.alert(
          newState ? '🖥️ وضع سطح المكتب' : '📱 وضع الهاتف',
          newState ? 'تم تفعيل وضع سطح المكتب. سيتم إعادة تحميل الصفحة.' : 'تم العودة لوضع الهاتف.'
      );
  };
  
  // --- New Features Logic ---
  const toggleTranslator = () => {
      if (isTranslatorActive) {
          // Turn Off -> Reload Page
          setIsTranslatorActive(false);
          if (webViewRefs.current[currentTabID]) {
              webViewRefs.current[currentTabID].reload();
          }
          Alert.alert('المترجم', 'تم إيقاف المترجم وإعادة تحميل الصفحة.');
      } else {
          // Turn On -> Inject Script
          setIsTranslatorActive(true);
          if (webViewRefs.current[currentTabID]) {
              webViewRefs.current[currentTabID].injectJavaScript(PageMods.getTranslateScript());
          }
      }
  };

  const toggleIncognito = () => {
      const newState = !isIncognito;
      setIsIncognito(newState);
      if (newState) {
          Alert.alert('وضع التخفي 🕵️', 'لن يتم حفظ سجل التاريخ أو الكوكيز.');
          // Clear History from session
          clearCurrentSiteData();
      } else {
          Alert.alert('الوضع العادي', 'تم العودة للوضع الطبيعي.');
      }
  };

  const printToPdf = async () => {
      // Simple implementation: print current view
      try {
        await Print.printAsync();
      } catch(e) {
        Alert.alert('Error', 'Could not print PDF');
      }
  };

  const speakPage = () => {
      const script = `
        (function() {
            const text = document.body.innerText;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPEAK_TEXT', payload: text.substring(0, 1000) }));
        })();
        true;
      `;
      if (webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(script);
      }
  };
  
  // Custom Handler for Speak
  const customMessage = (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'SPEAK_TEXT') {
            Speech.speak(data.payload, { language: 'ar' });
        } else {
            handleWebViewMessage(event);
        }
      } catch(e) { handleWebViewMessage(event); }
  };


  const executeFindInPage = (query) => {
      if (webViewRefs.current && webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(FeatureScripts.getFindInPageScript(query));
      }
  };
  
  const activateEnableCopy = () => {
      if (webViewRefs.current && webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(PageMods.getEnableCopyScript());
      }
  };

  const activateViewSource = () => {
      if (webViewRefs.current && webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(FeatureScripts.getViewSourceScript());
      }
  };

  const clearCurrentSiteData = () => {
      if (webViewRefs.current && webViewRefs.current[currentTabID]) {
          webViewRefs.current[currentTabID].injectJavaScript(FeatureScripts.getClearDataScript());
      }
  };

  const copySourceCode = async () => {
      await Clipboard.setStringAsync(sourceCodeText);
      Alert.alert('تم النسخ', 'تم نسخ كود المصدر إلى الحافظة.');
  };

  const addToHistory = async (title, url) => {
    if (isIncognito) return; // Feature: No History in Incognito
    if (!title || !url || url === 'about:blank') return;
    const first = history[0];
    if (first && first.url === url && Date.now() - new Date(first.date) < 60000)
      return;

    const newItem = { id: generateUUID(), title, url, date: new Date().toISOString() };
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

  const combinedInjection = useMemo(() => {
     return `
        ${AdBlockManager.getTitaniumInjection(userScripts, customBlockRules)}
        ${DevToolsEngine.getNetworkInterceptorScript()}
        ${DevToolsEngine.getConsoleInterceptorScript()}
     `;
  }, [userScripts, customBlockRules]);

  // Desktop UserAgent
  const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const mobileUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

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
              userAgent={isDesktopMode ? desktopUA : mobileUA}
              key={currentTab.id}
              ref={(ref) => (webViewRefs.current[currentTab.id] = ref)}
              source={{ uri: currentTab.url }}
              
              // ⚡️ Fix for Scroll Lag / Stuttering
              decelerationRate="normal"
              overScrollMode="content" 
              androidLayerType="hardware"
              
              // --- Direct Device Download Logic (No FS) ---
              onFileDownload={({ nativeEvent }) => {
                 if (nativeEvent.downloadUrl) {
                     Linking.openURL(nativeEvent.downloadUrl);
                 }
              }}
              // Some versions use this for capturing downloads
              onDownloadStart={(event) => {
                  if (event.nativeEvent.url) {
                      Linking.openURL(event.nativeEvent.url);
                  }
              }}
              
              incognito={isIncognito}
              
              onLoad={() => {
                StatusBar.setHidden(true, 'fade');
                updateTab(currentTab.id, { isLoading: false });
                if (isTranslatorActive) activateTranslation(); // Re-inject on reload if active
              }}
              onLoadStart={() => {
                StatusBar.setHidden(true, 'fade');
                updateTab(currentTab.id, { isLoading: true });
              }}
              onLoadEnd={() => {
                StatusBar.setHidden(true, 'fade');
                updateTab(currentTab.id, { isLoading: false });
              }}
              onMessage={customMessage} 
              onOpenWindow={() => false}
              onNavigationStateChange={(navState) => {
                StatusBar.setHidden(true, 'fade');
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
                      t.id === currentTab.id ? { ...t, title: navState.title, url: navState.url } : t
                    ),
                    currentTab.id
                  );
                  applyDarkMode(webViewRefs.current[currentTab.id], isForcedDarkMode);
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                StatusBar.setHidden(true, 'fade');
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
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              injectedJavaScriptBeforeContentLoaded={combinedInjection}
              style={styles.webView}
            />
          </>
        )}
      </View>

      {/* --- Find In Page Bar --- */}
      {showFindBar && (
          <View style={localStyles.findBar}>
              <TextInput 
                  style={localStyles.findInput}
                  placeholder="بحث في الصفحة..."
                  placeholderTextColor="#888"
                  value={findQuery}
                  onChangeText={setFindQuery}
                  onSubmitEditing={() => executeFindInPage(findQuery)}
              />
              <Text style={{color: '#fff', marginHorizontal: 10}}>{findResultCount > 0 ? `${findResultCount} نتائج` : ''}</Text>
              <TouchableOpacity onPress={() => executeFindInPage(findQuery)} style={{marginRight: 10}}>
                  <Icon name="search" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowFindBar(false); setFindResultCount(0); executeFindInPage(''); }}>
                  <Icon name="x" size={20} color="#fff" />
              </TouchableOpacity>
          </View>
      )}

      {/* --- Source Code Modal --- */}
      <Modal visible={showSourceCode} animationType="slide" onRequestClose={() => setShowSourceCode(false)}>
          <View style={{flex: 1, backgroundColor: '#1e1e1e'}}>
              <View style={localStyles.sourceHeader}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>HTML Source (Preview)</Text>
                  <View style={{flexDirection: 'row'}}>
                      <TouchableOpacity onPress={copySourceCode} style={{marginRight: 15}}>
                          <Icon name="copy" size={24} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setShowSourceCode(false)}>
                          <Icon name="x" size={24} color="#fff" />
                      </TouchableOpacity>
                  </View>
              </View>
              <ScrollView style={{padding: 10}}>
                  <Text style={{color: '#a6e22e', fontFamily: 'monospace'}} selectable>{sourceCodeText}</Text>
              </ScrollView>
          </View>
      </Modal>

      {/* --- Overlays --- */}

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
                webViewRefs.current[currentTabID].injectJavaScript(`window.location.href = '${url}'; true;`);
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
              webViewRefs.current[currentTabID].injectJavaScript(`window.location.href = '${url}'; true;`);
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

      {/* --- DevTools Modals --- */}

      {showConsole && (
          <ConsoleView 
              logs={consoleLogs} 
              onClose={() => setShowConsole(false)}
              onExecute={executeConsoleCommand}
              onClear={() => setConsoleLogs([])}
          />
      )}

      {showNetworkInspector && (
          <NetworkInspectorView
              logs={networkLogs}
              onClose={closeNetworkInspector}
              onClear={() => setNetworkLogs([])}
          />
      )}

      {showStorageManager && (
          <StorageManagerView
              data={storageData}
              onClose={() => setShowStorageManager(false)}
              onUpdate={updateStorage}
          />
      )}

      <InspectorModal
          visible={!!inspectedElement}
          data={inspectedElement}
          onClose={() => setInspectedElement(null)}
          onBlock={addBlockRule}
      />
      
      {showBlockedManager && (
          <BlockedElementsView 
              rules={customBlockRules}
              onClose={() => setShowBlockedManager(false)}
              onDelete={removeBlockRule}
          />
      )}

      {showScriptManager && (
          <ScriptManagerView
              scripts={userScripts}
              onClose={() => setShowScriptManager(false)}
              onSave={(newScripts) => {
                  saveUserScripts(newScripts);
              }}
          />
      )}

      {/* --- Toolbar --- */}

      <FloatingToolbar
        isHidden={isToolbarHidden}
        onToggle={() => setIsToolbarHidden(!isToolbarHidden)}
        // Nav
        onGoBack={() => webViewRefs.current[currentTabID]?.goBack()}
        onGoForward={() => webViewRefs.current[currentTabID]?.goForward()}
        onReload={() => webViewRefs.current[currentTabID]?.reload()}
        canGoBack={currentTab?.canGoBack || false}
        canGoForward={currentTab?.canGoForward || false}
        // Tabs
        onAddTab={() => addNewTab()}
        onShowTabsTray={() => setShowTabsTray(true)}
        // Main Menu
        onShowWebsites={() => { setShowWebsitesBar(true); setIsToolbarHidden(true); }}
        onShowHistory={() => { setShowHistory(true); setIsToolbarHidden(true); }}
        onReaderMode={activateReaderMode}
        onShowGallery={activateImageGallery}
        onToggleDarkMode={toggleDarkMode}
        isDarkMode={isForcedDarkMode}
        isDesktopMode={isDesktopMode}
        onToggleDesktopMode={toggleDesktopMode}
        adsBlocked={adsBlocked}
        // New Features
        onTranslate={toggleTranslator}
        isTranslatorActive={isTranslatorActive}
        onFindInPage={() => { setShowFindBar(true); setIsToolbarHidden(true); }}
        onEnableCopy={activateEnableCopy}
        onViewSource={activateViewSource}
        onClearData={clearCurrentSiteData}
        // onShowDownloads removed
        onPrintPdf={printToPdf}
        onToggleIncognito={toggleIncognito}
        isIncognito={isIncognito}
        onSpeak={speakPage}
        // Dev Tools
        onShowConsole={() => { setShowConsole(true); setIsToolbarHidden(true); }}
        onShowScripts={() => { setShowScriptManager(true); setIsToolbarHidden(true); }}
        onShowNetwork={() => { toggleNetworkInspector(); setIsToolbarHidden(true); }}
        onShowStorage={() => { openStorageManager(); setIsToolbarHidden(true); }}
        onToggleInspector={() => { toggleDomInspector(); setIsToolbarHidden(true); }}
        isInspectorActive={isInspectorActive}
        onShowBlockedManager={() => { setShowBlockedManager(true); setIsToolbarHidden(true); }}
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

      <ImageGalleryView 
        visible={galleryVisible}
        images={galleryImages}
        onClose={() => setGalleryVisible(false)}
      />

      <NativeReaderView 
        visible={readerVisible}
        data={readerData}
        onClose={() => setReaderVisible(false)}
      />

    </View>
  );
};

const localStyles = StyleSheet.create({
    findBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        backgroundColor: '#222',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        zIndex: 100,
        borderBottomWidth: 1,
        borderColor: '#444'
    },
    findInput: {
        flex: 1,
        backgroundColor: '#333',
        color: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10
    },
    sourceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderColor: '#333'
    }
});

export default SmartBrowser;
