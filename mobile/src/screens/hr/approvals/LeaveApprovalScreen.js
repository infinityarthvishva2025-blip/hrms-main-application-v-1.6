import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import LeaveService from '../../../services/LeaveService';
import StatusBadge from '../../../components/common/StatusBadge';

const LeaveApprovalScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // ID of item being processed

    const fetchLeaves = useCallback(async () => {
        try {
            const data = await LeaveService.getPendingLeaves();
            setLeaves(data);
        } catch (error) {
            console.error('Fetch pending leaves error:', error);
            Alert.alert('Error', 'Failed to fetch pending leaves.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaves();
    }, [fetchLeaves]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaves();
    };

    const handleAction = async (id, approve) => {
        setActionLoading(id);
        try {
            await LeaveService.approveLeave(id, approve);
            Alert.alert('Success', `Leave ${approve ? 'Approved' : 'Rejected'} Successfully`);
            // Remove from list
            setLeaves(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error('Leave action error:', error);
            Alert.alert('Error', `Failed to ${approve ? 'approve' : 'reject'} leave.`);
        } finally {
            setActionLoading(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.empName}>{item.employee?.name || 'Unknown Employee'}</Text>
                    <Text style={styles.empCode}>{item.employee?.employeeCode || 'N/A'}</Text>
                </View>
                <View style={styles.daysBadge}>
                    <Text style={styles.daysText}>{item.totalDays} Days</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Type</Text>
                    <Text style={styles.value}>{item.leaveType || item.category}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>From</Text>
                    <Text style={styles.value}>{new Date(item.startDate).toLocaleDateString()}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>To</Text>
                    <Text style={styles.value}>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</Text>
                </View>
            </View>

            {item.reason && (
                <View style={styles.reasonBox}>
                    <Text style={styles.label}>Reason</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
            )}

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectBtn]}
                    onPress={() => handleAction(item.id, false)}
                    disabled={actionLoading === item.id}
                >
                    {actionLoading === item.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Reject</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.approveBtn]}
                    onPress={() => handleAction(item.id, true)}
                    disabled={actionLoading === item.id}
                >
                    {actionLoading === item.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Approve</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Leave Approvals</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={leaves}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No pending leave requests.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
        ...theme.typography.h5,
        color: theme.colors.primary,
        textAlign: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        marginBottom: 16,
        ...theme.shadow.light,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    empName: {
        ...theme.typography.h4,
        fontSize: 16,
        fontWeight: '700',
    },
    empCode: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    daysBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    daysText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoBox: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    reasonBox: {
        backgroundColor: theme.colors.background,
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
    },
    reasonText: {
        fontSize: 14,
        color: theme.colors.text,
        fontStyle: 'italic',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveBtn: {
        backgroundColor: theme.colors.success,
    },
    rejectBtn: {
        backgroundColor: theme.colors.error,
    },
    btnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    }
});

export default LeaveApprovalScreen;
