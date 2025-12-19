import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as Updates from 'expo-updates'; // استيراد مكتبة التحديثات
import SmartBrowser from './src/screens/SmartBrowser';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // وظيفة لتحميل الخطوط وفحص التحديثات بأمان
    async function prepareApp() {
      try {
        // 1. تحميل الخطوط
        await Font.loadAsync({
          'Cairo-Regular': require('./assets/fonts/Cairo-Regular.ttf'),
          'Cairo-Bold': require('./assets/fonts/Cairo-Bold.ttf'),
        });

        // 2. محاولة فحص التحديثات في الخلفية (وتجاهل الخطأ إذا فشلت)
        if (!__DEV__) { // فقط في نسخة الإنتاج
          try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              await Updates.fetchUpdateAsync();
              // التحديث سيعمل عند إعادة تشغيل التطبيق القادمة
            }
          } catch (updateError) {
            // هنا يتم "صيد" الخطأ الذي ظهر لك في الصورة ومنعه من إيقاف التطبيق
            console.log("Update check failed, skipping silently:", updateError.message);
          }
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }

    prepareApp();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <SmartBrowser />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loader: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
