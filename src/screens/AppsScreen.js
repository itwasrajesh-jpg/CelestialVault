import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, ScrollView,
} from 'react-native';
import { tileStyle, neuSurface } from '../utils/themes';
import SlideScreen from '../components/SlideScreen';
import PinScreen from '../components/PinScreen';
import { useAppLockAuth } from '../hooks/useBiometricAuth';
import { verifyPin } from '../utils/security';

const { width: SW } = Dimensions.get('window');

const FILTERS = ['All', 'Locked', 'Paused', 'Vault'];

// ─── APPS SCREEN ─────────────────────────────────────────────────────────────
export default function AppsScreen({ T, animLevel, state, dispatch, pinHash }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sheet, setSheet] = useState(null); // { type, appId, originX, originY }

  const { authenticate, verifyPinEntry } = useAppLockAuth();

  const apps = (state.installedApps || []).filter(a => {
    if (filter === 'Locked' && !a.locked) return false;
    if (filter === 'Paused' && !a.paused) return false;
    if (filter === 'Vault'  && !a.inVault) return false;
    if (filter === 'All'    && a.inVault)  return false;
    if (search && !a.appName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openDetail(app, e) {
    const { pageX, pageY } = e.nativeEvent;
    setSheet({ type: 'detail', appId: app.packageName, originX: pageX, originY: pageY });
  }

  function openVaultFlow(app, e) {
    const { pageX, pageY } = e.nativeEvent;
    setSheet({ type: 'vault_bio', appId: app.packageName, originX: pageX, originY: pageY });
  }

  function toggleLock(packageName) {
    dispatch({ type: 'TOGGLE_LOCK', packageName });
  }

  function togglePause(packageName) {
    dispatch({ type: 'TOGGLE_PAUSE', packageName });
  }

  function moveToVault(packageName) {
    dispatch({ type: 'MOVE_TO_VAULT', packageName });
    setSheet(null);
  }

  const sheetApp = sheet ? (state.installedApps || []).find(a => a.packageName === sheet?.appId) : null;

  return (
    <View style={[styles.screen, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: T.text }]}>Celestial Vault</Text>
          <Text style={[styles.headerSub, { color: T.sub }]}>
            {(state.installedApps || []).filter(a => a.locked && !a.inVault).length} locked
            {' · '}
            {(state.installedApps || []).filter(a => a.inVault).length} in vault
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.search, neuSurface(T)]}>
        <Text style={{ color: T.sub, fontSize: 16 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: T.text }]}
          placeholder="Search apps..."
          placeholderTextColor={T.sub}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: T.sub }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.chip,
              { borderColor: T.border, backgroundColor: T.surface2 },
              filter === f && { backgroundColor: T.accent + '22', borderColor: T.accent + '44' },
            ]}
          >
            <Text style={[styles.chipTxt, { color: filter === f ? T.accent : T.sub }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* App list */}
      <FlatList
        data={apps}
        keyExtractor={a => a.packageName}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: T.text }]}>No apps found</Text>
            <Text style={[styles.emptySub, { color: T.sub }]}>Try a different search or filter</Text>
          </View>
        )}
        renderItem={({ item: app }) => (
          <TouchableOpacity
            style={[styles.appRow, tileStyle(T)]}
            onPress={e => openDetail(app, e)}
            activeOpacity={0.75}
          >
            <View style={[styles.appIcon, { backgroundColor: T.surface2 }]}>
              <Text style={{ fontSize: 26 }}>{app.icon || '📱'}</Text>
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: T.text }]} numberOfLines={1}>
                {app.appName}
              </Text>
              <Text style={[styles.appPkg, { color: T.sub }]} numberOfLines={1}>
                {app.packageName}
              </Text>
              <View style={styles.badges}>
                {app.locked  && <View style={styles.badgeLock}><Text style={styles.badgeLockTxt}>🔒 Locked</Text></View>}
                {app.paused  && <View style={styles.badgePause}><Text style={styles.badgePauseTxt}>⏸ Paused</Text></View>}
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnLock, { opacity: app.locked ? 1 : 0.35 }]}
                onPress={e => { e.stopPropagation(); toggleLock(app.packageName); }}
              >
                <Text style={{ fontSize: 14 }}>🔒</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnPause, { opacity: app.paused ? 1 : 0.35 }]}
                onPress={e => { e.stopPropagation(); togglePause(app.packageName); }}
              >
                <Text style={{ fontSize: 14 }}>⏸</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnVault]}
                onPress={e => { e.stopPropagation(); openVaultFlow(app, e); }}
              >
                <Text style={{ fontSize: 14 }}>🛡</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* App detail sheet */}
      {sheet?.type === 'detail' && sheetApp && (
        <SlideScreen
          T={T} animLevel={animLevel}
          originX={sheet.originX} originY={sheet.originY}
          onClose={() => setSheet(null)}
          zIndex={60}
        >
          {(close) => (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <View style={[styles.detailIcon, { backgroundColor: T.surface2 }]}>
                  <Text style={{ fontSize: 30 }}>{sheetApp.icon || '📱'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailName, { color: T.text }]}>{sheetApp.appName}</Text>
                  <Text style={[styles.detailPkg, { color: T.sub }]}>{sheetApp.packageName}</Text>
                </View>
              </View>

              <View style={[tileStyle(T), { marginBottom: 12 }]}>
                <TouchableOpacity style={styles.settingRow} onPress={() => { toggleLock(sheetApp.packageName); close(); }}>
                  <View style={[styles.settingIcon, { backgroundColor: T.accent + '18' }]}>
                    <Text>🔒</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: T.text }]}>
                      {sheetApp.locked ? 'Unlock app' : 'Lock app'}
                    </Text>
                    <Text style={[styles.settingSub, { color: T.sub }]}>
                      {sheetApp.locked ? 'Remove biometric lock' : 'Require biometric to open'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: T.border }]} />
                <TouchableOpacity style={styles.settingRow} onPress={() => { togglePause(sheetApp.packageName); close(); }}>
                  <View style={[styles.settingIcon, { backgroundColor: '#FF6B35' + '18' }]}>
                    <Text>⏸</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: T.text }]}>
                      {sheetApp.paused ? 'Resume app' : 'Pause app'}
                    </Text>
                    <Text style={[styles.settingSub, { color: T.sub }]}>
                      {sheetApp.paused ? 'Allow app to open normally' : 'Block app from opening'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: T.border }]} />
                <TouchableOpacity style={styles.settingRow}
                  onPress={() => { close(); setTimeout(() => openVaultFlow(sheetApp, { nativeEvent: { pageX: SW / 2, pageY: 300 } }), 500); }}>
                  <View style={[styles.settingIcon, { backgroundColor: '#22D3A5' + '18' }]}>
                    <Text>🛡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: T.text }]}>Move to vault</Text>
                    <Text style={[styles.settingSub, { color: T.sub }]}>Hide completely · double biometric</Text>
                  </View>
                  <Text style={{ color: T.sub }}>›</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.ghostBtn, { borderColor: T.accent }]}
                onPress={close}
              >
                <Text style={[styles.ghostBtnTxt, { color: T.accent }]}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SlideScreen>
      )}

      {/* Vault biometric flow */}
      {sheet?.type === 'vault_bio' && sheetApp && (
        <SlideScreen
          T={T} animLevel={animLevel}
          originX={sheet.originX} originY={sheet.originY}
          onClose={() => setSheet(null)}
          zIndex={60}
        >
          {(close) => (
            <VaultBioFlow
              T={T} app={sheetApp}
              onSuccess={() => { moveToVault(sheetApp.packageName); close(); }}
              onCancel={close}
              pinHash={pinHash}
            />
          )}
        </SlideScreen>
      )}
    </View>
  );
}

