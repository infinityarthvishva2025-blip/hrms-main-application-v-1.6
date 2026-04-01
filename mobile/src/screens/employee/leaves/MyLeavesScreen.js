/**
 * MyLeavesScreen.js
 * ─────────────────────────────────────────────
 * Premium leave history screen with gradient header,
 * summary stats, and rich leave cards.
 *
 * All existing functionality preserved:
 *  • FlatList with leave cards
 *  • Cancel pending leave with confirmation
 *  • StatusBadge per card
 *  • Pull-to-refresh
 *  • useFocusEffect auto-fetch
 *  • Empty state with "Apply Now" button
 * ─────────────────────────────────────────────
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../../constants/theme';
import LeaveService from '../../../services/employee/leaveService';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/common/StatusBadge';

const MyLeavesScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // ── State ──
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [leaves, setLeaves] = useState([]);

    // ── Fetch on focus (existing logic) ──
    useFocusEffect(
        useCallback(() => {
            fetchMyLeaves();
        }, [])
    );

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const data = await LeaveService.getMyLeaves();
            setLeaves(data || []);
        } catch (error) {
            console.error('Fetch leaves error:', error);
            Alert.alert('Error', 'Failed to fetch leaves');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMyLeaves();
    };

    // ── Cancel leave (existing logic) ──
    const handleCancelLeave = (leaveId, status) => {
        if (status !== 'Pending') {
            Alert.alert('Info', 'Only pending leaves can be cancelled');
            return;
        }

        Alert.alert(
            'Cancel Leave',
            'Are you sure you want to cancel this leave request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await LeaveService.cancelLeave(leaveId);
                            Alert.alert('Success', 'Leave cancelled successfully');
                            fetchMyLeaves();
                        } catch (error) {
                            console.error('Cancel leave error:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel leave');
                        }
                    }
                }
            ]
        );
    };

    // ── Quick Stats ──
    const stats = useMemo(() => {
        const pending = leaves.filter(l => l.overallStatus === 'Pending').length;
        const approved = leaves.filter(l => l.overallStatus === 'Approved').length;
        const rejected = leaves.filter(l => l.overallStatus === 'Rejected').length;
        return { total: leaves.length, pending, approved, rejected };
    }, [leaves]);

    // ── Render Leave Card ──
    const renderLeaveItem = ({ item }) => {
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        const isPending = item.overallStatus === 'Pending';

        // Left date accent color based on status
        const accentColor =
            item.overallStatus === 'Approved' ? theme.colors.success :
                item.overallStatus === 'Rejected' ? theme.colors.error :
                    theme.colors.warning;

        return (
            <View style={styles.leaveCard}>
                {/* Status accent strip */}
                <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

                <View style={styles.cardBody}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.dateContainer}>
                            <View style={[styles.iconBox, { backgroundColor: `${accentColor}14` }]}>
                                <Ionicons name="calendar" size={20} color={accentColor} />
                            </View>
                            <View>
                                <Text style={styles.dateText}>
                                    {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    {startDate.getTime() !== endDate.getTime() && ` - ${endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                                </Text>
                                <Text style={styles.yearText}>{startDate.getFullYear()}</Text>
                            </View>
                        </View>
                        <StatusBadge status={item.overallStatus} />
                    </View>

                    <View style={styles.divider} />

                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Type</Text>
                            <Text style={styles.detailValue}>
                                {item.category === 0 ? 'Full Day' : item.category === 1 ? 'Half Day' : item.category === 2 ? 'Early Going' : 'Late Coming'}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Duration</Text>
                            <Text style={styles.detailValue}>{item.totalDays} Day{item.totalDays !== 1 ? 's' : ''}</Text>
                        </View>
                    </View>

                    {/* Reason */}
                    <View style={styles.reasonRow}>
                        <Text style={styles.detailLabel}>Reason</Text>
                        <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
                    </View>

                    {/* Cancel Button */}
                    {isPending && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelLeave(item.id, item.overallStatus)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close-circle-outline" size={16} color={theme.colors.error} />
                            <Text style={styles.cancelButtonText}>Cancel Request</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    // ── Empty State ──
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name="calendar-outline" size={44} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Leave History</Text>
            <Text style={styles.emptySub}>You haven't applied for any leaves yet.</Text>
            <TouchableOpacity
                style={styles.applyButton}
                onPress={() => navigation.navigate('ApplyLeave')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={theme.colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.applyBtnGradient}
                >
                    <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    // ── Main Render ──
    return (
        <View style={styles.container}>
            {/* ══ Gradient Header ══ */}
            <LinearGradient
                colors={theme.colors.gradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.headerTitle}>My Leaves</Text>
                        <Text style={styles.headerSub}>Track your leave history</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ApplyLeave')}
                        style={styles.addBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsBar}>
                    <StatPill label="Total" value={stats.total} color="#FFF" />
                    <View style={styles.statDivider} />
                    <StatPill label="Pending" value={stats.pending} color="#FDE68A" />
                    <View style={styles.statDivider} />
                    <StatPill label="Approved" value={stats.approved} color="#6EE7B7" />
                    <View style={styles.statDivider} />
                    <StatPill label="Rejected" value={stats.rejected} color="#FCA5A5" />
                </View>
            </LinearGradient>

            {/* ══ Content ══ */}
            {loading && !refreshing ? (
                <View style={styles.loaderWrap}>
                    <View style={styles.loaderCircle}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                    <Text style={styles.loaderText}>Loading your leaves…</Text>
                </View>
            ) : (
                <FlatList
                    data={leaves}
                    renderItem={renderLeaveItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.colors.primary]}
                            tintColor={theme.colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
};

// ── Stat Pill Component ──
const StatPill = ({ label, value, color }) => (
    <View style={styles.statPill}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // ── Header ──
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
        marginLeft: 14,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
        fontWeight: '500',
    },
    addBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Stats Bar ──
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statPill: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },

    // ── Loading ──
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${theme.colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },

    // ── List ──
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },

    // ── Leave Card ──
    leaveCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 18,
        marginBottom: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.light,
    },
    cardAccent: {
        width: 4,
    },
    cardBody: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    yearText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 1,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 13,
        color: theme.colors.text,
        fontWeight: '600',
    },
    reasonRow: {
        marginTop: 4,
    },
    reasonText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '400',
        lineHeight: 18,
        marginTop: 2,
    },
    cancelButton: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        gap: 6,
    },
    cancelButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.error,
    },

    // ── Empty State ──
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 13,
        color: theme.colors.textTertiary,
        marginBottom: 24,
        textAlign: 'center',
    },
    applyButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    applyBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
    },
    applyButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default MyLeavesScreen;
