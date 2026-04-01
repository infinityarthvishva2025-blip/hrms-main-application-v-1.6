import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Keyboard,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import GradientButton from '../../../components/common/GradientButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = () => {
    const { login, resetPassword } = useAuth();

    // Refs for proper keyboard focus chaining — prevents focus jumping
    const employeeInputRef = useRef(null);
    const passwordInputRef = useRef(null);

    // ── Login Form State ──────────────────────────────────────────────────────
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Active field for border highlight (does NOT cause layout shifts)
    const [focusedField, setFocusedField] = useState(null); // 'employee' | 'password' | null

    // ── Suggestion State ──────────────────────────────────────────────────────
    const [storedCode, setStoredCode] = useState('');
    const [showSuggestion, setShowSuggestion] = useState(false);

    // ── Forgot Password Modal State ───────────────────────────────────────────
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [forgotEmpCode, setForgotEmpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showForgotPasswords, setShowForgotPasswords] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    // Load stored employee code on mount
    useEffect(() => {
        const loadStoredCode = async () => {
            try {
                const code = await AsyncStorage.getItem('lastEmployeeCode');
                if (code) setStoredCode(code);
            } catch (e) {
                console.log('Failed to load stored code', e);
            }
        };
        loadStoredCode();
    }, []);

    // Pre-fill forgot password field with current userId when modal opens
    useEffect(() => {
        if (forgotModalVisible) {
            setForgotEmpCode(userId || storedCode);
        }
    }, [forgotModalVisible, userId, storedCode]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleLogin = useCallback(async () => {
        Keyboard.dismiss();
        setError('');

        if (!userId.trim() || !password) {
            setError('Please enter both Employee Code and Password');
            return;
        }

        setLoading(true);
        try {
            const result = await login(userId.trim(), password);
            if (result.success) {
                await AsyncStorage.setItem('lastEmployeeCode', userId.trim());
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId, password, login]);

    const handleForgotPassword = useCallback(async () => {
        setForgotError('');
        setForgotSuccess('');

        if (!forgotEmpCode.trim() || !newPassword || !confirmPassword) {
            setForgotError('All fields are required');
            return;
        }
        if (newPassword !== confirmPassword) {
            setForgotError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setForgotError('Password must be at least 6 characters');
            return;
        }

        setForgotLoading(true);
        try {
            const result = await resetPassword(forgotEmpCode.trim(), newPassword, confirmPassword);
            if (result.success) {
                setForgotSuccess('Password reset successfully!');
                setTimeout(() => closeForgotModal(), 1000);
            } else {
                setForgotError(result.message || 'Failed to reset password');
            }
        } catch (err) {
            setForgotError('An unexpected error occurred. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    }, [forgotEmpCode, newPassword, confirmPassword, resetPassword]);

    const closeForgotModal = useCallback(() => {
        setForgotModalVisible(false);
        setForgotEmpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotError('');
        setForgotSuccess('');
    }, []);

    const openForgotModal = useCallback(() => setForgotModalVisible(true), []);

    // FIX: use a delayed blur so any tap on the suggestion chip registers first
    const handleBlurEmployee = () => {
        setFocusedField(null);
        setTimeout(() => setShowSuggestion(false), 150);
    };

    const handleFocusEmployee = () => {
        setFocusedField('employee');
        if (storedCode && !userId) setShowSuggestion(true);
    };

    const handleChangeEmployee = (text) => {
        setUserId(text);
        if (text) setShowSuggestion(false);
    };

    const handleSuggestionPress = () => {
        setUserId(storedCode);
        setShowSuggestion(false);
        // Move straight to password after filling suggestion
        setTimeout(() => passwordInputRef.current?.focus(), 50);
    };

    // Derived — used for styling only, not for re-mounting elements
    const isEmployeeActive = focusedField === 'employee' || !!userId;
    const isPasswordActive = focusedField === 'password' || !!password;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#EBF3FD', '#F0F7FF', '#FFFFFF']}
                locations={[0, 0.45, 1]}
                style={styles.backgroundGradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../../assets/images/infinity-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.appName}>Infinity HRMS</Text>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.welcomeSubtext}>Sign in to your workspace</Text>
                    </View>

                    {/* ── Card ── */}
                    <View style={styles.content}>
                        <View style={styles.card}>

                            {/* Error Banner */}
                            {error ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={18} color="#E11D48" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Employee Code */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMPLOYEE CODE</Text>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={[styles.inputWrapper, isEmployeeActive && styles.inputActive]}
                                    onPress={() => employeeInputRef.current?.focus()}
                                >
                                    <Ionicons
                                        name="person-circle-outline"
                                        size={22}
                                        color={isEmployeeActive ? theme.colors.primary : '#94A3B8'}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        ref={employeeInputRef}
                                        style={styles.input}
                                        placeholder="e.g. IA000**"
                                        value={userId}
                                        onChangeText={handleChangeEmployee}
                                        onFocus={handleFocusEmployee}
                                        onBlur={handleBlurEmployee}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                        blurOnSubmit={false}
                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                        placeholderTextColor="#C0CCDA"
                                    />
                                </TouchableOpacity>
                                {showSuggestion && storedCode ? (
                                    <TouchableOpacity style={styles.suggestionChip} onPress={handleSuggestionPress}>
                                        <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
                                        <Text style={styles.suggestionText}>Use: {storedCode}</Text>
                                        <Ionicons name="arrow-forward-outline" size={13} color={theme.colors.primary} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <TouchableOpacity onPress={openForgotModal}>
                                        <Text style={styles.forgotPassLink}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={[styles.inputWrapper, isPasswordActive && styles.inputActive]}
                                    onPress={() => passwordInputRef.current?.focus()}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={22}
                                        color={isPasswordActive ? theme.colors.primary : '#94A3B8'}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        ref={passwordInputRef}
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        secureTextEntry={!showPassword}
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                        placeholderTextColor="#C0CCDA"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(v => !v)}
                                        style={styles.eyeButton}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={22}
                                            color={isPasswordActive ? theme.colors.primary : '#94A3B8'}
                                        />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            </View>

                            {/* CTA */}
                            <GradientButton
                                title="Secure Login"
                                onPress={handleLogin}
                                disabled={loading}
                                loading={loading}
                                style={styles.loginButton}
                                textStyle={styles.loginButtonText}
                                icon={!loading && <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />}
                            />

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>SECURED ACCESS</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>

                        <Text style={styles.copyright}>
                            Designed & Secured by Infinity HRMS{'\n'}© 2026 Core Workforce Systems
                        </Text>
                    </View>
                </ScrollView>
            </LinearGradient>

            {/* ── Forgot Password Modal ── */}
            <Modal
                visible={forgotModalVisible}
                animationType="none"
                transparent={true}
                statusBarTranslucent={true}
                onRequestClose={closeForgotModal}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalKAV}>
                    <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={closeForgotModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.dragHandle} />

                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Reset Password</Text>
                                <Text style={styles.modalSubtitle}>Enter your details to set a new password</Text>
                            </View>
                            <TouchableOpacity onPress={closeForgotModal} style={styles.closeButton}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            {forgotError ? (
                                <View style={styles.modalErrorContainer}>
                                    <Ionicons name="alert-circle" size={16} color="#E11D48" />
                                    <Text style={styles.modalErrorText}>{forgotError}</Text>
                                </View>
                            ) : null}

                            {forgotSuccess ? (
                                <View style={styles.modalSuccessContainer}>
                                    <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                                    <Text style={styles.modalSuccessText}>{forgotSuccess}</Text>
                                </View>
                            ) : null}

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Employee Code</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="id-card-outline" size={16} color={theme.colors.primary} style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. IA00087"
                                        value={forgotEmpCode}
                                        onChangeText={setForgotEmpCode}
                                        autoCapitalize="characters"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>New Password</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primary} style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showForgotPasswords}
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Confirm Password</Text>
                                <View style={styles.modalInputWrapper}>
                                    <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.primary} style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showForgotPasswords}
                                        placeholderTextColor="#94A3B8"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowForgotPasswords(v => !v)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={showForgotPasswords ? 'eye-outline' : 'eye-off-outline'}
                                            size={18}
                                            color="#94A3B8"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.modalActionRow}>
                                <TouchableOpacity onPress={closeForgotModal} style={styles.modalCancelButton}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <GradientButton
                                    title={forgotLoading ? 'Processing...' : 'Update Password'}
                                    onPress={handleForgotPassword}
                                    disabled={forgotLoading || !!forgotSuccess}
                                    loading={forgotLoading}
                                    style={styles.modalSubmitButton}
                                />
                            </View>
                            <View style={{ height: Platform.OS === 'ios' ? 24 : 16 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EBF3FD',
    },
    backgroundGradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 80 : 48,
        paddingBottom: 32,
    },
    logoContainer: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // NO elevation — Android elevation causes Z-order stacking that blocks input taps below
    },
    logo: {
        width: 72,
        height: 72,
    },
    appName: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -1,
        marginBottom: 6,
    },
    welcomeSubtext: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
    },

    // ── Content & Card ────────────────────────────────────────────────────────
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 28,
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#E8F0FB',
    },

    // ── Error ─────────────────────────────────────────────────────────────────
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF1F2',
        padding: 14,
        borderRadius: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FFE4E6',
        gap: 10,
    },
    errorText: {
        flex: 1,
        color: '#E11D48',
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Input ─────────────────────────────────────────────────────────────────
    inputGroup: {
        marginBottom: 22,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    forgotPassLink: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 58,
        borderWidth: 1.5,
        borderColor: '#E8EFF8',
    },
    inputActive: {
        borderColor: theme.colors.primary,
        backgroundColor: '#FFFFFF',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 12,
    },
    eyeButton: {
        padding: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '600',
    },

    // ── Suggestion Chip ───────────────────────────────────────────────────────
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
        gap: 6,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    suggestionText: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '700',
    },

    // ── Login Button ──────────────────────────────────────────────────────────
    loginButton: {
        marginTop: 8,
        borderRadius: 16,
        height: 58,
    },
    loginButtonText: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.4,
    },

    // ── Divider ───────────────────────────────────────────────────────────────
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 36,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#EDF2F7',
    },
    dividerText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '800',
        textTransform: 'uppercase',
        marginHorizontal: 14,
        letterSpacing: 1.8,
    },

    // ── Copyright ─────────────────────────────────────────────────────────────
    copyright: {
        textAlign: 'center',
        marginTop: 36,
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 20,
        fontWeight: '500',
    },

    // ── Modal ─────────────────────────────────────────────────────────────────
    modalKAV: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        justifyContent: 'flex-end',
    },
    modalDismissArea: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        maxHeight: SCREEN_HEIGHT * 0.85,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 25,
    },
    dragHandle: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    closeButton: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 8,
    },
    modalErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF1F2',
        padding: 14,
        borderRadius: 14,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#FFE4E6',
    },
    modalErrorText: {
        flex: 1,
        color: '#E11D48',
        fontSize: 14,
        fontWeight: '600',
    },
    modalSuccessContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 14,
        borderRadius: 14,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    modalSuccessText: {
        flex: 1,
        color: '#15803D',
        fontSize: 14,
        fontWeight: '600',
    },
    modalInputGroup: {
        marginBottom: 18,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 54,
        borderWidth: 1.5,
        borderColor: '#E8EFF8',
    },
    modalInputIcon: {
        marginRight: 12,
    },
    modalInput: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '600',
    },
    modalActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
    },
    modalCancelButton: {
        flex: 1,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
    },
    modalCancelText: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '700',
    },
    modalSubmitButton: {
        flex: 2,
        height: 54,
        borderRadius: 16,
    },
});

export default LoginScreen;