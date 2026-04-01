import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../../constants/theme';
import HolidayService from '../../../services/hr/holidayService';
import GradientButton from '../../../components/common/GradientButton';
import DatePickerInput from '../../../components/common/DatePickerInput';

const HolidaysScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [holidayName, setHolidayName] = useState('');
    const [description, setDescription] = useState('');
    const [holidayDate, setHolidayDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchHolidays = useCallback(async () => {
        try {
            const data = await HolidayService.getHolidays();
            // Sort by date
            const sorted = data.sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate));
            setHolidays(sorted);
        } catch (error) {
            console.error('Fetch holidays error:', error);
            Alert.alert('Error', 'Failed to fetch holidays');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHolidays();
    }, [fetchHolidays]);

    const handleCreateHoliday = async () => {
        if (!holidayName.trim() || !holidayDate) {
            Alert.alert('Validation', 'Holiday Name and Date are required');
            return;
        }

        setSubmitting(true);
        try {
            await HolidayService.createHoliday({
                holidayName: holidayName.trim(),
                holidayDate: holidayDate,
                description: description.trim() || 'Holiday'
            });
            Alert.alert('Success', 'Holiday created successfully');
            setModalVisible(false);
            resetForm();
            fetchHolidays();
        } catch (error) {
            console.error('Create holiday error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create holiday');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteHoliday = (id) => {
        Alert.alert(
            'Delete Holiday',
            'Are you sure you want to delete this holiday?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await HolidayService.deleteHoliday(id);
                            fetchHolidays();
                        } catch (error) {
                            console.error('Delete holiday error:', error);
                            Alert.alert('Error', 'Failed to delete holiday');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setHolidayName('');
        setDescription('');
        setHolidayDate(new Date().toISOString().split('T')[0]);
    };

    const formatDate = (dateString) => {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{new Date(item.holidayDate).getDate()}</Text>
                <Text style={styles.dateMonth}>{new Date(item.holidayDate).toLocaleDateString('en-US', { month: 'short' })}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.holidayTitle}>{item.holidayName}</Text>
                <Text style={styles.holidayDesc}>{item.description}</Text>
                <Text style={styles.holidayWeekday}>{new Date(item.holidayDate).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteHoliday(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Holidays</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={holidays}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color={theme.colors.textTertiary} />
                            <Text style={styles.emptyText}>No holidays found</Text>
                        </View>
                    }
                />
            )}

            {/* Create Holiday Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.centeredView}
                >
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Holiday</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Holiday Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Independence Day"
                                value={holidayName}
                                onChangeText={setHolidayName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Date *</Text>
                            <DatePickerInput
                                value={holidayDate}
                                onChange={setHolidayDate}
                                label=""
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Optional description"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <GradientButton
                            title={submitting ? "Creating..." : "Create Holiday"}
                            onPress={handleCreateHoliday}
                            disabled={submitting}
                            style={{ marginTop: 20 }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadow.light,
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
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        ...theme.shadow.light,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    dateBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    dateDay: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.primary,
        textTransform: 'uppercase',
    },
    cardContent: {
        flex: 1,
    },
    holidayTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    holidayDesc: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    holidayWeekday: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    // Modal Styles
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
});

export default HolidaysScreen;