// ── VAULT BIO FLOW — double biometric inside sheet ────────────────────────────
function VaultBioFlow({ T, app, onSuccess, onCancel, pinHash }) {
  const [step, setStep] = useState('bio1'); // bio1 | bio2 | pin
  const { authenticate } = useAppLockAuth();

  async function doBio1() {
    const result = await authenticate(app.appName);
    if (result === true) setStep('bio2');
    else if (result === 'needs_pin') setStep('pin');
  }

  async function doBio2() {
    const result = await authenticate(app.appName + ' (vault confirmation)');
    if (result === true) onSuccess();
    else if (result === 'needs_pin') setStep('pin');
  }

  if (step === 'pin') {
    return (
      <PinScreen
        T={T}
        title="Enter PIN"
        subtitle="Biometric unavailable"
        onSuccess={async pin => {
          const ok = await verifyPin(pin, pinHash);
          if (ok) onSuccess();
          return ok;
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <View style={styles.bioWrap}>
      <Text style={[styles.bioLabel, { color: T.accent }]}>
        {step === 'bio1' ? 'MOVING TO VAULT' : 'SECOND VERIFICATION'}
      </Text>
      <Text style={{ fontSize: 36 }}>{app.icon || '📱'}</Text>
      <View style={[styles.bioRing, { borderColor: T.accent }]}>
        <Text style={{ fontSize: 44 }}>👆</Text>
      </View>
      <Text style={[styles.bioTitle, { color: T.text }]}>
        {step === 'bio1' ? 'Verify identity' : 'Verify again'}
      </Text>
      <Text style={[styles.bioSub, { color: T.sub }]}>
        {step === 'bio1'
          ? ('Moving ' + app.appName + ' to your vault')
          : 'One more scan for extra security'}
      </Text>
      <TouchableOpacity
        style={[styles.accentBtn, { backgroundColor: T.accent }]}
        onPress={step === 'bio1' ? doBio1 : doBio2}
      >
        <Text style={styles.accentBtnTxt}>
          {step === 'bio1' ? 'Authenticate' : 'Confirm'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setStep('pin')} style={[styles.ghostBtn, { borderColor: T.accent }]}>
        <Text style={[styles.ghostBtnTxt, { color: T.accent }]}>Use PIN instead</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel}>
        <Text style={[styles.cancelTxt, { color: T.sub }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 3 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16, marginHorizontal: 16, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chipRow: { flexShrink: 0, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  chipTxt: { fontSize: 12, fontWeight: '600' },
  appRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, padding: 12,
  },
  appIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  appInfo: { flex: 1, minWidth: 0 },
  appName: { fontSize: 15, fontWeight: '600' },
  appPkg: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 5, marginTop: 5 },
  badgeLock: { backgroundColor: 'rgba(185,133,250,0.15)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(185,133,250,0.25)' },
  badgeLockTxt: { fontSize: 10, fontWeight: '700', color: '#B985FA' },
  badgePause: { backgroundColor: 'rgba(255,107,53,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)' },
  badgePauseTxt: { fontSize: 10, fontWeight: '700', color: '#FF6B35' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnLock:  { backgroundColor: 'rgba(185,133,250,0.15)' },
  btnPause: { backgroundColor: 'rgba(255,107,53,0.12)' },
  btnVault: { backgroundColor: 'rgba(34,211,165,0.1)' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13 },
  detailIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  detailName: { fontSize: 20, fontWeight: '700' },
  detailPkg: { fontSize: 11, fontFamily: 'monospace', marginTop: 3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  bioWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  bioLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  bioRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  bioTitle: { fontSize: 20, fontWeight: '700' },
  bioSub: { fontSize: 14, textAlign: 'center' },
  accentBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '80%', maxWidth: 240 },
  accentBtnTxt: { fontSize: 15, fontWeight: '700', color: '#000' },
  ghostBtn: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1.5, alignItems: 'center', width: '80%', maxWidth: 240 },
  ghostBtnTxt: { fontSize: 14, fontWeight: '600' },
  cancelTxt: { fontSize: 13, marginTop: -8 },
});
