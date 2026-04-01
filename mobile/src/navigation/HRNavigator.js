import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// HR-specific Screens
import DashboardScreen from '../screens/employee/DashboardScreen';
import HRMoreMenuScreen from '../screens/hr/MoreMenuScreen';

// Employee Directory Stack
import EmployeeDirectoryScreen from '../screens/hr/employees/EmployeeDirectoryScreen';
import EmployeeDetailsScreen from '../screens/hr/employees/EmployeeDetailsScreen';
import AddEmployeeScreen from '../screens/hr/employees/AddEmployeeScreen';

// Approvals Stack
import PendingApprovalsScreen from '../screens/hr/approvals/PendingApprovalsScreen';
import LeaveApprovalScreen from '../screens/hr/approvals/LeaveApprovalScreen';
import AttendanceApprovalScreen from '../screens/hr/approvals/AttendanceApprovalScreen';
import ResignationApprovalScreen from '../screens/hr/approvals/ResignationApprovalScreen';

// HR More Stack Screens
import LeaveManagementScreen from '../screens/hr/leave/LeaveManagementScreen';
import PayrollScreen from '../screens/hr/payroll/PayrollScreen';
import GurukulAdminScreen from '../screens/hr/gurukul/GurukulAdminScreen';
import AnnouncementsScreen from '../screens/hr/announcements/AnnouncementsScreen';
import ResignationScreen from '../screens/hr/resignation/ResignationScreen';
import SettingsScreen from '../screens/hr/SettingsScreen';
import HolidaysScreen from '../screens/hr/holidays/HolidaysScreen';
import DailyReportInboxScreen from '../screens/hr/reports/DailyReportInboxScreen';

// ✅ Common Employee Screens (available for all admin-level roles)
import MarkAttendanceScreen from '../screens/employee/attendance/MarkAttendanceScreen';
import AttendanceSummaryScreen from '../screens/employee/attendance/AttendanceSummaryScreen';
import ProfileScreen from '../screens/employee/ProfileScreen';
import EditProfileScreen from '../screens/employee/EditProfileScreen';
import PayslipsScreen from '../screens/employee/profile/PayslipsScreen';
import MyLeavesScreen from '../screens/employee/leaves/MyLeavesScreen';
import ApplyLeaveScreen from '../screens/employee/leaves/ApplyLeaveScreen';

import theme from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import CompOffScreen from '../screens/employee/leaves/CompOffScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ================= EMPLOYEES STACK =================
const EmployeesStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontWeight: '600' },
        }}
    >
        <Stack.Screen name="EmployeeDirectory" component={EmployeeDirectoryScreen} options={{ title: 'Employees' }} />
        <Stack.Screen name="EmployeeDetails" component={EmployeeDetailsScreen} options={{ title: 'Employee Details' }} />
        <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ title: 'Add Employee' }} />
    </Stack.Navigator>
);

// ================= APPROVALS STACK =================
const ApprovalsStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontWeight: '600' },
        }}
    >
        <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} options={{ title: 'Approvals' }} />
        <Stack.Screen name="LeaveApproval" component={LeaveApprovalScreen} options={{ title: 'Leave Approval' }} />
        <Stack.Screen name="AttendanceApproval" component={AttendanceApprovalScreen} options={{ title: 'Attendance Approval' }} />
        <Stack.Screen name="ResignationApproval" component={ResignationApprovalScreen} options={{ title: 'Resignation Approval' }} />
    </Stack.Navigator>
);

// ================= MORE STACK =================
const MoreStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { fontWeight: '600' },
        }}
    >
        {/* HR More Menu */}
        <Stack.Screen name="MoreMenu" component={HRMoreMenuScreen} options={{ headerShown: false }} />

        {/* HR Admin Screens */}
        <Stack.Screen name="LeaveManagementScreen" component={LeaveManagementScreen} options={{ title: 'Leave Management' }} />
        <Stack.Screen name="PayrollScreen" component={PayrollScreen} options={{ title: 'Payroll' }} />
        <Stack.Screen name="GurukulAdminScreen" component={GurukulAdminScreen} options={{ title: 'Gurukul Admin' }} />
        <Stack.Screen name="AnnouncementsScreen" component={AnnouncementsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HolidaysScreen" component={HolidaysScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResignationScreen" component={ResignationScreen} options={{ title: 'Resignation Requests' }} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="DailyReportInboxScreen" component={DailyReportInboxScreen} options={{ title: 'Daily Report Inbox' }} />

        {/* ✅ Common Employee Screens — accessible to HR, Director, VP, GM */}
        <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AttendanceSummary" component={AttendanceSummaryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyLeaves" component={MyLeavesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />


        <Stack.Screen name="CompOffScreen" component={CompOffScreen} options={{ headerShown: false }} />


        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Payslips" component={PayslipsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
);


// ================= MAIN HR NAVIGATOR =================
const HRNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                lazy: true,
            }}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Employees" component={EmployeesStack} />
            <Tab.Screen name="Approvals" component={ApprovalsStack} />
            <Tab.Screen name="More" component={MoreStack} />
        </Tab.Navigator>
    );
};


// ================= CUSTOM TAB BAR =================
const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.tabBarContainer}>
            <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    const label =
                        options.tabBarLabel ??
                        options.title ??
                        route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    let iconName;
                    if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
                    else if (route.name === 'Employees') iconName = isFocused ? 'people' : 'people-outline';
                    else if (route.name === 'Approvals') iconName = isFocused ? 'checkmark-done' : 'checkmark-done-outline';
                    else if (route.name === 'More') iconName = isFocused ? 'menu' : 'menu-outline';

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.8}
                        >
                            {isFocused ? (
                                <LinearGradient
                                    colors={theme.colors.gradientPrimary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.activeTabGradient}
                                >
                                    <Ionicons name={iconName} size={20} color="#FFF" />
                                    <Text style={styles.labelFocused}>{label}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.inactiveTab}>
                                    <Ionicons name={iconName} size={22} color={theme.colors.tabInactive} />
                                    <Text style={styles.labelInactive}>{label}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    tabBarContainer: {
        backgroundColor: theme.colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 12,
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    activeTabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 24,
        gap: 8,
    },
    inactiveTab: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    labelFocused: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    labelInactive: {
        fontSize: 10,
        fontWeight: '500',
        color: theme.colors.tabInactive,
    },
});

export default HRNavigator;