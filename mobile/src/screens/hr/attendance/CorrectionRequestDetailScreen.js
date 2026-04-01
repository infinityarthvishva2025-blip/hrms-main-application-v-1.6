import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import AttendanceService from '../../../services/AttendanceService';
import StatusBadge from '../../../components/common/StatusBadge';
import GradientButton from '../../../components/common/GradientButton';

const CorrectionRequestDetailScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { request } = route.params;
    const [loading, setLoading] = useState(false);

    const handleAction = async (status) => {
        setLoading(true);
        try {
            await AttendanceService.processCorrectionRequest({
                requestId: request.id,
                status: status, // 'Approved' or 'Rejected'
                employeeId: request.employeeId
            });

            Alert.alert(
                'Success',
                `Request ${status.toLowerCase()} successfully.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Process request error:', error);
            Alert.alert('Error', 'Failed to process request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Employee Info */}
                <View style={styles.section}>
                    <Text style={styles.label}>Employee</Text>
                    <Text style={styles.value}>{request.employeeName}</Text>
                    <Text style={styles.subValue}>{request.employeeCode}</Text>
                </View>

                {/* Attendance Details */}
                <View style={styles.section}>
                    <Text style={styles.label}>Attendance Date</Text>
                    <Text style={styles.value}>{new Date(request.date).toDateString()}</Text>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>In Time</Text>
                            <Text style={styles.value}>{request.inTime || '--:--'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Out Time</Text>
                            <Text style={styles.value}>{request.outTime || '--:--'}</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 12 }}>
                        <Text style={styles.label}>Current Status</Text>
                        <View style={{ alignSelf: 'flex-start' }}>
                            <StatusBadge status={request.status} />
                        </View>
                    </View>
                </View>

                {/* Correction Remark */}
                <View style={styles.section}>
                    <Text style={styles.label}>Correction Remark</Text>
                    <View style={styles.remarkBox}>
                        <Text style={styles.remarkText}>{request.remark}</Text>
                    </View>
                </View>

                {/* Proof */}
                {request.proofUrl && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Proof Attachment</Text>
                        <Image
                            source={{ uri: request.proofUrl }}
                            style={styles.proofImage}
                            resizeMode="cover"
                        />
                    </View>
                )}

                {/* Actions */}
                {request.correctionStatus === 'Pending' ? (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.btn, styles.rejectBtn]}
                            onPress={() => handleAction('Rejected')}
                            disabled={loading}
                        >
                            <Text style={styles.btnTextErr}>Reject</Text>
                        </TouchableOpacity>

                        <GradientButton
                            title="Approve"
                            onPress={() => handleAction('Approved')}
                            style={{ flex: 1 }}
                            disabled={loading}
                        />
                    </View>
                ) : (
                    <View style={styles.statusContainer}>
                        <Text style={styles.label}>Request Status</Text>
                        <Text style={[
                            styles.statusValue,
                            { color: request.correctionStatus === 'Approved' ? theme.colors.success : theme.colors.error }
                        ]}>
                            {request.correctionStatus}
                        </Text>
                    </View>
                )}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        ...theme.typography.h5,
        color: theme.colors.primary,
    },
    content: {
        padding: 16,
    },
    section: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: theme.borderRadius.md,
        marginBottom: 16,
        ...theme.shadow.light,
    },
    label: {
        ...theme.typography.label,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    value: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text,
    },
    subValue: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    row: {
        flexDirection: 'row',
        marginTop: 12,
    },
    remarkBox: {
        backgroundColor: theme.colors.surfaceAlt,
        padding: 12,
        borderRadius: theme.borderRadius.sm,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    remarkText: {
        ...theme.typography.body,
        fontStyle: 'italic',
    },
    proofImage: {
        width: '100%',
        height: 200,
        borderRadius: theme.borderRadius.sm,
        marginTop: 8,
        backgroundColor: theme.colors.surfaceAlt,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    rejectBtn: {
        borderColor: theme.colors.error,
        backgroundColor: theme.colors.surface,
    },
    btnTextErr: {
        color: theme.colors.error,
        fontWeight: '700',
        fontSize: 16,
    },
    statusContainer: {
        alignItems: 'center',
        padding: 16,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 4,
    }
});

export default CorrectionRequestDetailScreen;
