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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../../constants/theme';
import AnnouncementService from '../../../services/announcementService';
import { useAuth } from '../../../context/AuthContext';
// import { useAuth } from '../../../context/AuthContext'; // adjust path if needed

const AnnouncementsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth(); // get current user from auth context
    const currentUserId = user?.employeeId ? String(user.employeeId) : null; // ensure string for comparison

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

    // Helper: check if the current user has already read an announcement
    const isReadByCurrentUser = useCallback((announcement) => {
        if (!currentUserId || !announcement.readByEmployees) return false;
        const readIds = announcement.readByEmployees.split(',').map(id => id.trim());
        return readIds.includes(currentUserId);
    }, [currentUserId]);

    const fetchAnnouncements = useCallback(async () => {
        if (!currentUserId) return; // wait for user to load

        try {
            const response = await AnnouncementService.getMyAnnouncements();
            // response = { employeeId, announcements: [...] }
            const allAnnouncements = response.announcements || [];

            // Filter out announcements already read by the current user
            const unreadAnnouncements = allAnnouncements.filter(
                ann => !isReadByCurrentUser(ann)
            );

            // Sort: urgent first, then by date (newest first)
            const sorted = unreadAnnouncements.sort((a, b) => {
                if (a.isUrgent && !b.isUrgent) return -1;
                if (!a.isUrgent && b.isUrgent) return 1;
                return new Date(b.createdOn) - new Date(a.createdOn);
            });

            setAnnouncements(sorted);
        } catch (error) {
            console.error('Fetch announcements error:', error);
            Alert.alert('Error', 'Failed to fetch announcements');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUserId, isReadByCurrentUser]);

    // Initial fetch and when user becomes available
    useEffect(() => {
        if (currentUserId) {
            fetchAnnouncements();
        }
    }, [currentUserId, fetchAnnouncements]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleMarkAsRead = async (id) => {
        // Optimistically remove the announcement
        setAnnouncements(prev => prev.filter(item => item.id !== id));

        try {
            await AnnouncementService.markAsRead(id);
            // No further action needed – the API updates the backend,
            // and future fetches will filter it out automatically.
        } catch (error) {
            console.error('Mark read error:', error);
            Alert.alert('Error', 'Failed to mark as read');
            // Optional: re-fetch to restore the item if the API call failed
            // fetchAnnouncements();
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, item.isUrgent && styles.urgentCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    {item.isUrgent && (
                        <Ionicons name="alert-circle" size={20} color={theme.colors.error} style={{ marginRight: 6 }} />
                    )}
                    <Text style={[styles.cardTitle, item.isUrgent && styles.urgentTitle]}>{item.title}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdOn).toLocaleDateString()} {/* fixed property name */}
                </Text>
            </View>

            <Text style={styles.messageText}>{item.message}</Text>

            <TouchableOpacity
                style={[styles.readButton, item.isUrgent && styles.urgentButton]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <Text style={[styles.readButtonText, item.isUrgent && styles.urgentButtonText]}>Mark as Read</Text>
                <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={item.isUrgent ? theme.colors.error : theme.colors.primary}
                />
            </TouchableOpacity>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No New Announcements</Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Announcements</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={announcements}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={renderEmptyState}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        ...theme.shadow.light,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    urgentCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    urgentTitle: {
        color: theme.colors.error,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textTertiary,
    },
    messageText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 16,
    },
    readButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        gap: 8,
    },
    urgentButton: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    readButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    urgentButtonText: {
        color: theme.colors.error,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        ...theme.shadow.light,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    }
});

export default AnnouncementsScreen;