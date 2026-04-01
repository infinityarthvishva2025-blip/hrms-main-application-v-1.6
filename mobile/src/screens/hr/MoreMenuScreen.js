import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const MoreMenuScreen = ({ navigation }) => {
    const { user, logout, role } = useAuth();
    const normalizedRole = role?.toLowerCase();

    // Roles that can see Daily Report Inbox
    const canViewDailyReportInbox =
        normalizedRole === 'hr' ||
        normalizedRole === 'director' ||
        normalizedRole === 'vp' ||
        normalizedRole === 'gm';

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            title: 'HR Management',
            items: [
                { icon: 'briefcase-outline', label: 'Leave Management', screen: 'LeaveManagementScreen' },
                { icon: 'calendar-outline', label: 'Holidays', screen: 'HolidaysScreen' },
                { icon: 'cash-outline', label: 'Payroll', screen: 'PayrollScreen' },
                { icon: 'book-outline', label: 'Gurukul Admin', screen: 'GurukulAdminScreen' },
            ]
        },
        {
            title: 'Communication',
            items: [
                { icon: 'megaphone-outline', label: 'Announcements', screen: 'AnnouncementsScreen' },
                { icon: 'document-text-outline', label: 'Resignation Requests', screen: 'ResignationScreen' },
            ]
        },

        // ✅ Daily Report Inbox — visible for HR, Director, VP, GM
        ...(canViewDailyReportInbox
            ? [{
                title: 'Reports',
                items: [
                    { icon: 'stats-chart-outline', label: 'Daily Report Inbox', screen: 'DailyReportInboxScreen' },
                ],
            }]
            : []),

        {
            title: 'My Work',
            items: [
                { icon: 'time-outline', label: 'Mark Attendance', screen: 'MarkAttendance' },
                { icon: 'stats-chart-outline', label: 'Attendance Summary', screen: 'AttendanceSummary' },
                { icon: 'calendar-number-outline', label: 'Apply Leave', screen: 'ApplyLeave' },
                { icon: 'wallet-outline', label: 'My Leaves', screen: 'MyLeaves' },
                { icon: 'wallet-outline', label: 'My CompopOffs', screen: 'CompOffScreen' },
            ]
        },
        {
            title: 'Personal',
            items: [
                { icon: 'person-outline', label: 'My Profile', screen: 'ProfileScreen' },
                { icon: 'create-outline', label: 'Edit Profile', screen: 'EditProfile' },
                { icon: 'document-text-outline', label: 'Payslip', screen: 'Payslips' },
            ]
        },
        {
            title: 'Settings',
            items: [
                { icon: 'settings-outline', label: 'Settings', screen: 'SettingsScreen' },
            ]
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

            {/* HEADER */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={theme.colors.gradientHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>More</Text>

                            {user && (
                                <View style={styles.profileInfo}>
                                    <View style={styles.badgeContainer}>
                                        <LinearGradient
                                            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                                            style={styles.roleBadge}
                                        >
                                            <Text style={styles.roleBadgeText}>
                                                {role?.toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                    </View>

                                    <Text style={styles.userName}>{user.employeeName}</Text>
                                    <Text style={styles.userCode}>{user.employeeCode}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {user?.employeeName?.charAt(0) || 'U'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* MENU */}
            <View style={styles.menuContainer}>
                {menuItems.map((section, sectionIndex) => {
                    if (section.items.length === 0) return null;

                    return (
                        <View key={sectionIndex} style={styles.section}>
                            <Text style={styles.sectionTitle}>{section.title}</Text>

                            <View style={styles.menuCard}>
                                {section.items.map((item, itemIndex) => (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        style={[
                                            styles.menuItem,
                                            itemIndex < section.items.length - 1 && styles.menuItemBorder
                                        ]}
                                        onPress={() => navigation.navigate(item.screen)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                                                <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
                                            </View>
                                            <Text style={styles.menuItemLabel}>{item.label}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}

                {/* LOGOUT */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#FFE4E6', '#FECDD3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.logoutGradient}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#DC2626" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 3.2.0</Text>
            </View>
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        paddingBottom: theme.spacing.xxl,
    },
    headerContainer: {
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadow.medium,
        backgroundColor: theme.colors.surface,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        ...theme.typography.h2,
        fontSize: 34,
        color: theme.colors.white,
        marginBottom: theme.spacing.xs,
    },
    profileInfo: {
        marginTop: theme.spacing.xs,
    },
    badgeContainer: {
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    roleBadgeText: {
        ...theme.typography.captionSmall,
        color: theme.colors.white,
        fontWeight: '700',
        letterSpacing: 1,
        fontSize: 10,
    },
    userName: {
        ...theme.typography.h4,
        color: theme.colors.white,
        fontSize: 18,
    },
    userCode: {
        ...theme.typography.caption,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    avatarText: {
        ...theme.typography.h4,
        color: theme.colors.white,
    },
    menuContainer: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.label,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        marginLeft: theme.spacing.xs,
        fontSize: 13,
    },
    menuCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        ...theme.shadow.light,
        shadowOpacity: 0.08,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: theme.spacing.md,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    menuItemLabel: {
        ...theme.typography.body,
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 16,
    },
    logoutButton: {
        marginTop: theme.spacing.md,
        borderRadius: 16,
        overflow: 'hidden',
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    logoutText: {
        ...theme.typography.button,
        fontWeight: '700',
        color: '#DC2626',
    },
    versionText: {
        ...theme.typography.captionSmall,
        textAlign: 'center',
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.lg,
    }
});

export default MoreMenuScreen;