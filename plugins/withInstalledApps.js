const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

// ── Write InstalledAppsModule.kt ─────────────────────────────────────────────
function withInstalledAppsKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/celestial/vault'
      );
      fs.mkdirSync(dir, { recursive: true });

      const kt = `package com.celestial.vault

import android.content.Intent
import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class InstalledAppsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "InstalledApps"

  @ReactMethod
  fun getApps(promise: Promise) {
    try {
      val pm = reactApplicationContext.packageManager
      val intent = Intent(Intent.ACTION_MAIN, null)
      intent.addCategory(Intent.CATEGORY_LAUNCHER)
      val activities = pm.queryIntentActivities(intent, 0)
      val result = Arguments.createArray()
      val self = reactApplicationContext.packageName
      for (ri in activities) {
        val pkg = ri.activityInfo.packageName
        if (pkg == self) continue
        val map = Arguments.createMap()
        map.putString("packageName", pkg)
        map.putString("appName", ri.loadLabel(pm).toString())
        result.pushMap(map)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("ERR_APPS", e.message ?: "Failed to get apps")
    }
  }
}
`;
      fs.writeFileSync(path.join(dir, 'InstalledAppsModule.kt'), kt);

      // Write the React Package
      const packageKt = `package com.celestial.vault

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class InstalledAppsPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
    listOf(InstalledAppsModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
`;
      fs.writeFileSync(path.join(dir, 'InstalledAppsPackage.kt'), packageKt);

      // Register the package in MainApplication
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/celestial/vault/MainApplication.kt'
      );

      if (fs.existsSync(mainAppPath)) {
        let content = fs.readFileSync(mainAppPath, 'utf8');
        if (!content.includes('InstalledAppsPackage')) {
          content = content.replace(
            'PackageList(this).packages',
            'PackageList(this).packages.also { it.add(InstalledAppsPackage()) }'
          );
          fs.writeFileSync(mainAppPath, content);
        }
      }

      return config;
    },
  ]);
}

module.exports = (config) => {
  return withInstalledAppsKotlin(config);
};
