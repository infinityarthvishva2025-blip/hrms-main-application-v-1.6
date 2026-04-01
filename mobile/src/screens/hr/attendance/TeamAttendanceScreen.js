import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
// We use direct fetch for employee search for now to keep it simple
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import DatePickerInput from '../../../components/common/DatePickerInput';
import GradientButton from '../../../components/common/GradientButton';
import AttendanceTable from '../../../components/common/AttendanceTable';

const TeamAttendanceScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { token } = useAuth();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [employees, setEmployees] = useState([]); // List of employees found
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const [fromDate, setFromDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [toDate, setToDate] = useState(new Date());

    // Search Employees
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearchLoading(true);
        try {
            const response = await api.get('/employees');
            const data = response.data;

            // Client-side filtering for simplicity (assuming list isn't huge)
            const filtered = data.filter(e =>
                e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setEmployees(filtered);

        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Error', 'Failed to search employees.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setEmployees([]); // Clear search results 
        setSearchQuery('');
        // Auto-fetch attendance for this employee
        fetchEmployeeAttendance(emp.id);
    };

    const fetchEmployeeAttendance = async (empId) => {
        if (!empId) return;
        setLoading(true);
        try {
            // Use service
            const data = await AttendanceService.getEmployeeSummary(empId, {
                from: fromDate.toISOString(),
                to: toDate.toISOString()
            });

            if (data && data.records) {
                setAttendanceData(data.records);
            } else {
                setAttendanceData([]);
            }
        } catch (error) {
            console.error('Fetch employee summary error:', error);
            Alert.alert('Error', 'Failed to fetch employee attendance');
        } finally {
            setLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedEmployee(null);
        setAttendanceData([]);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.headerTitle}>Team Attendance</Text>
            </View>

            {/* Search, Selected Employee, Filters */}
            <View style={styles.searchSection}>
                {!selectedEmployee ? (
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Employee (Name/ID)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                        <TouchableOpacity onPress={handleSearch}>
                            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Search</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.selectedEmployeeCard}>
                        <View>
                            <Text style={styles.selectedName}>{selectedEmployee.name}</Text>
                            <Text style={styles.selectedCode}>{selectedEmployee.employeeCode}</Text>
                        </View>
                        <TouchableOpacity onPress={clearSelection}>
                            <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Content Area */}
            {searchLoading ? (
                <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
            ) : !selectedEmployee ? (
                /* Search Results */
                <FlatList
                    data={employees}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.employeeItem} onPress={() => handleSelectEmployee(item)}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.empName}>{item.name}</Text>
                                <Text style={styles.empCode}>{item.employeeCode}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        searchQuery.length > 0 && !searchLoading ? (
                            <Text style={styles.emptyText}>No employees found.</Text>
                        ) : (
                            <Text style={styles.emptyText}>Search to view attendance records.</Text>
                        )
                    }
                />
            ) : (
                /* Attendance View for Selected Employee */
                <View style={{ flex: 1 }}>
                    <View style={styles.filterContainer}>
                        <View style={styles.dateInputWrapper}>
                            <Text style={styles.label}>From</Text>
                            <DatePickerInput
                                date={fromDate}
                                onDateChange={setFromDate}
                                maxDate={new Date()}
                            />
                        </View>
                        <View style={styles.dateInputWrapper}>
                            <Text style={styles.label}>To</Text>
                            <DatePickerInput
                                date={toDate}
                                onDateChange={setToDate}
                                maxDate={new Date()}
                            />
                        </View>
                        <View style={styles.filterBtnWrapper}>
                            <TouchableOpacity
                                onPress={() => fetchEmployeeAttendance(selectedEmployee.id)}
                                style={styles.filterButton}
                            >
                                <Ionicons name="funnel" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.tableWrapper}>
                        {loading ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        ) : (
                            <AttendanceTable
                                data={attendanceData}
                                isHrView={true}
                            />
                        )}
                    </View>
                </View>
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
    searchSection: {
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: theme.colors.text,
    },
    selectedEmployeeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedName: {
        ...theme.typography.h5,
        fontWeight: '700',
    },
    selectedCode: {
        ...theme.typography.caption,
    },
    list: {
        padding: 16,
    },
    employeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 12,
        borderRadius: theme.borderRadius.md,
        marginBottom: 8,
        ...theme.shadow.light,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#E0F2FE'
    },
    avatarText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 16,
    },
    empName: {
        ...theme.typography.body,
        fontWeight: '600',
    },
    empCode: {
        ...theme.typography.captionSmall,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: theme.colors.textSecondary,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surface,
    },
    dateInputWrapper: {
        flex: 1,
    },
    filterBtnWrapper: {
        justifyContent: 'flex-end',
        paddingTop: 24,
    },
    filterButton: {
        backgroundColor: theme.colors.primary,
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadow.small,
    },
    label: {
        ...theme.typography.label,
        marginBottom: 8,
    },
    tableWrapper: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});

export default TeamAttendanceScreen;
