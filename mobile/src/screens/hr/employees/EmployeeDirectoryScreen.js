import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

const EmployeeDirectoryScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await api.get('/employees');
            const data = response.data;
            setEmployees(data);
            setFilteredEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            Alert.alert('Error', 'Failed to load employee directory.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const lowerText = text.toLowerCase();
            const filtered = employees.filter(emp =>
                emp.name?.toLowerCase().includes(lowerText) ||
                emp.employeeCode?.toLowerCase().includes(lowerText) ||
                emp.department?.toLowerCase().includes(lowerText) ||
                emp.position?.toLowerCase().includes(lowerText)
            );
            setFilteredEmployees(filtered);
        } else {
            setFilteredEmployees(employees);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EmployeeDetails', { id: item.id })}
        >
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                </Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>{item.position} • {item.department}</Text>
                <Text style={styles.code}>{item.employeeCode}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEmployees();
    }, [fetchEmployees]);

    // Add generic "plus" button to header
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddEmployee')}
                    style={{ marginRight: 16 }}
                >
                    <Ionicons name="add-circle" size={30} color={theme.colors.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, ID, role..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor={theme.colors.textTertiary}
                />
            </View>

            <FlatList
                data={filteredEmployees}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No employees found.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 10,
        height: 48,
        ...theme.shadow.light,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        ...theme.shadow.small,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primaryLight, // Ensure this color exists or use fallback
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: '#E0F2FE' // Fallback light blue
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    cardContent: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    code: {
        fontSize: 12,
        color: theme.colors.textTertiary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    }
});

export default EmployeeDirectoryScreen;
