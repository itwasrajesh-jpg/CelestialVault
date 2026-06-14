const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ── Write AppLockAccessibilityService.kt ─────────────────────────────────────
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
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppLockAccessibilityService : AccessibilityService() {

  override fun onServiceConnected() {
    val info = AccessibilityServiceInfo().apply {
      eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
      notificationTimeout = 100
    }
    serviceInfo = info
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
      val pkg = event.packageName?.toString() ?: return
      // Emit to React Native via DeviceEventEmitter
      sendEventToRN("AppForeground", pkg)
    }
  }

  override fun onInterrupt() {}

  private fun sendEventToRN(eventName: String, data: String) {
    try {
      val ctx = applicationContext
      // Send broadcast — RN module listens for this
      val intent = android.content.Intent("com.celestial.vault.APP_FOREGROUND")
      intent.putExtra("package", data)
      sendBroadcast(intent)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }
}
`;
      fs.writeFileSync(path.join(dir, 'AppLockAccessibilityService.kt'), kt);

      // Write accessibility service config XML
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
  android:description="@string/accessibility_service_description"
  android:notificationTimeout="100"
  android:settingsActivity="com.celestial.vault.MainActivity" />
`;
      fs.writeFileSync(path.join(xmlDir, 'accessibility_service_config.xml'), xml);

      return config;
    },
  ]);
}

// ── Inject service into AndroidManifest ──────────────────────────────────────
function withAccessibilityServiceManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    if (!app.service) app.service = [];

    const serviceExists = app.service.some(
      (s) => s.$?.['android:name'] === '.AppLockAccessibilityService'
    );

    if (!serviceExists) {
      app.service.push({
        $: {
          'android:name': '.AppLockAccessibilityService',
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:label': '@string/app_name',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
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
