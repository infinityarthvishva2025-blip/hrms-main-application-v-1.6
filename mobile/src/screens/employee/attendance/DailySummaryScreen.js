/**
 * DailySummaryScreen.js
 * ─────────────────────────────────────────────────────────
 * Shows the daily attendance summary after checkout.
 *
 * Features:
 *  • Auto-fetches today's summary from getMySummary API
 *  • Displays check-in time, check-out time, total hours
 *  • Shows location info and accuracy
 *  • Animated card entrance
 *  • "Done" button to return to attendance screen
 * ─────────────────────────────────────────────────────────
 */
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';

import theme from '../../../constants/theme';
import { useAttendance } from '../../../context/AttendanceContext';
import { useAuth } from '../../../context/AuthContext';

const DailySummaryScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { checkInTime, checkOutTime, fetchDailySummary } = useAttendance();

    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch summary on mount
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            const data = await fetchDailySummary();
            if (mounted) {
                setSummaryData(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [fetchDailySummary]);

    // ── Helpers ──
    const formatTime = (date) => {
        if (!date) return '--:--';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeString = (timeStr) => {
        if (!timeStr) return '--:--';
        // Handle "HH:mm:ss" format
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            const h = parseInt(parts[0], 10);
            const m = parts[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
            return `${displayH}:${m} ${ampm}`;
        }
        return timeStr;
    };

    const getWorkedHours = () => {
        // From server data
        if (summaryData?.workingHours && summaryData.workingHours !== '--') {
            return summaryData.workingHours;
        }
        // From local data
        if (checkInTime && checkOutTime) {
            const diffMs = checkOutTime.getTime() - checkInTime.getTime();
            const totalSeconds = Math.floor(diffMs / 1000);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            return `${h}h ${m}m`;
        }
        return '--';
    };

    const getCurrentDate = () =>
        new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

    const handleDone = () => {
        // Go back to MarkAttendance — using popToTop to clear DailyReportForm from stack
        if (navigation.canGoBack()) {
            navigation.popToTop();
        } else {
            navigation.navigate('MarkAttendance');
        }
    };

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={[theme.colors.success, '#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerContent}>
                    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                        <View style={styles.headerIconWrap}>
                            <Ionicons name="checkmark-circle" size={48} color="#FFF" />
                        </View>
                    </Animated.View>
                    <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                        <Text style={styles.headerTitle}>Day Complete! 🎉</Text>
                        <Text style={styles.headerSub}>
                            {user?.name || user?.employeeName} • {getCurrentDate()}
                        </Text>
                    </Animated.View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Fetching today's summary...</Text>
                    </View>
                ) : (
                    <>
                        {/* ═══════════════════════════════════════
                WORKED HOURS — Hero Section
            ═══════════════════════════════════════ */}
                        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
                            <View style={styles.heroCard}>
                                <LinearGradient
                                    colors={theme.colors.gradientPrimary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.heroGradient}
                                >
                                    <Text style={styles.heroLabel}>Total Worked</Text>
                                    <Text style={styles.heroValue}>{getWorkedHours()}</Text>
                                    <Text style={styles.heroSub}>
                                        {summaryData?.status
                                            ? `Status: ${summaryData.status}`
                                            : 'Shift completed'}
                                    </Text>
                                </LinearGradient>
                            </View>
                        </Animated.View>

                        {/* ═══════════════════════════════════════
                TIME DETAILS
            ═══════════════════════════════════════ */}
                        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                            <View style={styles.detailCard}>
                                <Text style={styles.sectionTitle}>Time Details</Text>
                                <View style={styles.divider} />

                                <View style={styles.timeRow}>
                                    <View style={styles.timeItem}>
                                        <View style={[styles.timeIcon, { backgroundColor: '#DEF7EC' }]}>
                                            <Ionicons name="log-in" size={20} color={theme.colors.success} />
                                        </View>
                                        <View>
                                            <Text style={styles.timeLabel}>Check-In</Text>
                                            <Text style={styles.timeValue}>
                                                {summaryData?.inTime
                                                    ? formatTimeString(summaryData.inTime)
                                                    : formatTime(checkInTime)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.timeConnector}>
                                        <View style={styles.connectorLine} />
                                        <Ionicons name="arrow-forward" size={16} color={theme.colors.textTertiary} />
                                        <View style={styles.connectorLine} />
                                    </View>

                                    <View style={styles.timeItem}>
                                        <View style={[styles.timeIcon, { backgroundColor: '#FDE8E8' }]}>
                                            <Ionicons name="log-out" size={20} color={theme.colors.error} />
                                        </View>
                                        <View>
                                            <Text style={styles.timeLabel}>Check-Out</Text>
                                            <Text style={styles.timeValue}>
                                                {summaryData?.outTime
                                                    ? formatTimeString(summaryData.outTime)
                                                    : formatTime(checkOutTime)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>

                        {/* ═══════════════════════════════════════
                STATUS INFO
            ═══════════════════════════════════════ */}
                        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
                            <View style={styles.detailCard}>
                                <Text style={styles.sectionTitle}>Attendance Info</Text>
                                <View style={styles.divider} />

                                <View style={styles.infoGrid}>
                                    <InfoItem
                                        icon="calendar"
                                        iconColor={theme.colors.primary}
                                        label="Date"
                                        value={new Date().toLocaleDateString('en-US', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    />
                                    <InfoItem
                                        icon="shield-checkmark"
                                        iconColor={theme.colors.success}
                                        label="Status"
                                        value={summaryData?.status || 'Present'}
                                    />
                                    <InfoItem
                                        icon="time"
                                        iconColor={theme.colors.warning}
                                        label="Shift"
                                        value={new Date().getDay() === 6 ? '7 hrs (Sat)' : '8.5 hrs'}
                                    />
                                    <InfoItem
                                        icon="hourglass"
                                        iconColor={theme.colors.accent}
                                        label="Duration"
                                        value={summaryData?.workingHours || getWorkedHours()}
                                    />
                                </View>
                            </View>
                        </Animated.View>

                        {/* ═══════════════════════════════════════
                DONE BUTTON
            ═══════════════════════════════════════ */}
                        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                            <TouchableOpacity
                                onPress={handleDone}
                                activeOpacity={0.8}
                                style={styles.doneButtonWrapper}
                            >
                                <LinearGradient
                                    colors={theme.colors.gradientPrimary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.doneGradient}
                                >
                                    <Ionicons name="checkmark-done" size={20} color="#FFF" />
                                    <Text style={styles.doneText}>Done</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
};

// ── Info Item Sub-component ──
const InfoItem = ({ icon, iconColor, label, value }) => (
    <View style={styles.infoItem}>
        <View style={[styles.infoIconWrap, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Header
    headerGradient: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '600',
    },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: {
        padding: 16,
        paddingTop: 24,
        paddingBottom: 40,
    },

    // Loading
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
        fontWeight: '600',
    },

    // Hero Card
    heroCard: {
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    heroGradient: {
        padding: 32,
        alignItems: 'center',
    },
    heroLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroValue: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFF',
        marginVertical: 12,
        fontVariant: ['tabular-nums'],
        letterSpacing: -1,
    },
    heroSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '700',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 100,
    },

    // Detail Cards
    detailCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1.5,
        backgroundColor: '#F8FAFC',
        marginBottom: 20,
    },

    // Time Row
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeItem: {
        alignItems: 'center',
        flex: 1,
    },
    timeIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    timeLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '800',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    timeConnector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 24,
    },
    connectorLine: {
        width: 20,
        height: 1.5,
        backgroundColor: '#F1F5F9',
    },

    // Info Grid
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    infoItem: {
        width: '47%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },

    // Done Button
    doneButtonWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 12,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    doneGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
    },
    doneText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default DailySummaryScreen;
