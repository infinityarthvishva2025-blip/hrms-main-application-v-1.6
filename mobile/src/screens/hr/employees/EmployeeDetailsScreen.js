import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const EmployeeDetailsScreen = ({ route }) => {
    const { id } = route.params;
    const { token } = useAuth();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployeeDetails();
    }, [id]);

    const fetchEmployeeDetails = async () => {
        try {
            const response = await api.get(`/employees/${id}`);
            const data = response.data;
            setEmployee(data);
        } catch (error) {
            console.error('Error fetching employee details:', error);
            Alert.alert('Error', 'Failed to load details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!employee) {
        return (
            <View style={styles.center}>
                <Text>Employee not found.</Text>
            </View>
        );
    }

    const DetailItem = ({ label, value, icon }) => (
        <View style={styles.detailRow}>
            <View style={styles.iconBox}>
                <Ionicons name={icon} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || '-'}</Text>
            </View>
        </View>
    );

    const SectionHeader = ({ title }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.divider} />
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {employee.name ? employee.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{employee.name}</Text>
                <Text style={styles.role}>{employee.position}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{employee.status || 'Active'}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <SectionHeader title="Official Info" />
                <DetailItem label="Employee Code" value={employee.employeeCode} icon="id-card-outline" />
                <DetailItem label="Department" value={employee.department} icon="business-outline" />
                <DetailItem label="Email" value={employee.email} icon="mail-outline" />
                <DetailItem label="Role" value={employee.role} icon="person-circle-outline" />
                <DetailItem label="Joining Date" value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '-'} icon="calendar-outline" />
                <DetailItem label="Reporting Manager" value={employee.reportingManager} icon="people-outline" />
            </View>

            <View style={styles.card}>
                <SectionHeader title="Personal Info" />
                <DetailItem label="Mobile" value={employee.mobileNumber} icon="call-outline" />
                <DetailItem label="Father's Name" value={employee.fatherName} icon="person-outline" />
                <DetailItem label="Gender" value={employee.gender} icon="male-female-outline" />
                <DetailItem label="Address" value={employee.address} icon="location-outline" />
            </View>

            <View style={styles.card}>
                <SectionHeader title="Financial Info" />
                <DetailItem label="Bank Name" value={employee.bankName} icon="briefcase-outline" />
                <DetailItem label="Account Number" value={employee.accountNumber} icon="card-outline" />
                <DetailItem label="IFSC" value={employee.ifsc} icon="code-slash-outline" />
                <DetailItem label="Salary" value={employee.salary ? `₹${employee.salary}` : '-'} icon="cash-outline" />
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCard: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        ...theme.shadow.medium,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        ...theme.typography.h3,
        marginBottom: 4,
    },
    role: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    badge: {
        backgroundColor: '#DEF7EC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: theme.colors.success,
        fontSize: 12,
        fontWeight: '600',
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        ...theme.shadow.small,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        ...theme.typography.h4,
        marginBottom: 8,
        color: theme.colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.divider,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
        justifyContent: 'center',
    },
    label: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
    },
});

export default EmployeeDetailsScreen;
