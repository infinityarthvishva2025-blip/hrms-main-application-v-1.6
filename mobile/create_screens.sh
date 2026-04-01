#!/bin/bash

# Script to generate all placeholder screens for HRMS app

BASE_PATH="/Users/madhavmore/Downloads/webdevelopement/basic-projects-setuped-for-ready/app/hrms/infinity-hrms-mobile-app-v-3/infinity-arthvisva-mobile-app-v-3/mobile/src/screens"

# Function to create placeholder screen
create_screen() {
    local file_path=$1
    local screen_name=$2
    
    cat > "$file_path" << 'EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from 'THEME_PATH';

const SCREEN_NAME = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>DISPLAY_NAME</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    text: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
});

export default SCREEN_NAME;
EOF
    
    # Calculate theme path depth
    local depth=$(echo "$file_path" | grep -o "/" | wc -l)
    local base_depth=$(echo "$BASE_PATH" | grep -o "/" | wc -l)
    local rel_depth=$((depth - base_depth - 1))
    local theme_path=""
    for ((i=0; i<rel_depth; i++)); do
        theme_path="../$theme_path"
    done
    theme_path="${theme_path}../../constants/theme"
    
    # Replace placeholders
    sed -i '' "s|THEME_PATH|$theme_path|g" "$file_path"
    sed -i '' "s|SCREEN_NAME|$screen_name|g" "$file_path"
    sed -i '' "s|DISPLAY_NAME|$screen_name|g" "$file_path"
}

echo "Creating Employee screens..."

# Employee screens
create_screen "$BASE_PATH/employee/DashboardScreen.js" "DashboardScreen"
create_screen "$BASE_PATH/employee/ProfileScreen.js" "ProfileScreen"
create_screen "$BASE_PATH/employee/MoreMenuScreen.js" "MoreMenuScreen"
create_screen "$BASE_PATH/employee/SettingsScreen.js" "SettingsScreen"

create_screen "$BASE_PATH/employee/attendance/MarkAttendanceScreen.js" "MarkAttendanceScreen"
create_screen "$BASE_PATH/employee/attendance/AttendanceSummaryScreen.js" "AttendanceSummaryScreen"
create_screen "$BASE_PATH/employee/attendance/RegularizationScreen.js" "RegularizationScreen"

create_screen "$BASE_PATH/employee/leaves/ApplyLeaveScreen.js" "ApplyLeaveScreen"
create_screen "$BASE_PATH/employee/leaves/MyLeavesScreen.js" "MyLeavesScreen"
create_screen "$BASE_PATH/employee/leaves/HolidaysScreen.js" "HolidaysScreen"
create_screen "$BASE_PATH/employee/leaves/LeaveBalanceScreen.js" "LeaveBalanceScreen"

create_screen "$BASE_PATH/employee/profile/PayslipsScreen.js" "PayslipsScreen"
create_screen "$BASE_PATH/employee/profile/DocumentsScreen.js" "DocumentsScreen"
create_screen "$BASE_PATH/employee/profile/BenefitsScreen.js" "BenefitsScreen"

create_screen "$BASE_PATH/employee/gurukul/GurukulScreen.js" "GurukulScreen"
create_screen "$BASE_PATH/employee/announcements/AnnouncementsScreen.js" "AnnouncementsScreen"
create_screen "$BASE_PATH/employee/reports/DailyReportsScreen.js" "DailyReportsScreen"
create_screen "$BASE_PATH/employee/resignation/ResignationScreen.js" "ResignationScreen"

echo "Creating HR screens..."

# HR screens
create_screen "$BASE_PATH/hr/DashboardScreen.js" "DashboardScreen"
create_screen "$BASE_PATH/hr/MoreMenuScreen.js" "MoreMenuScreen"
create_screen "$BASE_PATH/hr/SettingsScreen.js" "SettingsScreen"

create_screen "$BASE_PATH/hr/employees/EmployeeDirectoryScreen.js" "EmployeeDirectoryScreen"
create_screen "$BASE_PATH/hr/employees/EmployeeDetailsScreen.js" "EmployeeDetailsScreen"
create_screen "$BASE_PATH/hr/employees/AddEmployeeScreen.js" "AddEmployeeScreen"

create_screen "$BASE_PATH/hr/approvals/PendingApprovalsScreen.js" "PendingApprovalsScreen"
create_screen "$BASE_PATH/hr/approvals/LeaveApprovalScreen.js" "LeaveApprovalScreen"
create_screen "$BASE_PATH/hr/approvals/AttendanceApprovalScreen.js" "AttendanceApprovalScreen"
create_screen "$BASE_PATH/hr/approvals/ResignationApprovalScreen.js" "ResignationApprovalScreen"

create_screen "$BASE_PATH/hr/attendance/TeamAttendanceScreen.js" "TeamAttendanceScreen"
create_screen "$BASE_PATH/hr/attendance/AttendanceReportsScreen.js" "AttendanceReportsScreen"
create_screen "$BASE_PATH/hr/attendance/BiometricDataScreen.js" "BiometricDataScreen"

create_screen "$BASE_PATH/hr/leave/LeaveManagementScreen.js" "LeaveManagementScreen"
create_screen "$BASE_PATH/hr/payroll/PayrollScreen.js" "PayrollScreen"
create_screen "$BASE_PATH/hr/gurukul/GurukulAdminScreen.js" "GurukulAdminScreen"
create_screen "$BASE_PATH/hr/announcements/AnnouncementsScreen.js" "AnnouncementsScreen"
create_screen "$BASE_PATH/hr/resignation/ResignationScreen.js" "ResignationScreen"
create_screen "$BASE_PATH/hr/reports/ReportsScreen.js" "ReportsScreen"

echo "All screens created successfully!"
