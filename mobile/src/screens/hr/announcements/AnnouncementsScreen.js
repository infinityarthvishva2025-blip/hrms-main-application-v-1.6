import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    Switch,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../../constants/theme';
import AnnouncementService from '../../../services/announcementService';
import EmployeeService from '../../../services/employee/EmployeeService'; // Assuming this exists to get All Employees
import GradientButton from '../../../components/common/GradientButton';

const AnnouncementsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
    const [loading, setLoading] = useState(false);

    // Create Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'DEPT' | 'EMP'

    // Selection State
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    // Data State
    const [employeesList, setEmployeesList] = useState([]);
    const [announcementsList, setAnnouncementsList] = useState([]);

    const departments = ['ACCOUNTANT', 'BDM', 'IT', 'LOAN'];

    // Fetch Employees for 'EMP' selection
    useEffect(() => {
        if (targetType === 'EMP' && employeesList.length === 0) {
            fetchEmployees();
        }
    }, [targetType]);

    // Fetch Announcements when tab changes to 'list'
    useEffect(() => {
        if (activeTab === 'list') {
            fetchAnnouncements();
        }
    }, [activeTab]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await EmployeeService.getAllEmployees(); // Ensure this method exists
            setEmployeesList(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await AnnouncementService.getAllAnnouncements();
            setAnnouncementsList(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Validation', 'Title and Message are required');
            return;
        }

        if (targetType === 'DEPT' && selectedDepartments.length === 0) {
            Alert.alert('Validation', 'Please select at least one department');
            return;
        }

        if (targetType === 'EMP' && selectedEmployees.length === 0) {
            Alert.alert('Validation', 'Please select at least one employee');
            return;
        }

        const payload = {
            title,
            message,
            isUrgent,
            targetType,
            selectedDepartments: targetType === 'DEPT' ? selectedDepartments : [],
            selectedEmployees: targetType === 'EMP' ? selectedEmployees : []
        };

        setLoading(true);
        try {
            await AnnouncementService.createAnnouncement(payload);
            Alert.alert('Success', 'Announcement sent successfully');
            resetForm();
            setActiveTab('list'); // Switch to list view
        } catch (error) {
            console.error('Create announcement error:', error);
            Alert.alert('Error', 'Failed to send announcement');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await AnnouncementService.deleteAnnouncement(id);
                        fetchAnnouncements();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const handleDeleteAll = () => {
        Alert.alert('Delete All', 'Are you sure you want to delete ALL announcements?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete All',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await AnnouncementService.deleteAllAnnouncements();
                        fetchAnnouncements();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete all');
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setIsUrgent(false);
        setTargetType('ALL');
        setSelectedDepartments([]);
        setSelectedEmployees([]);
    };

    const toggleSelection = (list, setList, item) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const renderCreateTab = () => (
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Announcement Title"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Detailed message..."
                    multiline
                />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.urgentRow}>
                    <Text style={styles.label}>Mark as Urgent</Text>
                    <Switch
                        value={isUrgent}
                        onValueChange={setIsUrgent}
                        trackColor={{ false: '#767577', true: theme.colors.error }}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Send To</Text>
                <View style={styles.targetTypeContainer}>
                    {['ALL', 'DEPT', 'EMP'].map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.targetTypeButton,
                                targetType === type && styles.targetTypeActive
                            ]}
                            onPress={() => setTargetType(type)}
                        >
                            <Text style={[
                                styles.targetTypeText,
                                targetType === type && styles.targetTypeTextActive
                            ]}>
                                {type === 'ALL' ? 'All Employees' : type === 'DEPT' ? 'Departments' : 'Specific Employees'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {targetType === 'DEPT' && (
                <View style={styles.selectionContainer}>
                    <Text style={styles.subLabel}>Select Departments:</Text>
                    <View style={styles.chipsContainer}>
                        {departments.map(dept => (
                            <TouchableOpacity
                                key={dept}
                                style={[
                                    styles.chip,
                                    selectedDepartments.includes(dept) && styles.chipActive
                                ]}
                                onPress={() => toggleSelection(selectedDepartments, setSelectedDepartments, dept)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    selectedDepartments.includes(dept) && styles.chipTextActive
                                ]}>{dept}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {targetType === 'EMP' && (
                <View style={styles.selectionContainer}>
                    <Text style={styles.subLabel}>Select Employees:</Text>
                    {/* Simplified employee selection for MVP */}
                    {loading ? <ActivityIndicator color={theme.colors.primary} /> : (
                        <View style={styles.chipsContainer}>
                            {employeesList.slice(0, 10).map(emp => ( // Limit for MVP UI
                                <TouchableOpacity
                                    key={emp.id}
                                    style={[
                                        styles.chip,
                                        selectedEmployees.includes(emp.id) && styles.chipActive
                                    ]}
                                    onPress={() => toggleSelection(selectedEmployees, setSelectedEmployees, emp.id)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        selectedEmployees.includes(emp.id) && styles.chipTextActive
                                    ]}>{emp.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <Text style={styles.hintText}>Showing top 10 employees for selection</Text>
                </View>
            )}

            <GradientButton
                title="Send Announcement"
                onPress={handleCreate}
                style={{ marginTop: 24 }}
            />
        </ScrollView>
    );

    const renderListTab = () => (
        <View style={styles.listContainer}>
            {announcementsList.length > 0 && (
                <TouchableOpacity style={styles.deleteAllBtn} onPress={handleDeleteAll}>
                    <Text style={styles.deleteAllText}>Delete All</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={announcementsList}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            {item.isUrgent && <View style={styles.badge}><Text style={styles.badgeText}>URGENT</Text></View>}
                        </View>
                        <Text style={styles.cardMessage}>{item.message}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No announcements found</Text>
                    </View>
                }
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Announcements</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                    onPress={() => setActiveTab('create')}
                >
                    <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>Create New</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'list' && styles.activeTab]}
                    onPress={() => setActiveTab('list')}
                >
                    <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>View All</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'create' ? renderCreateTab() : renderListTab()}

            {loading && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </KeyboardAvoidingView>
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
    tabs: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        padding: 4,
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: 'white',
    },
    formContent: {
        padding: 20,
        paddingBottom: 40,
    },
    listContainer: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '600',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    urgentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    targetTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    targetTypeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    targetTypeActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    targetTypeText: {
        fontSize: 13,
        color: theme.colors.text,
    },
    targetTypeTextActive: {
        color: 'white',
        fontWeight: '600',
    },
    selectionContainer: {
        marginBottom: 20,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    chipActive: {
        backgroundColor: '#DBEAFE',
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    chipText: {
        fontSize: 12,
        color: theme.colors.text,
    },
    chipTextActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    deleteAllBtn: {
        alignSelf: 'flex-end',
        marginBottom: 10,
        padding: 8,
    },
    deleteAllText: {
        color: theme.colors.error,
        fontWeight: '600',
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        ...theme.shadow.light,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        flex: 1,
    },
    badge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: theme.colors.error,
        fontSize: 10,
        fontWeight: '700',
    },
    cardMessage: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDate: {
        fontSize: 12,
        color: theme.colors.textTertiary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: theme.colors.textSecondary,
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    hintText: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        marginTop: 4,
        fontStyle: 'italic',
    }
});

export default AnnouncementsScreen;
