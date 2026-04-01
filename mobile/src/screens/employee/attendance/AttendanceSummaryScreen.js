/**
 * AttendanceSummaryScreen.js
 * Premium attendance history screen with redesigned UI.
 * All original functionality preserved.
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AttendanceTable from '../../../components/common/AttendanceTable';
import DatePickerInput from '../../../components/common/DatePickerInput';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import AttendanceService from '../../../services/AttendanceService';

const formatDateToString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const AttendanceSummaryScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);

    const [fromDate, setFromDate] = useState(
        formatDateToString(new Date(Date.now() - 30 * 86400000)),
    );
    const [toDate, setToDate] = useState(formatDateToString(new Date()));

    // Quick stats
    // const stats = useMemo(() => {
    //     if (!attendanceData.length) return { total: 0, present: 0, absent: 0, late: 0 };
    //     const present = attendanceData.filter(
    //         (r) => r.status?.toLowerCase() === 'present' || r.status?.toLowerCase() === 'p',
    //     ).length;
    //     const absent = attendanceData.filter(
    //         (r) => r.status?.toLowerCase() === 'absent' || r.status?.toLowerCase() === 'a',
    //     ).length;
    //     const late = attendanceData.filter(
    //         (r) => r.status?.toLowerCase() === 'late' || r.status?.toLowerCase() === 'l',
    //     ).length;
    //     return { total: attendanceData.length, present, absent, late };
    // }, [attendanceData]);

    const fetchAttendanceSummary = useCallback(
        async (isRefresh = false) => {
            if (!isRefresh) setLoading(true);
            try {
                if (!fromDate || !toDate) {
                    Alert.alert('Validation', 'Please select both from and to dates');
                    return;
                }
                if (new Date(fromDate) > new Date(toDate)) {
                    Alert.alert('Validation', 'From date cannot be after To date');
                    return;
                }

                const data = await AttendanceService.getMySummary({
                    fromDate,
                    toDate,
                });

                setAttendanceData(data?.records || []);
            } catch (error) {
                console.error('Fetch summary error:', error);
                Alert.alert(
                    'Error',
                    error.response?.data?.message || 'Failed to fetch attendance summary',
                );
                setAttendanceData([]);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [fromDate, toDate],
    );

    useFocusEffect(
        useCallback(() => {
            fetchAttendanceSummary();
        }, [fetchAttendanceSummary]),
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendanceSummary(true);
    };

    const handleCorrectionRequest = (record) => {
        if (!record.token) {
            Alert.alert('Not Allowed', 'Correction request is not available for this record');
            return;
        }
        if (record.correctionStatus === 'Pending') {
            Alert.alert('Already Requested', 'A correction request is already pending for this record');
            return;
        }
        if (record.correctionStatus === 'Approved') {
            Alert.alert('Already Approved', 'Correction has already been approved for this record');
            return;
        }
        if (record.status === 'A' || record.status === 'WO') {
            Alert.alert('Cannot request', `You were ${record.status === 'A' ? 'absent' : 'on a weekly off'}`);
            return;
        }
        navigation.navigate('Regularization', { attendanceRecord: record });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={theme.colors.gradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.headerTitle}>Attendance History</Text>
                        <Text style={styles.headerSub}>
                            {user?.employeeName || 'Employee'} • {user?.employeeCode || ''}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                        <Ionicons name="refresh" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Bar
                <View style={styles.statsBar}>
                    <StatPill label="Total" value={stats.total} color="#FFF" />
                    <View style={styles.statDivider} />
                    <StatPill label="Present" value={stats.present} color="#6EE7B7" />
                    <View style={styles.statDivider} />
                    <StatPill label="Absent" value={stats.absent} color="#FCA5A5" />
                    <View style={styles.statDivider} />
                    <StatPill label="Late" value={stats.late} color="#FDE68A" />
                </View> */}
            </LinearGradient>

            <View style={styles.contentWrapper}>
                <View style={[styles.filterCard, theme.shadow.medium]}>
                    {/* <View style={styles.filterHeader}>
                        <View style={styles.filterIconWrap}>
                            <Ionicons name="funnel" size={16} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.filterTitle}>Date Range</Text>
                    </View> */}

                    <View style={styles.filterRow}>
                        <View style={styles.dateInputWrap}>
                            <DatePickerInput
                                label="From"
                                value={fromDate}
                                onChange={setFromDate}
                                maximumDate={new Date()}
                            />
                        </View>
                        <View style={styles.filterArrow}>
                            <Ionicons name="arrow-forward" size={14} color={theme.colors.textTertiary} />
                        </View>
                        <View style={styles.dateInputWrap}>
                            <DatePickerInput
                                label="To"
                                value={toDate}
                                onChange={setToDate}
                                maximumDate={new Date()}
                            />
                        </View>
                    </View>
{/* 
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => fetchAttendanceSummary()}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.applyGradient}
                        >
                            <Ionicons name="search" size={16} color="#FFF" />
                            <Text style={styles.applyText}>Apply</Text>
                        </LinearGradient>
                    </TouchableOpacity> */}
                </View>

                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary]}
                            tintColor={theme.colors.primary}
                        />
                    }
                >
                    {loading && !refreshing ? (
                        <View style={styles.loaderWrap}>
                            <View style={styles.loaderCircle}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                            <Text style={styles.loaderText}>Syncing records…</Text>
                            <Text style={styles.loaderSub}>Fetching your attendance data</Text>
                        </View>
                    ) : attendanceData.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons name="calendar-clear" size={40} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Records Found</Text>
                            <Text style={styles.emptySub}>
                                No attendance logs for the selected date range. Try adjusting the filter above.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.tableWrap}>
                            <View style={styles.recordCountRow}>
                                <Ionicons name="list" size={14} color={theme.colors.textSecondary} />
                                <Text style={styles.recordCountText}>
                                    {attendanceData.length} record{attendanceData.length !== 1 ? 's' : ''} found
                                </Text>
                            </View>
                            <AttendanceTable
                                data={attendanceData}
                                onRequestCorrection={handleCorrectionRequest}
                            />
                        </View>
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </View>
    );
};

const StatPill = ({ label, value, color }) => (
    <View style={styles.statPill}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        fontWeight: '500',
    },
    refreshBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statPill: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    contentWrapper: {
        flex: 1,
        marginTop: -45,
        paddingHorizontal: 10,
    },
    filterCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 5,
        marginBottom: 1-0,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 5,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    filterIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: 0.3,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dateInputWrap: {
        flex: 1,
    },
    filterArrow: {
        paddingHorizontal: 10,
    },
    applyButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    applyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    applyText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    tableWrap: {
        flex: 1,
    },
    recordCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 6,
    },
    recordCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 0.3,
    },
    loaderWrap: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loaderCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    loaderSub: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 6,
        fontWeight: '500',
    },
    emptyWrap: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 22,
        fontWeight: '500',
    },
});

export default AttendanceSummaryScreen;