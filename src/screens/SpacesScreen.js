import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Switch,
} from 'react-native';
import { tileStyle, neuSurface } from '../utils/themes';
import SlideScreen from '../components/SlideScreen';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function SpacesScreen({ T, animLevel, state, dispatch }) {
  const [tab, setTab] = useState('paused'); // 'paused' | 'archived'
  const [sheet, setSheet] = useState(null);

  const pausedApps   = (state.installedApps || []).filter(a => a.paused);
  const archivedApps = state.archivedApps || [];
  const schedules    = state.schedules    || [];

  function toggleSchedule(id) {
    dispatch({ type: 'TOGGLE_SCHEDULE', id });
  }
  function deleteSchedule(id) {
    dispatch({ type: 'DELETE_SCHEDULE', id });
  }
  function addSchedule(sched) {
    dispatch({ type: 'ADD_SCHEDULE', schedule: { ...sched, id: Date.now() } });
    setSheet(null);
  }
  function resumeApp(pkg) {
    dispatch({ type: 'TOGGLE_PAUSE', packageName: pkg });
  }

  return (
    <View style={[styles.screen, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: T.text }]}>Spaces</Text>
        <Text style={[styles.headerSub, { color: T.sub }]}>Paused & archived apps</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabPad}>
        <View style={[styles.tabs, { backgroundColor: T.surface2 }]}>
          {['paused', 'archived'].map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tab,
                tab === t && [tileStyle(T), styles.tabActive],
              ]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabTxt, { color: tab === t ? T.text : T.sub }]}>
                {t === 'paused' ? '⏸ Paused' : '📦 Archived'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {tab === 'paused' ? (
          <>
            {pausedApps.length === 0 ? (
              <View style={[neuSurface(T), styles.empty]}>
                <Text style={{ fontSize: 36 }}>⏸</Text>
                <Text style={[styles.emptyTitle, { color: T.text }]}>No paused apps</Text>
                <Text style={[styles.emptySub, { color: T.sub }]}>
                  Pause apps from the main list to see them here
                </Text>
              </View>
            ) : (
              pausedApps.map(app => (
                <View key={app.packageName} style={[styles.appRow, tileStyle(T), { marginBottom: 6, opacity: 0.75 }]}>
                  <View style={[styles.appIcon, { backgroundColor: T.surface2 }]}>
                    <Text style={{ fontSize: 24 }}>{app.icon || '📱'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.appName, { color: T.text }]}>{app.appName}</Text>
                    <Text style={[styles.appSub, { color: T.sub }]}>Paused</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.resumeBtn, { backgroundColor: 'rgba(34,211,165,0.1)' }]}
                    onPress={() => resumeApp(app.packageName)}
                  >
                    <Text style={{ color: '#22D3A5', fontSize: 13, fontWeight: '600' }}>▶ Resume</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <Text style={[styles.sectionHd, { color: T.sub }]}>Schedules</Text>

            {schedules.length === 0 ? (
              <Text style={[styles.noSchedules, { color: T.sub }]}>No schedules yet</Text>
            ) : (
              schedules.map(s => (
                <View key={s.id} style={[styles.schedCard, tileStyle(T), { marginBottom: 8 }]}>
                  <View style={[styles.schedAccent, { backgroundColor: T.accent }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.schedTop}>
                      <Text style={[styles.schedTime, { color: T.text }]}>
                        {String(s.pauseH).padStart(2,'0')}:{String(s.pauseM).padStart(2,'0')}
                        {' → '}
                        {String(s.resumeH).padStart(2,'0')}:{String(s.resumeM).padStart(2,'0')}
                      </Text>
                      <Switch
                        value={s.active}
                        onValueChange={() => toggleSchedule(s.id)}
                        trackColor={{ false: T.border, true: T.accent }}
                        thumbColor={'#fff'}
                      />
                    </View>
                    <View style={styles.dayRow}>
                      {DAY_LABELS.map((d, i) => (
                        <View key={i} style={[
                          styles.dayPill,
                          { backgroundColor: s.days.includes(i) ? T.accent + '20' : T.surface2, borderColor: T.border },
                        ]}>
                          <Text style={[styles.dayTxt, { color: s.days.includes(i) ? T.accent : T.sub }]}>{d}</Text>
                        </View>
                      ))}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(s.apps || []).map(pkg => {
                          const app = (state.installedApps || []).find(a => a.packageName === pkg);
                          return app ? (
                            <View key={pkg} style={[styles.appChip, { backgroundColor: T.surface2, borderColor: T.border }]}>
                              <Text style={[styles.appChipTxt, { color: T.sub }]}>
                                {app.icon} {app.appName}
                              </Text>
                            </View>
                          ) : null;
                        })}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.ghostBtn, { borderColor: T.accent, marginTop: 8 }]}
              onPress={() => setSheet('add_schedule')}
            >
              <Text style={[styles.ghostBtnTxt, { color: T.accent }]}>+ Add schedule</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {archivedApps.length === 0 ? (
              <View style={[neuSurface(T), styles.empty]}>
                <Text style={{ fontSize: 36 }}>📦</Text>
                <Text style={[styles.emptyTitle, { color: T.text }]}>No archived apps</Text>
                <Text style={[styles.emptySub, { color: T.sub }]}>
                  Archive apps via Android Settings to free storage while keeping them listed here
                </Text>
              </View>
            ) : (
              archivedApps.map(app => (
                <View key={app.packageName} style={[styles.appRow, tileStyle(T), { marginBottom: 6 }]}>
                  <View style={[styles.appIcon, { backgroundColor: T.surface2, opacity: 0.6 }]}>
                    <Text style={{ fontSize: 24 }}>{app.icon || '📱'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.appName, { color: T.text }]}>{app.appName}</Text>
                    <Text style={[styles.appSub, { color: T.sub }]}>
                      Archived {app.archivedDate} · {app.savedMb}MB freed
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.restoreBtn, { backgroundColor: T.accent }]}
                    onPress={() => {/* deep link to Play Store */}}
                  >
                    <Text style={styles.restoreBtnTxt}>Restore</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add schedule sheet */}
      {sheet === 'add_schedule' && (
        <SlideScreen
          T={T} animLevel={animLevel}
          originX={0} originY={0}
          onClose={() => setSheet(null)}
          zIndex={60}
        >
          {(close) => <AddScheduleSheet T={T} state={state} onSave={addSchedule} onCancel={close} />}
        </SlideScreen>
      )}
    </View>
  );
}

// ── ADD SCHEDULE SHEET ────────────────────────────────────────────────────────
function AddScheduleSheet({ T, state, onSave, onCancel }) {
  const [pauseH, setPauseH] = useState(22);
  const [pauseM, setPauseM] = useState(0);
  const [resumeH, setResumeH] = useState(7);
  const [resumeM, setResumeM] = useState(0);
  const [days, setDays] = useState([0,1,2,3,4,5,6]);
  const [selectedApps, setSelectedApps] = useState([]);

  function toggleDay(i) {
    setDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i]);
  }
  function toggleApp(pkg) {
    setSelectedApps(s => s.includes(pkg) ? s.filter(x => x !== pkg) : [...s, pkg]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={[styles.sheetTitle, { color: T.text }]}>New schedule</Text>
      <Text style={[styles.sheetSub, { color: T.sub }]}>
        Automatically pause selected apps at set times
      </Text>

      <Text style={[styles.sectionHd, { color: T.sub }]}>Pause time</Text>
      <View style={[neuSurface(T), styles.timeRow]}>
        <TextInput
          style={[styles.timeInput, { color: T.text }]}
          value={String(pauseH).padStart(2,'0')}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={v => setPauseH(Math.min(23, parseInt(v)||0))}
        />
        <Text style={[styles.timeSep, { color: T.sub }]}>:</Text>
        <TextInput
          style={[styles.timeInput, { color: T.text }]}
          value={String(pauseM).padStart(2,'0')}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={v => setPauseM(Math.min(59, parseInt(v)||0))}
        />
      </View>

      <Text style={[styles.sectionHd, { color: T.sub }]}>Resume time</Text>
      <View style={[neuSurface(T), styles.timeRow]}>
        <TextInput
          style={[styles.timeInput, { color: T.text }]}
          value={String(resumeH).padStart(2,'0')}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={v => setResumeH(Math.min(23, parseInt(v)||0))}
        />
        <Text style={[styles.timeSep, { color: T.sub }]}>:</Text>
        <TextInput
          style={[styles.timeInput, { color: T.text }]}
          value={String(resumeM).padStart(2,'0')}
          keyboardType="number-pad"
          maxLength={2}
          onChangeText={v => setResumeM(Math.min(59, parseInt(v)||0))}
        />
      </View>

      <Text style={[styles.sectionHd, { color: T.sub }]}>Repeat on</Text>
      <View style={[neuSurface(T), styles.dayPad]}>
        <View style={styles.dayRow2}>
          {DAY_LABELS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayBtn,
                {
                  backgroundColor: days.includes(i) ? T.accent + '20' : T.surface2,
                  borderColor: days.includes(i) ? T.accent + '44' : T.border,
                },
              ]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayBtnTxt, { color: days.includes(i) ? T.accent : T.sub }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionHd, { color: T.sub }]}>Apps to pause</Text>
      <View style={{ gap: 6, maxHeight: 240 }}>
        <ScrollView scrollEnabled nestedScrollEnabled style={{ maxHeight: 240 }}>
          {(state.installedApps || []).filter(a => !a.inVault).map(app => (
            <TouchableOpacity
              key={app.packageName}
              style={[styles.appRow, tileStyle(T), { marginBottom: 6 }]}
              onPress={() => toggleApp(app.packageName)}
            >
              <View style={[styles.appIcon, { backgroundColor: T.surface2, width: 38, height: 38 }]}>
                <Text style={{ fontSize: 18 }}>{app.icon || '📱'}</Text>
              </View>
              <Text style={[styles.appName, { flex: 1, color: T.text }]}>{app.appName}</Text>
              <Switch
                value={selectedApps.includes(app.packageName)}
                onValueChange={() => toggleApp(app.packageName)}
                trackColor={{ false: T.border, true: T.accent }}
                thumbColor={'#fff'}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.ghostBtn, { borderColor: T.border, flex: 1 }]} onPress={onCancel}>
          <Text style={[styles.ghostBtnTxt, { color: T.sub }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.accentBtn, { backgroundColor: T.accent, flex: 1 }]}
          onPress={() => onSave({ pauseH, pauseM, resumeH, resumeM, days, apps: selectedApps, active: true })}
        >
          <Text style={styles.accentBtnTxt}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 3 },
  tabPad: { paddingHorizontal: 16, marginBottom: 8 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 },
  tabActive: {},
  tabTxt: { fontSize: 13, fontWeight: '500' },
  empty: { padding: 40, borderRadius: 18, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  sectionHd: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.1,
    textTransform: 'uppercase', marginTop: 20, marginBottom: 10, paddingHorizontal: 2,
  },
  noSchedules: { fontSize: 13, paddingVertical: 8 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  appIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 15, fontWeight: '600' },
  appSub:  { fontSize: 12, marginTop: 2 },
  resumeBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  restoreBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  restoreBtnTxt: { color: '#000', fontSize: 12, fontWeight: '700' },
  schedCard: { padding: 16, borderRadius: 16, flexDirection: 'row', gap: 12 },
  schedAccent: { width: 3, borderRadius: 3, alignSelf: 'stretch' },
  schedTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  schedTime: { fontSize: 22, fontWeight: '600', fontFamily: 'monospace' },
  dayRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  dayPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  dayTxt: { fontSize: 10, fontWeight: '600' },
  appChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  appChipTxt: { fontSize: 12 },
  ghostBtn: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1.5, alignItems: 'center', width: '100%' },
  ghostBtnTxt: { fontSize: 14, fontWeight: '600' },
  sheetTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sheetSub: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18 },
  timeInput: { fontSize: 28, fontWeight: '700', fontFamily: 'monospace', minWidth: 48, textAlign: 'center' },
  timeSep: { fontSize: 28, fontWeight: '700', marginHorizontal: 4 },
  dayPad: { padding: 12, borderRadius: 18 },
  dayRow2: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, borderWidth: 1 },
  dayBtnTxt: { fontSize: 11, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  accentBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  accentBtnTxt: { fontSize: 15, fontWeight: '700', color: '#000' },
});
