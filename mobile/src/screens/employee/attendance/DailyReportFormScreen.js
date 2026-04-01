/**
 * DailyReportFormScreen.js
 * ─────────────────────────────────────────────────────────
 * Form screen that opens when the user initiates Geo Check-Out.
 *
 * Flow:
 *  1. User fills in TodaysWork, PendingWork, Issues, Recipients, Attachment
 *  2. On submit → DailyReportService.sendDailyReport()
 *  3. On success → performCheckOut() (geo-checkout API + state reset)
 *  4. Navigate back with success feedback
 * ─────────────────────────────────────────────────────────
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import theme from '../../../constants/theme';
import { useAttendance } from '../../../context/AttendanceContext';
import DailyReportService from '../../../services/DailyReportService';
import api from '../../../services/api'; // the axios instance from ap.js

const DailyReportFormScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { performCheckOut, loading: contextLoading } = useAttendance();

    // From MarkAttendanceScreen
    const checkoutType = route?.params?.type || 'geo';
    const faceImage = route?.params?.faceImage || null;

    // ── Form State ──
    const [todaysWork, setTodaysWork] = useState('');
    const [pendingWork, setPendingWork] = useState('');
    const [issues, setIssues] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ── Recipients State ──
    const [recipientsList, setRecipientsList] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]); // stores IDs
    const [modalVisible, setModalVisible] = useState(false);
    const [loadingRecipients, setLoadingRecipients] = useState(false);

    // Fetch recipients on mount
    useEffect(() => {
        const fetchRecipients = async () => {
            setLoadingRecipients(true);
            try {
                const response = await api.get('/DailyReportApi/recipients');
                // response should be array of { id, name, role }
                setRecipientsList(response.data);
            } catch (error) {
                console.error('[DailyReport] Failed to fetch recipients', error);
                Alert.alert('Error', 'Could not load recipient list. Please try again.');
            } finally {
                setLoadingRecipients(false);
            }
        };
        fetchRecipients();
    }, []);

    // Toggle selection in modal
    const toggleRecipient = (id) => {
        setSelectedRecipients(prev =>
            prev.includes(id)
                ? prev.filter(rid => rid !== id)
                : [...prev, id]
        );
    };

    // Get display string for selected recipients (for the button label)
    const getSelectedDisplay = () => {
        if (selectedRecipients.length === 0) return 'Select Recipients *';
        const names = recipientsList
            .filter(r => selectedRecipients.includes(r.id))
            .map(r => `${r.name} (${r.role})`);
        if (names.length <= 2) return names.join(', ');
        return `${names.length} recipients selected`;
    };

    // ── File Picker ──
    const pickAttachment = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets?.length > 0) {
                const file = result.assets[0];
                setAttachment({
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream',
                });
            }
        } catch (e) {
            console.error('[DailyReport] File picker error:', e);
        }
    }, []);

    const removeAttachment = useCallback(() => {
        setAttachment(null);
    }, []);

    // ── Validation ──
    const validate = () => {
        if (!todaysWork.trim()) {
            Alert.alert('Validation Error', "Please fill in \"Today's Work\" field.");
            return false;
        }
        if (selectedRecipients.length === 0) {
            Alert.alert('Validation Error', 'Please select at least one recipient.');
            return false;
        }
        return true;
    };

    // ── Submit ──
    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);

        try {
            const formData = new FormData();

            // Text fields
            formData.append('TodaysWork', todaysWork?.trim() || '');
            formData.append('PendingWork', pendingWork?.trim() || '');
            formData.append('Issues', issues?.trim() || '');

            // Selected recipient IDs (already array)
            if (selectedRecipients.length === 0) {
                Alert.alert('Error', 'Please select at least one recipient.');
                setSubmitting(false);
                return;
            }

            // IMPORTANT: Proper ASP.NET List<int> binding
            selectedRecipients.forEach((id, index) => {
                formData.append(`SelectedRecipientIds[${index}]`, id.toString());
            });

            // File attachment
            if (attachment) {
                formData.append('Attachment', {
                    uri: attachment.uri,
                    name: attachment.name || `upload_${Date.now()}.jpg`,
                    type: attachment.type || 'application/octet-stream',
                });
            }

            // Step 1: Send daily report
            try {
                await DailyReportService.sendDailyReport(formData);
            } catch (reportError) {
                const msg =
                    reportError?.response?.data?.message ||
                    reportError?.response?.data ||
                    reportError.message ||
                    'Failed to submit daily report';
                Alert.alert('Report Submission Failed', String(msg));
                setSubmitting(false);
                return;
            }

            // Step 2: Perform geo checkout
            try {
                await performCheckOut(checkoutType, faceImage);
            } catch (checkoutError) {
                Alert.alert(
                    'Report Sent, Check-Out Failed',
                    `Your daily report was submitted successfully, but check-out failed: ${checkoutError.message}. Please try checking out manually.`
                );
                setSubmitting(false);
                return;
            }

            // Step 3: Navigate to Daily Summary
            setSubmitting(false);
            navigation.replace('DailySummary');
        } catch (error) {
            console.log('ERROR:', error?.response?.data || error.message);

            const msg =
                error?.response?.data?.message ||
                error?.response?.data ||
                error.message ||
                'Submission failed';

            Alert.alert('Submission Failed', String(msg));
            setSubmitting(false);
        }
    };

    const isDisabled = submitting || contextLoading;

    // ── Render Recipient Modal ──
    const renderRecipientModal = () => (
        <Modal
            animationType="none"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Recipients</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {loadingRecipients ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 40 }} />
                    ) : (
                        <FlatList
                            data={recipientsList}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                                const isSelected = selectedRecipients.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        style={styles.recipientItem}
                                        onPress={() => toggleRecipient(item.id)}
                                    >
                                        <View style={styles.recipientInfo}>
                                            <Text style={styles.recipientName}>{item.name}</Text>
                                            <Text style={styles.recipientRole}>{item.role}</Text>
                                        </View>
                                        <Ionicons
                                            name={isSelected ? 'checkbox' : 'square-outline'}
                                            size={24}
                                            color={isSelected ? theme.colors.success : '#94A3B8'}
                                        />
                                    </TouchableOpacity>
                                );
                            }}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}

                    <TouchableOpacity
                        style={styles.modalDoneBtn}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.modalDoneText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ── Render ──
    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={theme.colors.gradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        activeOpacity={0.7}
                        disabled={isDisabled}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.headerTitle}>Daily Report</Text>
                        <Text style={styles.headerSub}>Submit report & check out</Text>
                    </View>
                    <View style={styles.headerBadge}>
                        <Ionicons name="document-text" size={18} color="#FFF" />
                    </View>
                </View>
            </LinearGradient>

            {/* Form Content */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Form Card */}
                    <View style={[styles.card, theme.shadow.medium]}>
                        {/* Today's Work */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                <Text style={styles.label}>Today's Work <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Describe today's completed work..."
                                placeholderTextColor={theme.colors.textTertiary}
                                value={todaysWork}
                                onChangeText={setTodaysWork}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!isDisabled}
                            />
                        </View>

                        {/* Pending Work */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="time" size={16} color={theme.colors.warning} />
                                <Text style={styles.label}>Pending Work</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Any tasks still pending..."
                                placeholderTextColor={theme.colors.textTertiary}
                                value={pendingWork}
                                onChangeText={setPendingWork}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                editable={!isDisabled}
                            />
                        </View>

                        {/* Issues */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="warning" size={16} color={theme.colors.error} />
                                <Text style={styles.label}>Issues</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Any blockers or issues faced..."
                                placeholderTextColor={theme.colors.textTertiary}
                                value={issues}
                                onChangeText={setIssues}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                editable={!isDisabled}
                            />
                        </View>

                        {/* Recipients - Multi-select Button */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="people" size={16} color={theme.colors.primary} />
                                <Text style={styles.label}>Recipients <Text style={styles.required}>*</Text></Text>
                            </View>
                            <TouchableOpacity
                                style={styles.recipientSelector}
                                onPress={() => setModalVisible(true)}
                                disabled={isDisabled}
                            >
                                <Ionicons name="person-add" size={20} color={theme.colors.primary} />
                                <Text
                                    style={[
                                        styles.recipientSelectorText,
                                        selectedRecipients.length === 0 && styles.placeholderText
                                    ]}
                                    numberOfLines={1}
                                >
                                    {getSelectedDisplay()}
                                </Text>
                                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                            <Text style={styles.hint}>Select one or more recipients</Text>
                        </View>

                        {/* Attachment */}
                        <View style={styles.fieldGroup}>
                            <View style={styles.labelRow}>
                                <Ionicons name="attach" size={16} color={theme.colors.accent} />
                                <Text style={styles.label}>Attachment</Text>
                                <Text style={styles.optional}>(optional)</Text>
                            </View>

                            {attachment ? (
                                <View style={styles.attachmentContainer}>
                                    <View style={styles.attachmentInfo}>
                                        <Ionicons name="document" size={20} color={theme.colors.primary} />
                                        <Text style={styles.attachmentName} numberOfLines={1}>
                                            {attachment.name}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={removeAttachment}
                                        style={styles.removeBtn}
                                        disabled={isDisabled}
                                    >
                                        <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.uploadBtn}
                                    onPress={pickAttachment}
                                    activeOpacity={0.7}
                                    disabled={isDisabled}
                                >
                                    <Ionicons name="cloud-upload" size={20} color={theme.colors.primary} />
                                    <Text style={styles.uploadText}>Choose File</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isDisabled}
                        activeOpacity={0.8}
                        style={styles.submitWrapper}
                    >
                        <LinearGradient
                            colors={isDisabled ? ['#94A3B8', '#94A3B8'] : [theme.colors.error, '#DC2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="send" size={18} color="#FFF" />
                                    <Text style={styles.submitText}>Submit Report & Check Out</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Recipient Selection Modal */}
            {renderRecipientModal()}
        </View>
    );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    flex: {
        flex: 1,
    },

    // ── Header ──
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        fontWeight: '600',
    },
    headerBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Scroll ──
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 24,
        paddingBottom: 40,
    },

    // ── Card ──
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },

    // ── Fields ──
    fieldGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    required: {
        color: theme.colors.error,
        fontWeight: '900',
    },
    optional: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontWeight: '500',
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
        lineHeight: 22,
    },
    hint: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },

    // ── Recipient Selector ──
    recipientSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    recipientSelectorText: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },
    placeholderText: {
        color: '#94A3B8',
    },

    // ── Attachment ──
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    attachmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    attachmentInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },
    removeBtn: {
        padding: 4,
    },

    // ── Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    recipientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    recipientInfo: {
        flex: 1,
        marginRight: 8,
    },
    recipientName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    recipientRole: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    modalDoneBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    modalDoneText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },

    // ── Submit ──
    submitWrapper: {
        marginTop: 12,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: theme.colors.error,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default DailyReportFormScreen;