import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';
import StatusBadge from './StatusBadge';

const AttendanceTable = ({ data, onRequestCorrection, isHrView = false }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        return `${day} ${month}`; // e.g., "24 Mar"
    };

    const formatTime = (timeString) => {
        if (!timeString) return '—';
        if (timeString.length === 5 && timeString.includes(':')) return timeString;
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString;
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const formatWorkingHours = (hours) => {
        if (!hours) return '—';
        if (typeof hours === 'number') return `${hours.toFixed(1)}h`;
        return hours;
    };

    const renderCorrectionColumn = (item) => {
        if (item.correctionStatus === 'Pending') {
            return (
                <View style={[styles.correctionBadge, styles.pendingBadge]}>
                    <Ionicons name="time-outline" size={14} color="#FFF" />
                    <Text style={styles.badgeText}>Pending</Text>
                </View>
            );
        }
        if (item.correctionStatus === 'Approved') {
            return (
                <View style={[styles.correctionBadge, styles.approvedBadge]}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                    <Text style={styles.badgeText}>Approved</Text>
                </View>
            );
        }
        if (item.correctionStatus === 'Rejected') {
            return (
                <View style={[styles.correctionBadge, styles.rejectedBadge]}>
                    <Ionicons name="close-circle" size={14} color="#FFF" />
                    <Text style={styles.badgeText}>Rejected</Text>
                </View>
            );
        }
        if (isHrView) {
            return <Text style={styles.cellText}>—</Text>;
        }
        if (item.token) {
            return (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onRequestCorrection(item)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={14} color="#FFF" />
                    <Text style={styles.actionButtonText}>Request</Text>
                </TouchableOpacity>
            );
        }
        return <Text style={[styles.cellText, styles.naText]}>N/A</Text>;
    };

    const renderHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>Date</Text>
            <Text style={[styles.columnHeader, { flex: 1.4 }]}>Time (In-Out)</Text>
            <Text style={[styles.columnHeader, { flex: 0.7 }]}>Hours</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>Status</Text>
            <Text style={[styles.columnHeader, { flex: 1.1, textAlign: 'center' }]}>
                {isHrView ? 'Correction' : 'Action'}
            </Text>
        </View>
    );

    const renderRow = (item, index) => {
        const isAlternate = index % 2 === 1;
        return (
            <View key={index} style={[styles.tableRow, isAlternate && styles.tableRowAlt]}>
                <Text style={[styles.cellText, styles.dateCell, { flex: 1.2 }]}>
                    {formatDate(item.date)}
                </Text>
                <View style={[styles.timeCell, { flex: 1.4 }]}>
                    <Text style={styles.inTime}>
                        <Ionicons name="arrow-up" size={12} color={theme.colors.success} /> {formatTime(item.inTime)}
                    </Text>
                    <Text style={styles.outTime}>
                        <Ionicons name="arrow-down" size={12} color={theme.colors.error} /> {formatTime(item.outTime)}
                    </Text>
                </View>
                <Text style={[styles.cellText, styles.hoursCell, { flex: 0.7 }]}>
                    {formatWorkingHours(item.workingHours)}
                </Text>
                <View style={{ flex: 1 }}>
                    <StatusBadge
                        status={item.status}
                        style={styles.statusBadge}
                        textStyle={styles.statusText}
                    />
                </View>
                <View style={{ flex: 1.1, alignItems: 'center' }}>
                    {renderCorrectionColumn(item)}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderHeader()}
            <View style={styles.tableBody}>
                {data.length > 0 ? (
                    data.map((item, index) => renderRow(item, index))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={48} color={theme.colors.textTertiary} />
                        <Text style={styles.emptyText}>No attendance records</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        ...theme.shadow.medium,
        marginVertical: 8,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    columnHeader: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    tableBody: {
        width: '100%',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: theme.colors.surfaceAlt || '#F8FAFC',
    },
    cellText: {
        fontSize: 12,
        color: theme.colors.text,
        fontWeight: '400',
    },
    dateCell: {
        fontWeight: '600',
        color: '#1E293B',
    },
    timeCell: {
        justifyContent: 'center',
    },
    inTime: {
        fontSize: 12,
        color: theme.colors.success,
        fontWeight: '500',
        marginBottom: 2,
    },
    outTime: {
        fontSize: 12,
        color: theme.colors.error,
        fontWeight: '500',
    },
    hoursCell: {
        fontWeight: '600',
        color: theme.colors.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        ...theme.shadow.small,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    correctionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    pendingBadge: {
        backgroundColor: theme.colors.warning,
    },
    approvedBadge: {
        backgroundColor: theme.colors.success,
    },
    rejectedBadge: {
        backgroundColor: theme.colors.error,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    naText: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
});

export default AttendanceTable;