import React, { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  AppState, DeviceEventEmitter, StatusBar, Animated, NativeModules,
} from 'react-native';
import { resolveTheme } from './src/utils/themes';
import { loadState, saveState, loadPin, loadGestureEncoded } from './src/utils/storage';

import AppsScreen       from './src/screens/AppsScreen';
import VaultScreen      from './src/screens/VaultScreen';
import SpacesScreen     from './src/screens/SpacesScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

import PinScreen from './src/components/PinScreen';
import { useAppLockAuth } from './src/hooks/useBiometricAuth';
import { verifyPin } from './src/utils/security';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
const INIT = {
  onboardingDone:       false,
  theme:                'amoled',
  accentKey:            'purple',
  animLevel:            'full',
  biometric:            true,
  pinHash:              null,
  gestureEncoded:       null,
  recoveryPhrase:       null,
  installedApps:        [],
  archivedApps:         [],
  schedules:            [],
  accessibilityEnabled: false,
};

// ─── REDUCER ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':              return { ...INIT, ...action.state };
    case 'SET_THEME':         return { ...state, theme: action.v };
    case 'SET_ACCENT':        return { ...state, accentKey: action.v };
    case 'SET_ANIM':          return { ...state, animLevel: action.v };
    case 'SET_BIO':           return { ...state, biometric: action.v };
    case 'SET_PIN':           return { ...state, pinHash: action.hash };
    case 'SET_GESTURE':       return { ...state, gestureEncoded: action.encoded };
    case 'SET_RECOVERY':      return { ...state, recoveryPhrase: action.phrase };
    case 'FINISH_ONBOARDING': return { ...state, onboardingDone: true };
    case 'SET_ACCESSIBILITY': return { ...state, accessibilityEnabled: action.v };
    case 'SET_APPS':          return { ...state, installedApps: action.apps };
    case 'TOGGLE_LOCK': return {
      ...state,
      installedApps: state.installedApps.map(a =>
        a.packageName === action.packageName ? { ...a, locked: !a.locked } : a
      ),
    };
    case 'TOGGLE_PAUSE': return {
      ...state,
      installedApps: state.installedApps.map(a =>
        a.packageName === action.packageName ? { ...a, paused: !a.paused } : a
      ),
    };
    case 'MOVE_TO_VAULT': return {
      ...state,
      installedApps: state.installedApps.map(a =>
        a.packageName === action.packageName ? { ...a, inVault: true, locked: false } : a
      ),
    };
    case 'REMOVE_FROM_VAULT': return {
      ...state,
      installedApps: state.installedApps.map(a =>
        a.packageName === action.packageName ? { ...a, inVault: false } : a
      ),
    };
    case 'ADD_SCHEDULE':    return { ...state, schedules: [...state.schedules, action.schedule] };
    case 'DELETE_SCHEDULE': return { ...state, schedules: state.schedules.filter(s => s.id !== action.id) };
    case 'TOGGLE_SCHEDULE': return {
      ...state,
      schedules: state.schedules.map(s => s.id === action.id ? { ...s, active: !s.active } : s),
    };
    default: return state;
  }
}

const TABS = [
  { key: 'apps',     label: 'Apps',     icon: '🏠' },
  { key: 'vault',    label: 'Vault',    icon: '🛡' },
  { key: 'spaces',   label: 'Spaces',   icon: '📦' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

// ─── TOAST ────────────────────────────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg]         = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);
  const anim  = useRef(new Animated.Value(0)).current;

  const show = useCallback((text) => {
    setMsg(text);
    setVisible(true);
    clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(() => setVisible(false));
    }, 2200);
  }, [anim]);

  const Toast = visible ? (
    <Animated.View style={[styles.toast, {
      opacity: anim,
      transform: [{
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
      }],
    }]}>
      <Text style={styles.toastTxt}>{msg}</Text>
    </Animated.View>
  ) : null;

  return { show, Toast };
}

