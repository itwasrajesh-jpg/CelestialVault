import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { tileStyle, neuSurface } from '../utils/themes';
import SlideScreen from '../components/SlideScreen';
import PinScreen from '../components/PinScreen';
import GestureCanvas from '../components/GestureCanvas';
import { useVaultAuth } from '../hooks/useBiometricAuth';
import { verifyPin, getPresetEncoded } from '../utils/security';
import { saveGestureEncoded } from '../utils/storage';

const { width: SW } = Dimensions.get('window');
const PRESET_LETTERS = ['Z', 'L', 'V', 'N', 'C', 'S'];

export default function VaultScreen({ T, animLevel, state, dispatch, pinHash }) {
  const [unlocked, setUnlocked] = useState(false);
  const [sheet, setSheet] = useState(null); // null | 'gesture_setup' | 'recovery'
  const [pendingGesture, setPendingGesture] = useState(null);
  const { state: authState, startAuth } = useVaultAuth();

  const vaultApps = (state.installedApps || []).filter(a => a.inVault);

  async function unlock() {
    const result = await startAuth();
    if (result === true) setUnlocked(true);
  }

  function removeFromVault(packageName) {
    dispatch({ type: 'REMOVE_FROM_VAULT', packageName });
  }

  async function saveGesture(encoded) {
    await saveGestureEncoded(encoded);
    dispatch({ type: 'SET_GESTURE', encoded });
    setSheet(null);
  }

  async function savePresetGesture(letter) {
    const encoded = getPresetEncoded(letter);
    if (encoded) await saveGesture(encoded);
  }

  if (!unlocked) {
    return (
      <View style={[styles.screen, { backgroundColor: T.bg }]}>
        <View style={styles.lockedWrap}>
          <Text style={{ fontSize: 72 }}>🔐</Text>
          <Text style={[styles.lockedTitle, { color: T.text }]}>Secure Vault</Text>
          <Text style={[styles.lockedSub, { color: T.sub }]}>
            Double biometric authentication required
          </Text>
          <View style={[neuSurface(T), styles.authInfo]}>
            <View style={styles.authStep}>
              <View style={[styles.dot, { backgroundColor: T.accent }]} />
              <Text style={[styles.authTxt, { color: T.text }]}>First scan — identity verification</Text>
            </View>
            <View style={styles.authStep}>
              <View style={[styles.dot, { backgroundColor: T.border }]} />
              <Text style={[styles.authTxt, { color: T.sub }]}>Second scan — vault confirmation</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.accentBtn, { backgroundColor: T.accent }]}
            onPress={unlock}
          >
            <Text style={styles.accentBtnTxt}>Authenticate</Text>
          </TouchableOpacity>
          {authState === 'failed' ? (
            <Text style={[styles.errorTxt, { color: '#FF6B35' }]}>
              Authentication failed. Try again.
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: T.text }]}>🛡 Secure Vault</Text>
          <Text style={[styles.headerSub, { color: T.sub }]}>Double authenticated · AES-256</Text>
        </View>
        <TouchableOpacity onPress={() => setUnlocked(false)}>
          <Text style={{ color: T.sub, fontSize: 20 }}>🔒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Hero */}
        <View style={[neuSurface(T), styles.hero]}>
          <Text style={{ fontSize: 48 }}>🔐</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: T.text }]}>Your Private Space</Text>
            <Text style={[styles.heroSub, { color: T.sub }]}>
              Apps here are hidden from others. Only you can access this vault.
            </Text>
          </View>
        </View>

        {/* Vault apps */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Apps in vault</Text>
        {vaultApps.length === 0 ? (
          <View style={[neuSurface(T), styles.empty]}>
            <Text style={{ fontSize: 32 }}>🛡</Text>
            <Text style={[styles.emptyTitle, { color: T.text }]}>Vault is empty</Text>
            <Text style={[styles.emptySub, { color: T.sub }]}>
              Move apps here from the Apps screen
            </Text>
          </View>
        ) : (
          <View style={[neuSurface(T), styles.vaultGrid]}>
            {vaultApps.map(app => (
              <TouchableOpacity
                key={app.packageName}
                style={styles.vaultApp}
                onLongPress={() => removeFromVault(app.packageName)}
              >
                <View style={[styles.vaultIcon, { backgroundColor: T.surface2 }]}>
                  <Text style={{ fontSize: 26 }}>{app.icon || '📱'}</Text>
                </View>
                <Text style={[styles.vaultName, { color: T.sub }]} numberOfLines={1}>
                  {app.appName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Gesture */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Secret gesture</Text>
        <View style={[neuSurface(T), { padding: 16, borderRadius: 18 }]}>
          <Text style={[styles.gestureDesc, { color: T.sub }]}>
            Draw your secret shape anywhere in the app to open vault instantly
          </Text>
          {state.gestureEncoded ? (
            <View style={[styles.gestureSet, { backgroundColor: T.accent + '15', borderColor: T.accent + '30' }]}>
              <Text style={{ fontSize: 20 }}>✓</Text>
              <Text style={[styles.gestureSetTxt, { color: T.accent }]}>Gesture is set</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: T.accent, marginTop: 12 }]}
            onPress={() => setSheet('gesture_setup')}
          >
            <Text style={[styles.ghostBtnTxt, { color: T.accent }]}>
              {state.gestureEncoded ? 'Change gesture' : 'Set up gesture'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recovery */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Recovery</Text>
        <TouchableOpacity style={[neuSurface(T), styles.recoveryRow]} onPress={() => setSheet('recovery')}>
          <View style={[styles.settingIcon, { backgroundColor: '#FF6B35' + '18' }]}>
            <Text>🔑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: T.text }]}>Recovery phrase</Text>
            <Text style={[styles.settingSub, { color: T.sub }]}>12 word backup · stored securely</Text>
          </View>
          <Text style={{ color: T.sub }}>›</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Gesture setup sheet */}
      {sheet === 'gesture_setup' && (
        <SlideScreen
          T={T} animLevel={animLevel}
          originX={0} originY={0}
          onClose={() => setSheet(null)}
          zIndex={60}
        >
          {(close) => (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
              <Text style={[styles.sheetTitle, { color: T.text }]}>Set secret gesture</Text>
              <Text style={[styles.sheetSub, { color: T.sub }]}>
                Draw any shape — a star, spiral, zigzag, or your initials. You'll repeat it to open the vault instantly.
              </Text>

              <Text style={[styles.sectionHd, { color: T.sub }]}>Quick presets</Text>
              <View style={styles.presetRow}>
                {PRESET_LETTERS.map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.presetKey, tileStyle(T)]}
                    onPress={() => { savePresetGesture(l); close(); }}
                  >
                    <Text style={[styles.presetKeyTxt, { color: T.text }]}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionHd, { color: T.sub }]}>Or draw your own</Text>
              <GestureCanvas
                T={T}
                height={240}
                onGestureComplete={(encoded, pts) => setPendingGesture(encoded)}
              />
              {pendingGesture && (
                <Text style={[styles.gestureCount, { color: T.accent }]}>
                  ✓ Gesture recorded — {pendingGesture.length} direction segments
                </Text>
              )}

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { borderColor: T.border, flex: 1 }]}
                  onPress={() => setPendingGesture(null)}
                >
                  <Text style={[styles.ghostBtnTxt, { color: T.sub }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.accentBtn,
                    { backgroundColor: pendingGesture ? T.accent : T.surface2, flex: 1 },
                  ]}
                  disabled={!pendingGesture}
                  onPress={() => { if (pendingGesture) { saveGesture(pendingGesture); close(); } }}
                >
                  <Text style={[styles.accentBtnTxt, { color: pendingGesture ? '#000' : T.sub }]}>
                    Save gesture
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SlideScreen>
      )}

      {/* Recovery sheet */}
      {sheet === 'recovery' && (
        <SlideScreen
          T={T} animLevel={animLevel}
          originX={0} originY={0}
          onClose={() => setSheet(null)}
          zIndex={60}
        >
          {(close) => (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
              <Text style={[styles.sheetTitle, { color: T.text }]}>Recovery phrase</Text>
              <Text style={[styles.sheetSub, { color: T.sub }]}>
                Write these 12 words down and store them somewhere safe. They're the only way to recover your vault if you forget your PIN and biometric.
              </Text>
              <View style={[neuSurface(T), styles.phraseBox]}>
                {(state.recoveryPhrase || '').split(' ').map((word, i) => (
                  <View key={i} style={[styles.wordChip, { backgroundColor: T.surface2, borderColor: T.border }]}>
                    <Text style={[styles.wordNum, { color: T.sub }]}>{i + 1}</Text>
                    <Text style={[styles.wordTxt, { color: T.text }]}>{word}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.accentBtn, { backgroundColor: T.accent, width: '100%', maxWidth: undefined }]}
                onPress={close}
              >
                <Text style={styles.accentBtnTxt}>I've written this down</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SlideScreen>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 3 },
  lockedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  lockedTitle: { fontSize: 26, fontWeight: '700' },
  lockedSub: { fontSize: 14, textAlign: 'center' },
  authInfo: { padding: 16, borderRadius: 18, width: '100%', gap: 12 },
  authStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  authTxt: { fontSize: 13 },
  accentBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', maxWidth: 240 },
  accentBtnTxt: { fontSize: 15, fontWeight: '700', color: '#000' },
  errorTxt: { fontSize: 13 },
  sectionHd: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.1,
    textTransform: 'uppercase', marginTop: 20, marginBottom: 10, paddingHorizontal: 2,
  },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18 },
  heroTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  heroSub: { fontSize: 12, lineHeight: 18 },
  empty: { padding: 40, borderRadius: 18, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13 },
  vaultGrid: { padding: 16, borderRadius: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  vaultApp: { width: (SW - 64 - 48) / 4, alignItems: 'center', gap: 6 },
  vaultIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  vaultName: { fontSize: 11, textAlign: 'center' },
  gestureDesc: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  gestureSet: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  gestureSetTxt: { fontSize: 13, fontWeight: '600' },
  recoveryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  sheetTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sheetSub: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  presetKey: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  presetKeyTxt: { fontSize: 20, fontWeight: '700' },
  gestureCount: { fontSize: 12, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  ghostBtn: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1.5, alignItems: 'center' },
  ghostBtnTxt: { fontSize: 14, fontWeight: '600' },
  phraseBox: { padding: 16, borderRadius: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  wordChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  wordNum: { fontSize: 10, fontWeight: '700', minWidth: 14 },
  wordTxt: { fontSize: 13, fontWeight: '500' },
});
