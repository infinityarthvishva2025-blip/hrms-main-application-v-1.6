import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const SectionHeader = ({ title, expanded, onPress }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.primary} />
    </TouchableOpacity>
);

const AddEmployeeScreen = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Expand/Collapse State
    const [sections, setSections] = useState({
        basic: true,
        personal: false,
        job: false,
        education: false,
        bank: false,
        emergency: false,
        documents: false
    });

    const toggleSection = (key) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateMode, setDateMode] = useState('date'); // 'date'
    const [activeDateField, setActiveDateField] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        // Basic
        name: '',
        email: '',
        mobileNumber: '',
        password: 'Password@123',

        // Personal
        gender: '',
        fatherName: '',
        motherName: '',
        dob_Date: null,
        maritalStatus: '',
        address: '',
        permanentAddress: '',

        // Job
        department: '',
        position: '',
        role: 'Employee',
        salary: '',
        joiningDate: new Date(),
        reportingManager: '',

        // Education
        hscPercent: '',
        graduationCourse: '',
        graduationPercent: '',
        postGraduationCourse: '',
        postGraduationPercent: '',

        // IDs
        aadhaarNumber: '',
        panNumber: '',

        // Bank
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        branch: '',

        // Emergency
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactMobile: '',
        emergencyContactAddress: ''
    });

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate && activeDateField) {
            setFormData(prev => ({ ...prev, [activeDateField]: selectedDate }));
        }
    };

    const openDatePicker = (field) => {
        setActiveDateField(field);
        setShowDatePicker(true);
    };

    const handleDocumentPick = async (field) => {
        Alert.alert("Info", "Document upload is not supported in this mobile version yet.");
        // try {
        //     const result = await DocumentPicker.getDocumentAsync({});
        //     if (result.type === 'success') {
        //         // Handle file... 
        //         // Would need FormData and API support
        //     }
        // } catch (err) {
        //     console.log('Document Picker Error', err);
        // }
    };

    const handleSubmit = async () => {
        // Basic Validation
        if (!formData.name || !formData.email || !formData.mobileNumber || !formData.department || !formData.position) {
            Alert.alert('Missing Fields', 'Please fill all required basic fields.');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            joiningDate: formData.joiningDate ? formData.joiningDate.toISOString() : null,
            dob_Date: formData.dob_Date ? formData.dob_Date.toISOString() : null,
            salary: formData.salary ? parseFloat(formData.salary) : 0,
            hscPercent: formData.hscPercent ? parseFloat(formData.hscPercent) : 0,
            graduationPercent: formData.graduationPercent ? parseFloat(formData.graduationPercent) : 0,
            postGraduationPercent: formData.postGraduationPercent ? parseFloat(formData.postGraduationPercent) : 0,
        };

        try {
            const response = await api.post('/employees', payload);
            if (response.data) {
                Alert.alert('Success', 'Employee created successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Create Employee Error:', error);
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ label, field, placeholder, keyboardType = 'default', secureTextEntry = false, required = false }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={formData[field]}
                onChangeText={(text) => handleChange(field, text)}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                placeholderTextColor={theme.colors.textTertiary}
            />
        </View>
    );

    const DateField = ({ label, field, required = false }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker(field)}>
                <Text style={styles.dateText}>
                    {formData[field] ? formData[field].toLocaleDateString() : 'Select Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Create New Employee</Text>
                    <Text style={styles.headerSubtitle}>Enter employee details as per web records.</Text>
                </View>

                {/* 1. BASIC DETAILS */}
                <View style={styles.card}>
                    <SectionHeader title="Basic Details" expanded={sections.basic} onPress={() => toggleSection('basic')} />
                    {sections.basic && (
                        <View style={styles.sectionContent}>
                            <InputField label="Full Name" field="name" placeholder="John Doe" required />
                            <InputField label="Email" field="email" placeholder="john@example.com" keyboardType="email-address" required />
                            <InputField label="Mobile" field="mobileNumber" placeholder="9876543210" keyboardType="phone-pad" required />
                            <InputField label="Password" field="password" placeholder="Pass@123" secureTextEntry required />
                        </View>
                    )}
                </View>

                {/* 2. PERSONAL DETAILS */}
                <View style={styles.card}>
                    <SectionHeader title="Personal Details" expanded={sections.personal} onPress={() => toggleSection('personal')} />
                    {sections.personal && (
                        <View style={styles.sectionContent}>
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="Gender" field="gender" placeholder="Male/Female" /></View>
                                <View style={styles.half}><DateField label="DOB" field="dob_Date" /></View>
                            </View>
                            <InputField label="Father's Name" field="fatherName" placeholder="Father Name" />
                            <InputField label="Mother's Name" field="motherName" placeholder="Mother Name" />
                            <InputField label="Marital Status" field="maritalStatus" placeholder="Single/Married" />
                            <InputField label="Current Address" field="address" placeholder="Full Address" />
                            <InputField label="Permanent Address" field="permanentAddress" placeholder="Full Address" />
                        </View>
                    )}
                </View>

                {/* 3. JOB DETAILS */}
                <View style={styles.card}>
                    <SectionHeader title="Job Details" expanded={sections.job} onPress={() => toggleSection('job')} />
                    {sections.job && (
                        <View style={styles.sectionContent}>
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="Department" field="department" placeholder="IT" required /></View>
                                <View style={styles.half}><InputField label="Position" field="position" placeholder="Developer" required /></View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="Role" field="role" placeholder="Employee" /></View>
                                <View style={styles.half}><InputField label="Salary" field="salary" placeholder="0.00" keyboardType="numeric" /></View>
                            </View>
                            <DateField label="Joining Date" field="joiningDate" required />
                            <InputField label="Reporting Manager" field="reportingManager" placeholder="Manager Name" />
                        </View>
                    )}
                </View>

                {/* 4. EDUCATION */}
                <View style={styles.card}>
                    <SectionHeader title="Education" expanded={sections.education} onPress={() => toggleSection('education')} />
                    {sections.education && (
                        <View style={styles.sectionContent}>
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="HSC %" field="hscPercent" placeholder="00.00" keyboardType="numeric" /></View>
                                <View style={styles.half}><InputField label="Grad %" field="graduationPercent" placeholder="00.00" keyboardType="numeric" /></View>
                            </View>
                            <InputField label="Graduation Course" field="graduationCourse" placeholder="B.Tech" />
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="PG Course" field="postGraduationCourse" placeholder="M.Tech" /></View>
                                <View style={styles.half}><InputField label="PG %" field="postGraduationPercent" placeholder="00.00" keyboardType="numeric" /></View>
                            </View>
                        </View>
                    )}
                </View>

                {/* 5. BANK & IDS */}
                <View style={styles.card}>
                    <SectionHeader title="Bank & IDs" expanded={sections.bank} onPress={() => toggleSection('bank')} />
                    {sections.bank && (
                        <View style={styles.sectionContent}>
                            <InputField label="Aadhaar No." field="aadhaarNumber" placeholder="1234 5678 9012" keyboardType="numeric" />
                            <InputField label="PAN No." field="panNumber" placeholder="ABCDE1234F" />
                            <InputField label="Account Holder" field="accountHolderName" placeholder="Name on Bank Account" />
                            <InputField label="Bank Name" field="bankName" placeholder="Bank Name" />
                            <InputField label="Account No." field="accountNumber" placeholder="Account Number" keyboardType="numeric" />
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="IFSC Code" field="ifsc" placeholder="IFSC" /></View>
                                <View style={styles.half}><InputField label="Branch" field="branch" placeholder="Branch" /></View>
                            </View>
                        </View>
                    )}
                </View>

                {/* 6. EMERGENCY */}
                <View style={styles.card}>
                    <SectionHeader title="Emergency Contact" expanded={sections.emergency} onPress={() => toggleSection('emergency')} />
                    {sections.emergency && (
                        <View style={styles.sectionContent}>
                            <InputField label="Contact Name" field="emergencyContactName" placeholder="Name" />
                            <View style={styles.row}>
                                <View style={styles.half}><InputField label="Relationship" field="emergencyContactRelationship" placeholder="Relation" /></View>
                                <View style={styles.half}><InputField label="Mobile" field="emergencyContactMobile" placeholder="Number" keyboardType="phone-pad" /></View>
                            </View>
                            <InputField label="Address" field="emergencyContactAddress" placeholder="Address" />
                        </View>
                    )}
                </View>

                {/* 7. DOCUMENTS (UI placeholder) */}
                <View style={styles.card}>
                    <SectionHeader title="Documents (View Only)" expanded={sections.documents} onPress={() => toggleSection('documents')} />
                    {sections.documents && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.note}>Document upload is currently available on the web portal only.</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={() => handleDocumentPick('profilePhoto')}>
                                <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.textSecondary} />
                                <Text style={styles.uploadBtnText}>Profile Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadBtn} onPress={() => handleDocumentPick('aadhaar')}>
                                <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.textSecondary} />
                                <Text style={styles.uploadBtnText}>Aadhaar Card</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Create Employee</Text>}
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={activeDateField && formData[activeDateField] ? formData[activeDateField] : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 16 },
    header: { marginBottom: 20 },
    headerTitle: { ...theme.typography.h2, marginBottom: 4 },
    headerSubtitle: { ...theme.typography.bodySmall, color: theme.colors.textSecondary },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        marginBottom: 16,
        ...theme.shadow.light,
        overflow: 'hidden'
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.surface, // or a slightly different shade
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    sectionContent: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
    },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: '600' },
    required: { color: theme.colors.error },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: theme.colors.background,
    },
    dateText: { fontSize: 14, color: theme.colors.text },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    half: { width: '48%' },
    submitButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        ...theme.shadow.medium,
    },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderStyle: 'dashed',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        justifyContent: 'center'
    },
    uploadBtnText: { marginLeft: 8, color: theme.colors.textSecondary, fontSize: 14 },
    note: { fontSize: 12, color: theme.colors.warning, marginBottom: 12, fontStyle: 'italic' }
});

export default AddEmployeeScreen;
