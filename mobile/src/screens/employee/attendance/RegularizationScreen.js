import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import AttendanceService from '../../../services/AttendanceService';
import { useAuth } from '../../../context/AuthContext';
import GradientButton from '../../../components/common/GradientButton';

const RegularizationScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { attendanceRecord } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [remark, setRemark] = useState('');
    const [proofFile, setProofFile] = useState(null);

    // Validate that we have the required data
    useEffect(() => {
        if (!attendanceRecord) {
            Alert.alert('Error', 'No attendance record provided', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            return;
        }

        if (!attendanceRecord.token) {
            Alert.alert('Error', 'Missing correction token. This record may not allow corrections.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            return;
        }

        // Check if correction already requested
        if (attendanceRecord.correctionStatus === 'Pending') {
            Alert.alert('Info', 'Correction already pending for this record', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else if (attendanceRecord.correctionStatus === 'Approved') {
            Alert.alert('Info', 'Correction already approved for this record', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    }, [attendanceRecord]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all types or specify images/pdf
                copyToCacheDirectory: true
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const file = result.assets[0];

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    Alert.alert('Error', 'File size must be less than 5MB');
                    return;
                }

                setProofFile(file);
            }
        } catch (err) {
            console.log('Document picker error:', err);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleSubmit = async () => {
        if (!remark.trim()) {
            Alert.alert('Validation', 'Please enter a correction remark.');
            return;
        }

        if (!attendanceRecord.token) {
            Alert.alert('Error', 'Missing correction token. Please go back and try again.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('token', attendanceRecord.token);
            formData.append('correctionRemark', remark.trim());

            if (proofFile) {
                formData.append('proofFile', {
                    uri: proofFile.uri,
                    type: proofFile.mimeType || 'application/octet-stream',
                    name: proofFile.name || 'proof_file',
                });
            }

            const response = await AttendanceService.submitCorrectionRequest(formData);

            Alert.alert(
                'Success',
                response.message || 'Correction requested successfully!',
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );

        } catch (error) {
            console.error('Submit correction error:', error);
            const msg = error.response?.data?.message || 'Failed to submit correction request';

            if (msg.includes('already requested')) {
                Alert.alert('Info', 'Correction already requested for this date.');
            } else if (msg.includes('token') || msg.includes('Token')) {
                Alert.alert('Error', 'Invalid or expired token. Please go back and try again.');
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!attendanceRecord) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}>
            {/* Header Section */}
            <View style={styles.headerCard}>
                <Ionicons name="document-text-outline" size={32} color={theme.colors.primary} />
                <Text style={styles.headerTitle}>Attendance Correction Request</Text>
                <Text style={styles.employeeName}>{user?.name} ({user?.employeeCode || user?.emp_code})</Text>

                {/* Display Attendance Info for Correction */}
                <View style={styles.recordInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date:</Text>
                        <Text style={styles.infoValue}>{new Date(attendanceRecord.date).toDateString()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={styles.infoValue}>{attendanceRecord.status || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>In Time:</Text>
                        <Text style={styles.infoValue}>{attendanceRecord.inTime || '--'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Out Time:</Text>
                        <Text style={styles.infoValue}>{attendanceRecord.outTime || '--'}</Text>
                    </View>
                </View>
            </View>

            {/* Input Form */}
            <View style={styles.formContainer}>
                <Text style={styles.label}>Correction Remark *</Text>
                <Text style={styles.helperText}>
                    Explain why you need this correction (e.g., "Forgot to check out", "System error")
                </Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Enter reason for correction..."
                    placeholderTextColor={theme.colors.textTertiary}
                    multiline
                    numberOfLines={5}
                    value={remark}
                    onChangeText={setRemark}
                    textAlignVertical="top"
                />

                <Text style={styles.label}>Upload Proof (Optional)</Text>
                <Text style={styles.helperText}>
                    Attach supporting documents (Image/PDF, max 5MB)
                </Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                    <Ionicons name="cloud-upload-outline" size={28} color={theme.colors.primary} />
                    <Text style={styles.uploadText}>
                        {proofFile ? proofFile.name : 'Tap to select file'}
                    </Text>
                    {proofFile && (
                        <Text style={styles.fileSizeText}>
                            Size: {(proofFile.size / 1024).toFixed(2)} KB
                        </Text>
                    )}
                </TouchableOpacity>

                {proofFile && (
                    <TouchableOpacity
                        style={styles.removeFileButton}
                        onPress={() => setProofFile(null)}
                    >
                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                        <Text style={styles.removeFileText}>Remove File</Text>
                    </TouchableOpacity>
                )}

                <GradientButton
                    title={loading ? "Submitting..." : "Submit Correction Request"}
                    onPress={handleSubmit}
                    disabled={loading}
                    icon={<Ionicons name="paper-plane-outline" size={18} color="#FFF" />}
                    style={{ marginTop: 32 }}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        ...theme.shadow.light,
    },
    headerTitle: {
        ...theme.typography.h4,
        color: theme.colors.primary,
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    employeeName: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: 16,
    },
    recordInfo: {
        width: '100%',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    infoValue: {
        ...theme.typography.bodySmall,
        color: theme.colors.text,
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: 20,
        ...theme.shadow.light,
    },
    label: {
        ...theme.typography.label,
        marginBottom: 4,
        marginTop: 16,
    },
    helperText: {
        ...theme.typography.captionSmall,
        color: theme.colors.textTertiary,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    textArea: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: 12,
        fontSize: 14,
        color: theme.colors.text,
        backgroundColor: '#FFFFFF',
        minHeight: 120,
    },
    uploadButton: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: theme.borderRadius.md,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceAlt || '#F8FAFC',
    },
    uploadText: {
        marginTop: 12,
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    fileSizeText: {
        marginTop: 4,
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
    removeFileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        padding: 8,
        gap: 6,
    },
    removeFileText: {
        color: theme.colors.error,
        fontSize: 14,
        fontWeight: '500',
    }
});

export default RegularizationScreen;
