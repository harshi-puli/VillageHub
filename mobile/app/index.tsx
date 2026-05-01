import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';

import { useAuth } from '@/state/auth';
import { isResidentProfileAdmin, loginResident, registerResident } from '@/services/authService';
import { db } from '@/firebase';

const YELLOW = '#f9e84e';
const TEAL = '#1a7a6e';
const DARK_TEAL = '#0f5a51';
const BG = '#fef9c3';

// ─── Animated yellow pill input ──────────────────────────────────────────────
function PillInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  delay = 0,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  editable?: boolean;
  delay?: number;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onFocus = () => {
    setFocused(true);
    Animated.spring(scaleAnim, { toValue: 1.025, useNativeDriver: true, speed: 20 }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <Animated.View
      style={[
        styles.pillWrap,
        focused && styles.pillWrapFocused,
        { transform: [{ translateY: slideAnim }, { scale: scaleAnim }], opacity: opacityAnim },
      ]}>
      <TextInput
        style={styles.pillInput}
        placeholder={placeholder}
        placeholderTextColor={TEAL}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </Animated.View>
  );
}

// ─── Site pill selector ───────────────────────────────────────────────────────
function SitePicker({
  sites,
  selected,
  onSelect,
  disabled,
  delay,
}: {
  sites: string[];
  selected: string;
  onSelect: (s: string) => void;
  disabled: boolean;
  delay: number;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim, gap: 8 }}>
      <Text style={styles.siteLabel}>Select Site</Text>
      <View style={styles.siteRow}>
        {sites.map((s) => {
          const isSelected = selected === s;
          return (
            <Pressable
              key={s}
              onPress={() => onSelect(s)}
              disabled={disabled}>
              <View style={[styles.sitePill, isSelected && styles.sitePillSelected]}>
                <Text style={[styles.sitePillText, isSelected && styles.sitePillTextSelected]}>{s}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
type Screen = 'landing' | 'login' | 'signup';

export default function LoginScreen() {
  const { user, profile, loading } = useAuth();

  const [screen, setScreen] = useState<Screen>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [site, setSite] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [sites, setSites] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageOpacity = useRef(new Animated.Value(0)).current;
  const pageSlide = useRef(new Animated.Value(40)).current;
  const starSpin = useRef(new Animated.Value(0)).current;
  const loginBtnScale = useRef(new Animated.Value(1)).current;
  const signupBtnScale = useRef(new Animated.Value(1)).current;
  const submitBtnScale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    pageOpacity.setValue(0);
    pageSlide.setValue(30);
    Animated.parallel([
      Animated.timing(pageOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pageSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
    Animated.loop(
      Animated.timing(starSpin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => { animateIn(); }, [screen]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (isResidentProfileAdmin(profile)) {
      router.replace('/(admin)/adminDashboard');
    } else {
      router.replace('/(user)/userDashboard');
    }
  }, [loading, user, profile]);

  useEffect(() => {
    getDocs(collection(db, 'sites')).then((snap) => setSites(snap.docs.map((d) => d.id)));
  }, []);

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (screen === 'login') {
        const { error } = await loginResident({ email, password });
        if (error) setError(error);
      } else {
        const { error } = await registerResident({ email, password, name, site, unitNumber });
        if (error) setError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const starRotate = starSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Landing ─────────────────────────────────────────────────────────────
  if (screen === 'landing') {
    return (
      <View style={styles.bg}>
        <Animated.View style={[styles.centerContent, { opacity: pageOpacity, transform: [{ translateY: pageSlide }] }]}>
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={{ width: 230, height: 230, resizeMode: 'contain'}}
              />
            </View>
            <Text style={styles.brandName}>Village Hub</Text>
          </View>

          <View style={styles.landingButtons}>
            <Pressable
              onPressIn={() => pressIn(loginBtnScale)}
              onPressOut={() => pressOut(loginBtnScale)}
              onPress={() => setScreen('login')}>
              <Animated.View style={[styles.whiteBtn, { transform: [{ scale: loginBtnScale }] }]}>
                <Text style={styles.whiteBtnText}>Login</Text>
              </Animated.View>
            </Pressable>

            <Pressable
              onPressIn={() => pressIn(signupBtnScale)}
              onPressOut={() => pressOut(signupBtnScale)}
              onPress={() => setScreen('signup')}>
              <Animated.View style={[styles.tealBtn, { transform: [{ scale: signupBtnScale }] }]}>
                <Text style={styles.tealBtnText}>Sign Up</Text>
              </Animated.View>
            </Pressable>
          </View>

          <Pressable style={styles.guestLink}>
            <Text style={styles.guestText}>Continue as a guest</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ── Login / Signup ──────────────────────────────────────────────────────
  const isLogin = screen === 'login';

  return (
    <View style={styles.bg}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: pageOpacity, transform: [{ translateY: pageSlide }], gap: 16 }}>

          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{isLogin ? 'Welcome,' : 'Create Account'}</Text>
            <Text style={styles.formSub}>{isLogin ? 'Glad to see you!' : 'to get started now!'}</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          )}

          {!isLogin && (
            <>
              <PillInput placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" editable={!submitting} delay={60} />
              <SitePicker sites={sites} selected={site} onSelect={setSite} disabled={submitting} delay={120} />
              <PillInput placeholder="Unit Number" value={unitNumber} onChangeText={setUnitNumber} editable={!submitting} delay={180} />
            </>
          )}

          <PillInput placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!submitting} delay={isLogin ? 80 : 240} />
          <PillInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry editable={!submitting} delay={isLogin ? 140 : 300} />

          {isLogin && (
            <Pressable style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          )}

          <Pressable
            onPressIn={() => pressIn(submitBtnScale)}
            onPressOut={() => pressOut(submitBtnScale)}
            onPress={onSubmit}
            disabled={submitting}>
            <Animated.View style={[styles.whiteBtn, styles.submitBtn, { transform: [{ scale: submitBtnScale }] }]}>
              {submitting
                ? <ActivityIndicator color={TEAL} />
                : <Text style={styles.whiteBtnText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
              }
            </Animated.View>
          </Pressable>

          <Pressable
            style={styles.switchRow}
            onPress={() => { setScreen(isLogin ? 'signup' : 'login'); setError(''); }}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Text style={styles.switchLink}>{isLogin ? 'Sign up Now' : 'Login Now'}</Text>
          </Pressable>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },

  // landing
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 36 },
  logoArea: { alignItems: 'center', gap: 16 },
  logoCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: TEAL, justifyContent: 'center', alignItems: 'center',
  },

  star: { position: 'absolute', top: 8, right: 12, fontSize: 30 },
  brandName: { fontSize: 38, fontWeight: '900', color: DARK_TEAL, letterSpacing: -0.5 },
  landingButtons: { width: '100%', gap: 14 },
  guestLink: { paddingVertical: 8 },
  guestText: { color: TEAL, fontWeight: '700', fontSize: 15 },

  // form
  formScroll: { flexGrow: 1, padding: 28, paddingTop: 64 },
  formHeader: { marginBottom: 8, gap: 4 },
  formTitle: { fontSize: 34, fontWeight: '900', color: DARK_TEAL },
  formSub: { fontSize: 22, fontWeight: '500', color: TEAL },

  // pill input
  pillWrap: {
    backgroundColor: YELLOW, borderRadius: 999,
    paddingHorizontal: 22, paddingVertical: 15,
    borderWidth: 2, borderColor: 'transparent',
  },
  pillWrapFocused: { borderColor: TEAL },
  pillInput: { fontSize: 15, color: DARK_TEAL, fontWeight: '600' },

  // site picker
  siteLabel: { fontWeight: '700', color: DARK_TEAL, fontSize: 13, paddingLeft: 4 },
  siteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sitePill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    backgroundColor: YELLOW, borderWidth: 2, borderColor: 'transparent',
  },
  sitePillSelected: { backgroundColor: TEAL },
  sitePillText: { fontWeight: '700', color: DARK_TEAL, fontSize: 13 },
  sitePillTextSelected: { color: '#fff' },

  // forgot
  forgotRow: { alignItems: 'flex-end', marginTop: -4 },
  forgotText: { color: DARK_TEAL, fontWeight: '500', fontSize: 13 },

  // buttons
  whiteBtn: {
    backgroundColor: '#fff', borderRadius: 999,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  submitBtn: { marginTop: 4 },
  whiteBtnText: { color: DARK_TEAL, fontWeight: '800', fontSize: 17 },
  tealBtn: {
    backgroundColor: TEAL, borderRadius: 999,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  tealBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  // divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: TEAL, opacity: 0.3 },
  dividerText: { color: DARK_TEAL, fontSize: 13, fontWeight: '600' },

  // google
  googleRow: { alignItems: 'center' },
  googleBtn: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  googleG: { fontSize: 24, fontWeight: '900', color: '#4285F4' },

  // switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, flexWrap: 'wrap' },
  switchText: { color: DARK_TEAL, fontSize: 14 },
  switchLink: { color: DARK_TEAL, fontSize: 14, fontWeight: '800' },

  // error
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 14, padding: 12, borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  errorText: { color: '#b91c1c', fontSize: 13 },
});