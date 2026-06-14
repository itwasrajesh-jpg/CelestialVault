import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Linking,
} from 'react-native';
import { tileStyle, neuSurface, THEMES, ACCENT_PRESETS } from '../utils/themes';
import SlideScreen from '../components/SlideScreen';
import PinScreen from '../components/PinScreen';
import { hashPin } from '../utils/security';
import { savePin, clearPin } from '../utils/storage';

const ANIM_LEVELS = [
  { key: 'full', label: 'Full', sub: '120fps spring' },
  { key: 'lite', label: 'Lite', sub: 'Faster & lighter' },
  { key: 'none', label: 'Off',  sub: 'Instant transitions' },
];

export default function SettingsScreen({ T, animLevel, state, dispatch }) {
  const [sheet, setSheet] = useState(null); // null | 'pin_setup' | 'pin_change'
  const [pinSetupStep, setPinSetupStep] = useState('enter'); // 'enter' | 'confirm'
  const [firstPin, setFirstPin] = useState('');

  async function setPinEntry(pin) {
    if (pinSetupStep === 'enter') {
      setFirstPin(pin);
      setPinSetupStep('confirm');
      return false; // keep sheet open
    }
    // confirm step
    if (pin !== firstPin) return false; // mismatch — shake
    const hash = await hashPin(pin);
    await savePin(hash);
    dispatch({ type: 'SET_PIN', hash });
    setSheet(null);
    setPinSetupStep('enter');
    setFirstPin('');
    return true;
  }

  async function clearPinAction() {
    await clearPin();
    dispatch({ type: 'SET_PIN', hash: null });
  }

  return (
    <View style={[styles.screen, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: T.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Theme */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Theme</Text>
        <View style={[neuSurface(T), styles.themeCard]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 16, padding: 4 }}>
              {Object.entries(THEMES).map(([key, theme]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.themePill}
                  onPress={() => dispatch({ type: 'SET_THEME', v: key })}
                >
                  <View style={[
                    styles.themeSwatch,
                    { backgroundColor: theme.bg },
                    state.theme === key && { borderColor: T.accent, borderWidth: 2 },
                  ]}>
                    <View style={[styles.themeSwatchInner, { backgroundColor: theme.surface }]} />
                  </View>
                  <Text style={[styles.themeName, { color: state.theme === key ? T.accent : T.sub }]}>
                    {key === 'default' ? 'Dynamic' : key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Accent */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Accent color</Text>
        <View style={[neuSurface(T), styles.accentCard]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12, padding: 4 }}>
              {Object.entries(ACCENT_PRESETS).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => dispatch({ type: 'SET_ACCENT', v: key })}
                >
                  <View style={[
                    styles.accentSwatch,
                    { backgroundColor: preset.swatch },
                    state.accentKey === key && { borderColor: '#fff', borderWidth: 2.5 },
                  ]} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Animation */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Animation</Text>
        <View style={[neuSurface(T), styles.animRow]}>
          {ANIM_LEVELS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[
                styles.animPill,
                { borderColor: T.border, backgroundColor: T.surface2 },
                animLevel === a.key && {
                  backgroundColor: T.accent + '18',
                  borderColor: T.accent + '44',
                },
              ]}
              onPress={() => dispatch({ type: 'SET_ANIM', v: a.key })}
            >
              <Text style={[styles.animLabel, { color: animLevel === a.key ? T.accent : T.text }]}>
                {a.label}
              </Text>
              <Text style={[styles.animSub, { color: T.sub }]}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Security</Text>
        <View style={[tileStyle(T)]}>
          {/* Biometric */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: T.accent + '18' }]}>
              <Text>👆</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: T.text }]}>Biometric lock</Text>
              <Text style={[styles.settingSub, { color: T.sub }]}>Double fingerprint for vault</Text>
            </View>
            <Switch
              value={state.biometric !== false}
              onValueChange={v => dispatch({ type: 'SET_BIO', v })}
              trackColor={{ false: T.border, true: T.accent }}
              thumbColor={'#fff'}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {/* PIN */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => { setPinSetupStep('enter'); setSheet('pin_setup'); }}
          >
            <View style={[styles.settingIcon, { backgroundColor: T.accent + '18' }]}>
              <Text>🔢</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: T.text }]}>PIN fallback</Text>
              <Text style={[styles.settingSub, { color: T.sub }]}>
                {state.pinHash ? 'PIN is set · tap to change' : 'Not set — tap to create'}
              </Text>
            </View>
            <Text style={{ color: T.sub }}>›</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {/* Lock delay */}
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#FF6B35' + '18' }]}>
              <Text>⏱</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: T.text }]}>Lock delay</Text>
              <Text style={[styles.settingSub, { color: T.sub }]}>Immediate</Text>
            </View>
            <Text style={{ color: T.sub }}>›</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {/* Cooldown info */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: '#FF9800' + '18' }]}>
              <Text>🚫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: T.text }]}>Failed attempt cooldown</Text>
              <Text style={[styles.settingSub, { color: T.sub }]}>2 min after 5 attempts (testing mode)</Text>
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>Accessibility service</Text>
        <View style={[neuSurface(T), styles.accessCard]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <Text style={{ fontSize: 28 }}>♿</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: T.text }]}>Accessibility Service</Text>
              <Text style={{ fontSize: 12, color: '#22D3A5', marginTop: 2 }}>
                {state.accessibilityEnabled ? '✓ Active — app locking enabled' : '⚠ Not enabled — tap to set up'}
              </Text>
            </View>
          </View>
          <Text style={[styles.accessDesc, { color: T.sub }]}>
            Required to intercept app launches and show the biometric lock screen. Only monitors which app is in the foreground — cannot read content inside apps.
          </Text>
          {!state.accessibilityEnabled && (
            <TouchableOpacity
              style={[styles.accentBtn, { backgroundColor: T.accent, marginTop: 12 }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.accentBtnTxt}>Open Accessibility Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* About */}
        <Text style={[styles.sectionHd, { color: T.sub }]}>About</Text>
        <View style={[neuSurface(T), styles.aboutCard]}>
          <Text style={[styles.aboutTitle, { color: T.text }]}>Celestial Vault</Text>
          <Text style={[styles.aboutSub, { color: T.sub }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: T.sub }]}>
            Your apps. Your privacy. Zero compromises.
          </Text>
          <Text style={[styles.aboutSub, { color: T.sub, marginTop: 8 }]}>
            © Celestial · CC BY-NC-ND 4.0
          </Text>
        </View>

      </ScrollView>

      {/* PIN setup sheet */}
      {sheet === 'pin_setup' && (
        <SlideScreen
          T={T} animLevel={animLevel}
          originX={0} originY={0}
          onClose={() => { setSheet(null); setPinSetupStep('enter'); setFirstPin(''); }}
          zIndex={60}
        >
          {(close) => (
            <PinScreen
              T={T}
              title={pinSetupStep === 'enter' ? 'Create PIN' : 'Confirm PIN'}
              subtitle={pinSetupStep === 'enter' ? 'Choose a 4-digit PIN' : 'Enter the same PIN again'}
              onSuccess={setPinEntry}
              onCancel={close}
            />
          )}
        </SlideScreen>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  sectionHd: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.1,
    textTransform: 'uppercase', marginTop: 20, marginBottom: 10, paddingHorizontal: 2,
  },
  themeCard: { padding: 16, borderRadius: 18 },
  themePill: { alignItems: 'center', gap: 6 },
  themeSwatch: {
    width: 56, height: 56, borderRadius: 16,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  themeSwatchInner: { width: 28, height: 28, borderRadius: 8 },
  themeName: { fontSize: 11 },
  accentCard: { padding: 16, borderRadius: 18 },
  accentSwatch: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: 'transparent',
  },
  animRow: {
    flexDirection: 'row', gap: 8, padding: 12, borderRadius: 18,
  },
  animPill: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 12, borderWidth: 1, gap: 2,
  },
  animLabel: { fontSize: 13, fontWeight: '600' },
  animSub: { fontSize: 10 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  accessCard: { padding: 16, borderRadius: 18 },
  accessDesc: { fontSize: 12, lineHeight: 18 },
  aboutCard: { padding: 20, borderRadius: 18, gap: 4 },
  aboutTitle: { fontSize: 18, fontWeight: '700' },
  aboutSub: { fontSize: 12 },
  aboutDesc: { fontSize: 13, marginTop: 4 },
  accentBtn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  accentBtnTxt: { fontSize: 14, fontWeight: '700', color: '#000' },
});
