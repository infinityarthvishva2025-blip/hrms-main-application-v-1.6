/**
 * ApplyLeaveScreen.js
 * ─────────────────────────────────────────────────────────
 * Enhanced Apply Leave screen matching web UI with Comp Off support.
 * Now uses centralized api.js instead of external leaveService.
 * Features:
 *   - Category dropdown (Full Day, More Than 1 Day, Half Day, Early Going, Late Coming)
 *   - Conditional fields based on category
 *   - Leave Type dropdown (Sick, Casual, Comp-Off) for full/multi day
 *   - Comp-Off date dropdown (fetched from API) when Comp-Off is selected
 *   - Comp-Off balance display
 *   - All original leave types fully functional
 * ─────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Modal,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import GradientButton from '../../../components/common/GradientButton';
import api from '../../../services/api';
// import api from '../../../services/api'; // 👈 use centralized API client

// API endpoints (adjust if your backend uses different paths)
const COMP_OFF_DETAILS_URL = '/Leave/Create';
const APPLY_LEAVE_URL = '/Leave/Create';

const ApplyLeaveScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // ── Core State ──
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState(0); // 0=Full Day, 1=More Than 1 Day, 2=Half Day, 3=Early Going, 4=Late Coming
    const [leaveType, setLeaveType] = useState(''); // 'Sick', 'Casual', 'coff'
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [halfDayDate, setHalfDayDate] = useState(new Date());
    const [halfDaySession, setHalfDaySession] = useState(''); // 'FirstHalf', 'SecondHalf'
    const [timeDate, setTimeDate] = useState(new Date());
    const [timeValue, setTimeValue] = useState('');
    const [reason, setReason] = useState('');

    // ── Comp Off State ──
    const [compOffBalance, setCompOffBalance] = useState(0);
    const [compOffDates, setCompOffDates] = useState([]); // Array of Date objects
    const [selectedCompOffDate, setSelectedCompOffDate] = useState(null);
    const [showCompOffModal, setShowCompOffModal] = useState(false);
    const [loadingCompOff, setLoadingCompOff] = useState(false);

    // Date Pickers visibility
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showHalfDayPicker, setShowHalfDayPicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // ── Category options (match web values) ──
    const categoryOptions = [
        { label: 'Full Day', value: 0 },
        { label: 'More Than 1 Day', value: 1 },
        { label: 'Half Day', value: 2 },
        { label: 'Early Going', value: 3 },
        { label: 'Late Coming', value: 4 },
    ];

    // Leave type options (only for Full Day / More Than 1 Day)
    const leaveTypeOptions = [
        { label: 'Sick', value: 'Sick' },
        { label: 'Casual', value: 'Casual' },
        { label: 'Comp-Off', value: 'coff' },
    ];

    // Session options for Half Day
    const sessionOptions = [
        { label: 'First Half', value: 'FirstHalf' },
        { label: 'Second Half', value: 'SecondHalf' },
    ];

    // ── Fetch Comp Off Details on Mount ──
    useEffect(() => {
        fetchCompOffData();
    }, []);

    const fetchCompOffData = async () => {
        setLoadingCompOff(true);
        try {
            const response = await api.get(COMP_OFF_DETAILS_URL);
            // Defensive access – if response structure differs, adjust accordingly
            const data = response.data || {};
            setCompOffBalance(data.compOffBalance || 0);
            const dates = (data.compOffDates || []).map(dateStr => {
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? null : d;
            }).filter(d => d !== null);
            setCompOffDates(dates);
        } catch (error) {
            console.error('Error fetching comp off details:', error);
            // Non‑blocking – user can still apply for other leave types
        } finally {
            setLoadingCompOff(false);
        }
    };

    // ── Handlers (memoized with useCallback) ──
    const handleCategoryChange = useCallback((itemValue) => {
        setCategory(Number(itemValue));
        // Reset dependent fields
        setLeaveType('');
        setSelectedCompOffDate(null);
        setHalfDaySession('');
        setTimeValue('');
    }, []);

    const handleLeaveTypeChange = useCallback((itemValue) => {
        setLeaveType(itemValue);
        if (itemValue !== 'coff') {
            setSelectedCompOffDate(null);
        }
    }, []);

    const handleSelectCompOffDate = useCallback((date) => {
        setSelectedCompOffDate(date);
        setShowCompOffModal(false);
    }, []);

    // Safe date conversion for API
    const toISODate = (date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return new Date().toISOString().split('T')[0]; // fallback to today
        }
        return date.toISOString().split('T')[0];
    };

    const handleStartDateChange = useCallback((event, selectedDate) => {
        setShowStartPicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
            if (selectedDate > endDate) {
                setEndDate(selectedDate);
            }
        }
    }, [endDate]);

    const handleEndDateChange = useCallback((event, selectedDate) => {
        setShowEndPicker(false);
        if (selectedDate) setEndDate(selectedDate);
    }, []);

    const handleHalfDayDateChange = useCallback((event, selectedDate) => {
        setShowHalfDayPicker(false);
        if (selectedDate) setHalfDayDate(selectedDate);
    }, []);

    const handleTimeDateChange = useCallback((event, selectedDate) => {
        setShowTimePicker(false);
        if (selectedDate) setTimeDate(selectedDate);
    }, []);

    // ── Validation ──
    const validateForm = useCallback(() => {
        if (!reason.trim()) {
            Alert.alert('Missing Detail', 'Please enter a reason for your leave.');
            return false;
        }

        switch (category) {
            case 0: // Full Day
            case 1: // More Than 1 Day
                if (!leaveType) {
                    Alert.alert('Missing Leave Type', 'Please select a leave type.');
                    return false;
                }
                if (leaveType === 'coff' && !selectedCompOffDate) {
                    Alert.alert('Missing Comp-Off Date', 'Please select a comp-off earned date.');
                    return false;
                }
                if (category === 1 && endDate < startDate) {
                    Alert.alert('Invalid Dates', 'End date cannot be before start date.');
                    return false;
                }
                break;

            case 2: // Half Day
                if (!halfDaySession) {
                    Alert.alert('Missing Session', 'Please select a session for half day.');
                    return false;
                }
                break;

            case 3: // Early Going
            case 4: // Late Coming
                if (!timeValue.trim()) {
                    Alert.alert('Missing Time', `Please enter the time for ${category === 3 ? 'Early Going' : 'Late Coming'}.`);
                    return false;
                }
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(timeValue)) {
                    Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 14:30).');
                    return false;
                }
                break;

            default:
                break;
        }

        return true;
    }, [category, leaveType, selectedCompOffDate, endDate, startDate, halfDaySession, timeValue, reason]);

    // ── Submit ──
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Build base payload
            const leaveData = {
                category: category,
                reason: reason.trim(),
            };

            // Add fields based on category (use safe date conversion)
            if (category === 0 || category === 1) {
                leaveData.leaveType = leaveType;
                leaveData.startDate = toISODate(startDate);
                leaveData.endDate = toISODate(endDate);
                if (leaveType === 'coff' && selectedCompOffDate) {
                    leaveData.isCompOff = true;
                    leaveData.workDate = toISODate(selectedCompOffDate);
                }
            } else if (category === 2) {
                leaveData.leaveType = 'HalfDay';
                leaveData.startDate = toISODate(halfDayDate);
                leaveData.endDate = toISODate(halfDayDate); // same day
                leaveData.halfDaySession = halfDaySession;
            } else if (category === 3) {
                leaveData.leaveType = 'EarlyGoing';
                leaveData.startDate = toISODate(timeDate);
                leaveData.endDate = toISODate(timeDate);
                leaveData.timeValue = timeValue;
            } else if (category === 4) {
                leaveData.leaveType = 'LateComing';
                leaveData.startDate = toISODate(timeDate);
                leaveData.endDate = toISODate(timeDate);
                leaveData.timeValue = timeValue;
            }

            const response = await api.post(APPLY_LEAVE_URL, leaveData);
            const message = response.data?.message || 'Your leave request has been sent for approval.';

            Alert.alert(
                'Application Submitted',
                message,
                [
                    {
                        text: 'Done',
                        onPress: () => {
                            // Reset form
                            setCategory(0);
                            setLeaveType('');
                            setStartDate(new Date());
                            setEndDate(new Date());
                            setHalfDayDate(new Date());
                            setHalfDaySession('');
                            setTimeDate(new Date());
                            setTimeValue('');
                            setReason('');
                            setSelectedCompOffDate(null);
                            fetchCompOffData(); // Refresh balance
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Apply leave error:', error);
            const errorMsg = error.response?.data?.message || 'Something went wrong. Please try again.';
            Alert.alert('Submission Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    }, [
        category, reason, leaveType, startDate, endDate, selectedCompOffDate,
        halfDayDate, halfDaySession, timeDate, timeValue, validateForm
    ]);

    // Helper to format date for display
    const formatDate = useCallback((date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    // Modal list item renderer (memoized to avoid recreating)
    const renderCompOffItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.modalItem}
            onPress={() => handleSelectCompOffDate(item)}
        >
            <Ionicons name="calendar" size={18} color={theme.colors.primary} />
            <Text style={styles.modalItemText}>
                {formatDate(item)}
            </Text>
        </TouchableOpacity>
    ), [handleSelectCompOffDate, formatDate]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={theme.colors.gradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerRow}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Apply Leave</Text>
                        <Text style={styles.headerSub}>Request time off</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => navigation.navigate('LeaveBalance')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="wallet-outline" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Category Dropdown */}
                    <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Leave Category</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={category}
                                onValueChange={handleCategoryChange}
                                style={styles.picker}
                                dropdownIconColor={theme.colors.primary}
                            >
                                {categoryOptions.map(opt => (
                                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Conditional Fields based on Category */}
                    {(category === 0 || category === 1) && (
                        <>
                            {/* Leave Type Dropdown */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Leave Type</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={leaveType}
                                        onValueChange={handleLeaveTypeChange}
                                        style={styles.picker}
                                        dropdownIconColor={theme.colors.primary}
                                    >
                                        <Picker.Item label="-- Select --" value="" />
                                        {leaveTypeOptions.map(opt => (
                                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {/* Comp-Off Date Selector (visible only when leaveType === 'coff') */}
                            {leaveType === 'coff' && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.fieldLabel}>
                                        Comp-Off Earned Date {compOffBalance > 0 && `(Balance: ${compOffBalance})`}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.compOffSelector}
                                        onPress={() => {
                                            if (compOffDates.length === 0) {
                                                Alert.alert('No Comp-Off', 'You have no available comp-off dates.');
                                            } else {
                                                setShowCompOffModal(true);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="calendar-outline" size={20} color={theme.colors.textTertiary} />
                                        <Text style={styles.compOffSelectorText}>
                                            {selectedCompOffDate ? formatDate(selectedCompOffDate) : 'Choose a date'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color={theme.colors.textTertiary} />
                                    </TouchableOpacity>
                                    {loadingCompOff && (
                                        <Text style={styles.loadingText}>Loading available dates...</Text>
                                    )}
                                </View>
                            )}

                            {/* Start & End Dates */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Start Date</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowStartPicker(true)}
                                >
                                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                                    <Text style={styles.dateValueText}>{formatDate(startDate)}</Text>
                                </TouchableOpacity>
                            </View>

                            {category === 1 && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.fieldLabel}>End Date</Text>
                                    <TouchableOpacity
                                        style={styles.dateInput}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                                        <Text style={styles.dateValueText}>{formatDate(endDate)}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleStartDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                            {showEndPicker && (
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleEndDateChange}
                                    minimumDate={startDate}
                                />
                            )}
                        </>
                    )}

                    {category === 2 && (
                        <>
                            {/* Half Day Date */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Date</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowHalfDayPicker(true)}
                                >
                                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                                    <Text style={styles.dateValueText}>{formatDate(halfDayDate)}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Session */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Session</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={halfDaySession}
                                        onValueChange={setHalfDaySession}
                                        style={styles.picker}
                                        dropdownIconColor={theme.colors.primary}
                                    >
                                        <Picker.Item label="-- Select --" value="" />
                                        {sessionOptions.map(opt => (
                                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {showHalfDayPicker && (
                                <DateTimePicker
                                    value={halfDayDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleHalfDayDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </>
                    )}

                    {(category === 3 || category === 4) && (
                        <>
                            {/* Date */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Date</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                                    <Text style={styles.dateValueText}>{formatDate(timeDate)}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Time */}
                            <View style={styles.formGroup}>
                                <Text style={styles.fieldLabel}>Time (HH:MM)</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="time-outline" size={20} color={theme.colors.textTertiary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        value={timeValue}
                                        onChangeText={setTimeValue}
                                        placeholder="e.g. 14:30"
                                        placeholderTextColor={theme.colors.textQuarterly}
                                        keyboardType="numbers-and-punctuation"
                                    />
                                </View>
                            </View>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={timeDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleTimeDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </>
                    )}

                    {/* Reason */}
                    <View style={styles.formGroup}>
                        <Text style={styles.fieldLabel}>Reason</Text>
                        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                            <TextInput
                                style={styles.textArea}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Please describe why you need leave..."
                                placeholderTextColor={theme.colors.textQuarterly}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <GradientButton
                        title={loading ? "Submitting..." : "Submit Application"}
                        onPress={handleSubmit}
                        disabled={loading}
                        icon={!loading && <Ionicons name="paper-plane-outline" size={18} color="#FFF" />}
                        style={styles.submitBtn}
                    />

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Comp-Off Date Selection Modal */}
            <Modal
                visible={showCompOffModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCompOffModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Comp-Off Earned Date</Text>
                            <TouchableOpacity onPress={() => setShowCompOffModal(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={compOffDates}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderCompOffItem}
                            ListEmptyComponent={
                                <Text style={styles.modalEmpty}>No comp-off dates available.</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ==================== ENHANCED STYLES ====================
// All functional code remains unchanged; only the visual styles have been upgraded.
// ==========================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerGradient: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        borderBottomLeftRadius: theme.borderRadius.xl,
        borderBottomRightRadius: theme.borderRadius.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    historyBtn: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.round,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    pickerWrapper: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadow.light,
    },
    picker: {
        height: 56,
        width: '100%',
        color: theme.colors.text,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        height: 56,
        gap: theme.spacing.sm,
        ...theme.shadow.light,
    },
    dateValueText: {
        fontSize: 15,
        color: theme.colors.text,
        flex: 1,
    },
    compOffSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        height: 56,
        justifyContent: 'space-between',
        ...theme.shadow.light,
    },
    compOffSelectorText: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        height: 56,
        ...theme.shadow.light,
    },
    textAreaWrapper: {
        height: 'auto',
        paddingVertical: theme.spacing.md,
        alignItems: 'flex-start',
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
    },
    textArea: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
        minHeight: 80,
    },
    loadingText: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    submitBtn: {
        borderRadius: theme.borderRadius.lg,
        marginTop: theme.spacing.lg,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxHeight: '60%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        ...theme.shadow.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        gap: theme.spacing.sm,
    },
    modalItemText: {
        fontSize: 15,
        color: theme.colors.text,
    },
    modalEmpty: {
        textAlign: 'center',
        color: theme.colors.textTertiary,
        paddingVertical: theme.spacing.lg,
    },
});

export default ApplyLeaveScreen;