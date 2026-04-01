import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import AttendanceService from '../../../services/AttendanceService';
import StatusBadge from '../../../components/common/StatusBadge';

const AttendanceReportsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await AttendanceService.getAllCorrectionRequests();
            // Assuming API returns array of requests
            setRequests(data?.requests || []);
        } catch (error) {
            console.error('Fetch correction requests error:', error);
            // setRequests([]); 
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handlePress = (request) => {
        navigation.navigate('CorrectionRequestDetail', { request });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.empName}>{item.employeeName}</Text>
                    <Text style={styles.empCode}>{item.employeeCode}</Text>
                </View>
                <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.dateText}> {new Date(item.date).toDateString()}</Text>
                </View>
                <Text style={styles.remarkText} numberOfLines={1}>
                    "{item.remark}"
                </Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.timeAgo}>Requested {item.requestedAt || 'recently'}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Correction Requests</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No pending correction requests.</Text>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: 16,
        marginBottom: 12,
        ...theme.shadow.light,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    empName: {
        ...theme.typography.body,
        fontWeight: '700',
    },
    empCode: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    cardBody: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    dateText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    remarkText: {
        ...theme.typography.bodySmall,
        fontStyle: 'italic',
        color: theme.colors.text,
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
        paddingTop: 8,
    },
    timeAgo: {
        ...theme.typography.captionSmall,
        color: theme.colors.textTertiary,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    }
});

export default AttendanceReportsScreen;
