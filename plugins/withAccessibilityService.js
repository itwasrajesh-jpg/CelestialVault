const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

function withAccessibilityServiceKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/celestial/vault'
      );
      fs.mkdirSync(dir, { recursive: true });

      const kt = `package com.celestial.vault

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class AppLockAccessibilityService : AccessibilityService() {

  override fun onServiceConnected() {
    val info = AccessibilityServiceInfo()
    info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
    info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
    info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
    info.notificationTimeout = 100
    serviceInfo = info
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      val pkg = event.packageName?.toString() ?: return
      try {
        val intent = Intent("com.celestial.vault.APP_FOREGROUND")
        intent.putExtra("package", pkg)
        sendBroadcast(intent)
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }

  override fun onInterrupt() {}
}
`;
      fs.writeFileSync(path.join(dir, 'AppLockAccessibilityService.kt'), kt);

      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
  android:accessibilityEventTypes="typeWindowStateChanged"
  android:accessibilityFeedbackType="feedbackGeneric"
  android:accessibilityFlags="flagIncludeNotImportantViews"
  android:canRetrieveWindowContent="false"
  android:notificationTimeout="100"
  android:settingsActivity="com.celestial.vault.MainActivity" />
`;
      fs.writeFileSync(path.join(xmlDir, 'accessibility_service_config.xml'), xml);

      return config;
    },
  ]);
}

function withAccessibilityServiceManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    // ── Add queries block for installed apps (Android 11+ proper way) ──────────
    // This replaces QUERY_ALL_PACKAGES permission which blocks Xiaomi install
    if (!manifest.manifest.queries) {
      manifest.manifest.queries = [{
        intent: [{
          action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
          category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
        }],
      }];
    }

    // ── Add accessibility service ───────────────────────────────────────────────
    if (!app.service) app.service = [];

    const already = app.service.some(
      s => s.$?.['android:name'] === '.AppLockAccessibilityService'
    );

    if (!already) {
      app.service.push({
        $: {
          'android:name':       '.AppLockAccessibilityService',
          'android:exported':   'true',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:label':      '@string/app_name',
        },
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
        }],
        'meta-data': [{
          $: {
            'android:name':     'android.accessibilityservice',
            'android:resource': '@xml/accessibility_service_config',
          },
        }],
      });
    }

    return config;
  });
}

module.exports = (config) => {
  config = withAccessibilityServiceKotlin(config);
  config = withAccessibilityServiceManifest(config);
  return config;
};
