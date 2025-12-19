import { StyleSheet, Dimensions } from 'react-native';

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
  // --- أنماط الكونسول ومدير السكربتات (جديد) ---
  consoleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    zIndex: 50,
    borderTopWidth: 1,
    borderColor: '#333'
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  consoleTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'monospace'
  },
  consoleBtn: {
    padding: 5
  },
  consoleList: {
    flex: 1,
    backgroundColor: '#000'
  },
  consoleRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222'
  },
  consoleRow_error: { backgroundColor: 'rgba(255,0,0,0.1)' },
  consoleRow_warn: { backgroundColor: 'rgba(255,255,0,0.05)' },
  consoleTime: {
    color: '#666',
    fontSize: 10,
    width: 60,
    marginRight: 5,
    fontFamily: 'monospace'
  },
  consoleText: {
    flex: 1,
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  consoleText_log: { color: '#fff' },
  consoleText_error: { color: '#ff6b6b' },
  consoleText_warn: { color: '#feca57' },
  consoleText_info: { color: '#54a0ff' },
  consoleInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 8,
    backgroundColor: '#1a1a1a'
  },
  consolePrompt: {
    color: '#007AFF',
    fontSize: 16,
    marginRight: 5,
    fontWeight: 'bold'
  },
  consoleInput: {
    flex: 1,
    color: '#fff',
    fontFamily: 'monospace',
    height: 40
  },
  consoleSendBtn: {
    padding: 8
  },
  // --- أنماط مدير السكربتات (صفحة كاملة) ---
  scriptManagerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    zIndex: 60
  },
  scriptEditorContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    zIndex: 60
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a'
  },
  scriptTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  scriptHeaderBtn: {
    padding: 5
  },
  scriptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  scriptName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  scriptDomain: {
    color: '#888',
    fontSize: 12,
    marginTop: 3
  },
  scriptForm: {
    padding: 20
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 15
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginBottom: 8
  },
  scriptInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  codeArea: {
    height: 300,
    fontFamily: 'monospace',
    fontSize: 14,
    textAlignVertical: 'top'
  },
  emptyScripts: {
    alignItems: 'center',
    marginTop: 50
  }
});

export default styles;
