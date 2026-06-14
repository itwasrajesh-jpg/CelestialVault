import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking,
} from 'react-native';
import { neuSurface } from '../utils/themes';
import PinScreen from '../components/PinScreen';
import { hashPin } from '../utils/security';
import { savePin, saveRecovery } from '../utils/storage';
import { generateRecoveryPhrase } from '../utils/recovery';

const STEPS = ['welcome', 'accessibility', 'pin', 'recovery', 'done'];

export default function OnboardingScreen({ T, dispatch }) {
  const [step, setStep] = useState('welcome');
  const [phrase] = useState(() => generateRecoveryPhrase());
  const [pinSetupStage, setPinSetupStage] = useState('enter'); // 'enter' | 'confirm'
  const [firstPin, setFirstPin] = useState('');

  async function handlePinEntry(pin) {
    if (pinSetupStage === 'enter') {
      setFirstPin(pin);
      setPinSetupStage('confirm');
      return false;
    }
    if (pin !== firstPin) return false;
    const hash = await hashPin(pin);
    await savePin(hash);
    dispatch({ type: 'SET_PIN', hash });
    setStep('recovery');
    return true;
  }

  async function finishOnboarding() {
    await saveRecovery(phrase);
    dispatch({ type: 'SET_RECOVERY', phrase });
    dispatch({ type: 'FINISH_ONBOARDING' });
  }

  if (step === 'pin') {
    return (
      <View style={[styles.screen, { backgroundColor: T.bg }]}>
        <PinScreen
          T={T}
          title={pinSetupStage === 'enter' ? 'Create PIN' : 'Confirm PIN'}
          subtitle={pinSetupStage === 'enter'
            ? 'Choose a 4-digit fallback PIN'
            : 'Enter the same PIN again to confirm'}
          onSuccess={handlePinEntry}
        />
        <TouchableOpacity style={styles.skip} onPress={() => setStep('recovery')}>
          <Text style={[styles.skipTxt, { color: T.sub }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: T.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 'welcome' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepIcon}>🛡</Text>
            <Text style={[styles.stepTitle, { color: T.text }]}>Welcome to{'\n'}Celestial Vault</Text>
            <Text style={[styles.stepSub, { color: T.sub }]}>
              Your apps. Your privacy. Zero compromises.{'\n\n'}
              Vault locks your most sensitive apps behind double biometric authentication and keeps a select few hidden in an encrypted vault only you can access.
            </Text>
            <View style={[neuSurface(T), styles.featureList]}>
              {[
                ['🔒', 'App locking', 'Biometric lock on any app'],
                ['🛡', 'Hidden vault', 'Double authenticated private space'],
                ['⏸', 'App pausing', 'Block apps on schedule'],
                ['🔐', 'AES-256', 'Military grade encryption'],
              ].map(([icon, title, sub]) => (
                <View key={title} style={styles.featureRow}>
                  <Text style={{ fontSize: 20, width: 28 }}>{icon}</Text>
                  <View>
                    <Text style={[styles.featureTitle, { color: T.text }]}>{title}</Text>
                    <Text style={[styles.featureSub, { color: T.sub }]}>{sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 'accessibility' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepIcon}>♿</Text>
            <Text style={[styles.stepTitle, { color: T.text }]}>One permission{'\n'}needed</Text>
            <Text style={[styles.stepSub, { color: T.sub }]}>
              Celestial Vault needs the Accessibility Service permission to detect when a locked app opens and show the biometric screen before it loads.
            </Text>
            <View style={[neuSurface(T), styles.stepsCard]}>
              {[
                ['1', <><Text style={{ color: T.text, fontWeight: '700' }}>Tap the button below</Text> to open Android Accessibility Settings</> ],
                ['2', <><Text style={{ color: T.text, fontWeight: '700' }}>Find "Celestial Vault"</Text> in the list and tap it</> ],
                ['3', <><Text style={{ color: T.text, fontWeight: '700' }}>Toggle it ON</Text> and confirm the permission</> ],
              ].map(([num, text]) => (
                <View key={num} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: T.accent + '18' }]}>
                    <Text style={[styles.stepNumTxt, { color: T.accent }]}>{num}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: T.sub }]}>{text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.accentBtn, { backgroundColor: T.accent }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.accentBtnTxt}>Open Accessibility Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skip} onPress={() => setStep('pin')}>
              <Text style={[styles.skipTxt, { color: T.sub }]}>I'll do this later →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'recovery' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepIcon}>🔑</Text>
            <Text style={[styles.stepTitle, { color: T.text }]}>Your recovery{'\n'}phrase</Text>
            <Text style={[styles.stepSub, { color: T.sub }]}>
              Write these 12 words down and keep them somewhere safe. They're the only way to access your vault if you lose your PIN and biometric.
            </Text>
            <View style={[neuSurface(T), styles.phraseBox]}>
              {phrase.split(' ').map((word, i) => (
                <View key={i} style={[styles.wordChip, { backgroundColor: T.surface2, borderColor: T.border }]}>
                  <Text style={[styles.wordNum, { color: T.sub }]}>{i + 1}</Text>
                  <Text style={[styles.wordTxt, { color: T.text }]}>{word}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.accentBtn, { backgroundColor: T.accent }]}
              onPress={() => setStep('done')}
            >
              <Text style={styles.accentBtnTxt}>I've written this down</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.stepWrap}>
            <Text style={[styles.stepIcon, { fontSize: 80 }]}>✅</Text>
            <Text style={[styles.stepTitle, { color: T.text }]}>You're all set!</Text>
            <Text style={[styles.stepSub, { color: T.sub }]}>
              Celestial Vault is ready to protect your apps. Start by locking your most sensitive apps from the Apps screen.
            </Text>
            <View style={[neuSurface(T), styles.doneList]}>
              {[
                'Lock apps with biometric',
                'Move private apps to vault',
                'Set up pause schedules',
                'Draw your secret gesture',
              ].map(tip => (
                <View key={tip} style={styles.tipRow}>
                  <Text style={{ color: T.accent, fontSize: 14 }}>→</Text>
                  <Text style={[styles.tipTxt, { color: T.sub }]}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map(s => (
            <View
              key={s}
              style={[
                styles.dot,
                { backgroundColor: s === step ? T.accent : T.border },
                s === step && { width: 20 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: T.accent }]}
          onPress={() => {
            const idx = STEPS.indexOf(step);
            if (step === 'done') { finishOnboarding(); return; }
            setStep(STEPS[idx + 1]);
          }}
        >
          <Text style={styles.nextBtnTxt}>
            {step === 'done' ? 'Get started →' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  stepWrap: { flex: 1, padding: 32, gap: 20, alignItems: 'center' },
  stepIcon: { fontSize: 72, marginTop: 20 },
  stepTitle: { fontSize: 30, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5, lineHeight: 38 },
  stepSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  featureList: { padding: 16, borderRadius: 18, width: '100%', gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureTitle: { fontSize: 14, fontWeight: '600' },
  featureSub: { fontSize: 12, marginTop: 2 },
  stepsCard: { padding: 16, borderRadius: 18, width: '100%', gap: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  accentBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  accentBtnTxt: { fontSize: 15, fontWeight: '700', color: '#000' },
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipTxt: { fontSize: 14 },
  phraseBox: { padding: 16, borderRadius: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  wordChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  wordNum: { fontSize: 10, fontWeight: '700', minWidth: 14 },
  wordTxt: { fontSize: 13, fontWeight: '500' },
  doneList: { padding: 16, borderRadius: 18, width: '100%', gap: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipTxt: { fontSize: 13 },
  footer: { padding: 24, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  nextBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextBtnTxt: { fontSize: 15, fontWeight: '700', color: '#000' },
});