// ─── APP LOCK OVERLAY ─────────────────────────────────────────────────────────
function AppLockOverlay({ T, app, pinHash, onUnlock, onCancel }) {
  const [mode, setMode] = useState('bio');
  const { authenticate } = useAppLockAuth();

  async function tryBio() {
    const result = await authenticate(app ? app.appName : 'app');
    if (result === true) onUnlock();
    else if (result === 'needs_pin') setMode('pin');
  }

  if (mode === 'pin') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.lockOverlay, { backgroundColor: T.bg }]}>
        <PinScreen
          T={T}
          title={'Unlock ' + (app ? app.appName : 'app')}
          subtitle="Enter your PIN"
          onSuccess={async pin => {
            const ok = await verifyPin(pin, pinHash);
            if (ok) onUnlock();
            return ok;
          }}
          onCancel={onCancel}
        />
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.lockOverlay, { backgroundColor: T.bg }]}>
      <View style={styles.lockWrap}>
        <Text style={{ fontSize: 40 }}>{app ? app.icon || '📱' : '🔒'}</Text>
        <View style={[styles.bioRing, { borderColor: T.accent }]}>
          <Text style={{ fontSize: 44 }}>👆</Text>
        </View>
        <Text style={[styles.lockTitle, { color: T.text }]}>
          {(app ? app.appName : 'App') + ' is locked'}
        </Text>
        <Text style={[styles.lockSub, { color: T.sub }]}>
          Scan fingerprint to continue
        </Text>
        <TouchableOpacity
          style={[styles.accentBtn, { backgroundColor: T.accent }]}
          onPress={tryBio}
        >
          <Text style={styles.accentBtnTxt}>Authenticate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ghostBtn, { borderColor: T.accent }]}
          onPress={() => setMode('pin')}
        >
          <Text style={[styles.ghostBtnTxt, { color: T.accent }]}>Use PIN instead</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.cancelTxt, { color: T.sub }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [tab, setTab]     = useState('apps');
  const [lockedApp, setLockedApp] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  const { show: showToast, Toast } = useToast();

  const T         = resolveTheme(state.theme, state.accentKey);
  const animLevel = state.animLevel || 'full';

  // ── Load persisted state + real installed apps ─────────────────────────────
  useEffect(() => {
    (async () => {
      // 1. Load saved state first
      const saved = await loadState();
      if (saved) dispatch({ type: 'LOAD', state: saved });

      // 2. Load secure items
      const pinHash = await loadPin();
      if (pinHash) dispatch({ type: 'SET_PIN', hash: pinHash });

      const gesture = await loadGestureEncoded();
      if (gesture) dispatch({ type: 'SET_GESTURE', encoded: gesture });

      // 3. Load REAL installed apps via native module
      try {
        const { InstalledApps } = NativeModules;
        if (InstalledApps && InstalledApps.getApps) {
          const rawApps = await InstalledApps.getApps();
          // Merge with saved lock/pause/vault state
          const savedApps = (saved && saved.installedApps) ? saved.installedApps : [];
          const merged = rawApps.map(a => {
            const prev = savedApps.find(s => s.packageName === a.packageName);
            return {
              packageName: a.packageName,
              appName:     a.appName,
              icon:        '📱',
              locked:      prev ? prev.locked  : false,
              paused:      prev ? prev.paused  : false,
              inVault:     prev ? prev.inVault : false,
            };
          });
          dispatch({ type: 'SET_APPS', apps: merged });
        }
      } catch (e) {
        console.log('[APP] InstalledApps native module error:', e.message);
      }
    })();
  }, []);

  // ── Persist state ──────────────────────────────────────────────────────────
  useEffect(() => {
    const { pinHash, gestureEncoded, recoveryPhrase, ...toSave } = state;
    saveState(toSave);
  }, [state]);

  // ── Lock on background ────────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appStateRef.current === 'active' && next.match(/inactive|background/)) {
        setLockedApp(null);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // ── Accessibility service events ──────────────────────────────────────────
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AppForeground', pkg => {
      const app = (state.installedApps || []).find(a => a.packageName === pkg);
      if (app && app.locked && !app.inVault) setLockedApp(app);
    });
    return () => sub.remove();
  }, [state.installedApps]);

  if (!state.onboardingDone) {
    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <StatusBar barStyle={T.white ? 'dark-content' : 'light-content'} backgroundColor={T.bg} />
        <OnboardingScreen T={T} dispatch={dispatch} />
      </View>
    );
  }

  function renderTab() {
    switch (tab) {
      case 'apps':
        return <AppsScreen T={T} animLevel={animLevel} state={state} dispatch={dispatch} pinHash={state.pinHash} />;
      case 'vault':
        return <VaultScreen T={T} animLevel={animLevel} state={state} dispatch={dispatch} pinHash={state.pinHash} />;
      case 'spaces':
        return <SpacesScreen T={T} animLevel={animLevel} state={state} dispatch={dispatch} />;
      case 'settings':
        return <SettingsScreen T={T} animLevel={animLevel} state={state} dispatch={dispatch} />;
      default:
        return null;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <StatusBar
        barStyle={T.white ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.content}>
        {renderTab()}
      </View>
      <View style={[styles.nav, { backgroundColor: T.nav, borderTopColor: T.border }]}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.navItem, tab === t.key && { backgroundColor: T.accent + '18' }]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.navIcon}>{t.icon}</Text>
            <Text style={[styles.navLabel, { color: tab === t.key ? T.accent : T.sub }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {lockedApp && (
        <AppLockOverlay
          T={T}
          app={lockedApp}
          pinHash={state.pinHash}
          onUnlock={() => setLockedApp(null)}
          onCancel={() => setLockedApp(null)}
        />
      )}
      {Toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { flex: 1 },
  nav: {
    flexDirection: 'row', height: 72, borderTopWidth: 1,
    paddingBottom: 8, paddingTop: 4, paddingHorizontal: 8,
  },
  navItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 3, borderRadius: 16, paddingVertical: 6,
  },
  navIcon:  { fontSize: 22 },
  navLabel: { fontSize: 10, fontWeight: '500' },
  toast: {
    position: 'absolute', bottom: 84, alignSelf: 'center',
    backgroundColor: 'rgba(20,20,24,0.96)',
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  toastTxt:     { color: '#fff', fontSize: 13, fontWeight: '500' },
  lockOverlay:  { zIndex: 999 },
  lockWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
  },
  bioRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  lockTitle:    { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  lockSub:      { fontSize: 14, textAlign: 'center' },
  accentBtn:    { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', maxWidth: 240, width: '80%' },
  accentBtnTxt: { fontSize: 15, fontWeight: '700', color: '#000' },
  ghostBtn:     { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1.5, alignItems: 'center', maxWidth: 240, width: '80%' },
  ghostBtnTxt:  { fontSize: 14, fontWeight: '600' },
  cancelTxt:    { fontSize: 13 },
});
