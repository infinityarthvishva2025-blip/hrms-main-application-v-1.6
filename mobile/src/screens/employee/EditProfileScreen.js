/**
 * EditProfileScreen.js
 * ─────────────────────────────────────────────────────────────
 * Edit Employee Profile – sends ALL fields as multipart/form-data.
 *  • GET /api/employees/{id} → pre-fills every field.
 *  • Stores full original employee object (ensures no key is lost).
 *  • Profile photo + 9 document file pickers (expo-image-picker / expo-document-picker).
 *  • Strict inline validation per field; submit blocked until valid.
 *  • All non-file empty/null/undefined fields sent as "-" (backend rule).
 *  • PUT /api/employees/{id} via multipart/form-data.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import theme from '../../constants/theme';
import EmployeeService from '../../services/employee/EmployeeService';

// ─── Helpers ──────────────────────────────────────────────────
const v = (val) => (val === null || val === undefined || val === '-' ? '' : String(val));

const dateToInput = (d) => {
    if (!d || d === '-') return '';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch { return ''; }
};

const fileBasename = (path) => {
    if (!path || path === '-') return null;
    return path.split('/').pop().split('\\').pop();
};

// ─── Validation helper ────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_RE   = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE  = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const validateForm = (form, confirmPassword) => {
    const errs = {};
    if (!form.name?.trim())                                       errs.name = 'Full Name is required';
    if (!form.email?.trim() || !EMAIL_RE.test(form.email.trim())) errs.email = 'Valid email is required';
    if (!form.mobileNumber?.trim() || !/^\d{10}$/.test(form.mobileNumber.trim()))
        errs.mobileNumber = 'Mobile must be exactly 10 digits';
    if (form.alternateMobileNumber?.trim() && !/^\d{10}$/.test(form.alternateMobileNumber.trim()))
        errs.alternateMobileNumber = 'Alternate mobile must be 10 digits';
    if (form.password && form.password.length < 6)
        errs.password = 'Password must be at least 6 characters';
    if (form.password && form.password !== confirmPassword)
        errs.confirmPassword = 'Passwords do not match';
    if (form.aadhaarNumber?.trim() && !/^\d{12}$/.test(form.aadhaarNumber.trim()))
        errs.aadhaarNumber = 'Aadhaar must be 12 digits';
    if (form.panNumber?.trim() && !PAN_RE.test(form.panNumber.trim().toUpperCase()))
        errs.panNumber = 'PAN must be in format AAAAA9999A';
    if (form.ifsc?.trim() && !IFSC_RE.test(form.ifsc.trim().toUpperCase()))
        errs.ifsc = 'IFSC must be in format AAAA0XXXXXX';
    if (form.accountNumber?.trim() && !/^\d+$/.test(form.accountNumber.trim()))
        errs.accountNumber = 'Account number must be numeric';
    if (form.salary !== undefined && form.salary !== '' && form.salary !== null) {
        const s = Number(form.salary);
        if (isNaN(s) || s < 0) errs.salary = 'Salary must be a non-negative number';
    }
    if (form.hscPercent !== undefined && form.hscPercent !== '' && form.hscPercent !== null) {
        const p = Number(form.hscPercent);
        if (isNaN(p) || p < 0 || p > 100) errs.hscPercent = '12th % must be 0–100';
    }
    if (form.graduationPercent !== undefined && form.graduationPercent !== '' && form.graduationPercent !== null) {
        const p = Number(form.graduationPercent);
        if (isNaN(p) || p < 0 || p > 100) errs.graduationPercent = 'Graduation % must be 0–100';
    }
    if (form.postGraduationPercent !== undefined && form.postGraduationPercent !== '' && form.postGraduationPercent !== null) {
        const p = Number(form.postGraduationPercent);
        if (isNaN(p) || p < 0 || p > 100) errs.postGraduationPercent = 'PG % must be 0–100';
    }
    if (form.totalExperienceYears !== undefined && form.totalExperienceYears !== '' && form.totalExperienceYears !== null) {
        const y = Number(form.totalExperienceYears);
        if (isNaN(y) || y < 0 || !Number.isInteger(y)) errs.totalExperienceYears = 'Experience must be a non-negative integer';
    }
    if (form.emergencyContactMobile?.trim() && !/^\d{10}$/.test(form.emergencyContactMobile.trim()))
        errs.emergencyContactMobile = 'Emergency mobile must be 10 digits';
    if (form.doctorContact?.trim() && !/^\d{10}$/.test(form.doctorContact.trim()))
        errs.doctorContact = 'Doctor contact must be 10 digits';
    if (form.hasDisease === 'Yes') {
        if (!form.diseaseName?.trim()) errs.diseaseName = 'Disease Name is required';
        if (!form.diseaseType?.trim()) errs.diseaseType = 'Disease Type is required';
    }
    return errs;
};

// ─── Sub-components ───────────────────────────────────────────

const PickerField = ({ label, value, options, onChange, error }) => {
    const [open, setOpen] = useState(false);
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TouchableOpacity style={[styles.input, styles.pickerBtn, error && styles.inputError]}
                onPress={() => setOpen(!open)}>
                <Text style={value ? styles.pickerText : styles.pickerPlaceholder}>
                    {value || '-- Select --'}
                </Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
            </TouchableOpacity>
            {open && (
                <View style={styles.pickerDropdown}>
                    {options.map(opt => (
                        <TouchableOpacity key={opt}
                            style={[styles.pickerOption, value === opt && styles.pickerOptionSelected]}
                            onPress={() => { onChange(opt); setOpen(false); }}>
                            <Text style={[styles.pickerOptionText, value === opt && styles.pickerOptionTextSelected]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const FieldInput = ({ label, value, onChange, multiline = false, keyboardType = 'default', editable = true, secureTextEntry = false, autoCapitalize = 'sentences', error }) => (
    <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={[styles.input, multiline && styles.inputMulti, !editable && styles.inputReadonly, error && styles.inputError]}
            value={value ?? ''}
            onChangeText={onChange}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            keyboardType={keyboardType}
            editable={editable}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            placeholderTextColor="#9CA3AF"
        />
        {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

const PasswordField = ({ label, value, onChange, error }) => {
    const [show, setShow] = useState(false);
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.passwordRow, error && styles.inputError]}>
                <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)}>
                    <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const SectionCard = ({ title, icon, children }) => (
    <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
                <Ionicons name={icon} size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionBody}>{children}</View>
    </View>
);

// File picker field – shows current file name and a pick button
const FilePickerField = ({ label, currentPath, pickedFile, onPick, acceptImages = false }) => {
    const displayName = pickedFile
        ? pickedFile.name
        : fileBasename(currentPath)
            ? `📎 ${fileBasename(currentPath)}`
            : null;
    return (
        <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.fileRow}>
                <View style={styles.fileNameBox}>
                    <Text style={[styles.fileNameText, !displayName && styles.fileNamePlaceholder]} numberOfLines={1}>
                        {displayName || 'No file selected'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.filePickBtn} onPress={onPick}>
                    <Ionicons name={acceptImages ? 'camera-outline' : 'attach-outline'} size={16} color="#FFF" />
                    <Text style={styles.filePickBtnText}>Pick</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────
const EditProfileScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { employeeId } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalEmployee, setOriginalEmployee] = useState(null);
    const [form, setForm] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [sameAddress, setSameAddress] = useState(false);
    const [errors, setErrors] = useState({});

    // File state – only set when user picks a NEW file
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [passbookFile, setPassbookFile] = useState(null);
    const [tenthFile, setTenthFile] = useState(null);
    const [twelfthFile, setTwelfthFile] = useState(null);
    const [graduationFile, setGraduationFile] = useState(null);
    const [postGraduationFile, setPostGraduationFile] = useState(null);
    const [medicalFile, setMedicalFile] = useState(null);
    const [experienceCertFile, setExperienceCertFile] = useState(null);

    // ── Load employee ──
    const loadEmployee = useCallback(async () => {
        try {
            const data = await EmployeeService.getEmployeeById(employeeId);
            setOriginalEmployee(data);
            const f = { ...data };
            if (!f.password) f.password = '';
            setConfirmPassword(f.password);
            setForm(f);
        } catch {
            Alert.alert('Error', 'Failed to load employee data');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => { loadEmployee(); }, [loadEmployee]);

    const setField = (key) => (value) => setForm(prev => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (sameAddress && form) {
            setForm(prev => ({ ...prev, permanentAddress: prev.address }));
        }
    }, [sameAddress, form?.address]);

    // ── Image picker ──
    const pickProfilePhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.mediaTypes.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            const name = asset.fileName || `profile_${Date.now()}.jpg`;
            const type = asset.mimeType || 'image/jpeg';
            setProfilePhotoFile({ uri: asset.uri, name, type });
        }
    };

    // ── Document picker ──
    const pickDocument = async (setter) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                setter({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream' });
            }
        } catch {
            Alert.alert('Error', 'Could not pick document');
        }
    };

    // ── Build FormData payload ──
    const buildFormData = (payload, confirmPwd) => {
        const fd = new FormData();

        // Helper: coerce text value → "-" if empty/null/undefined
        const safe = (val) => {
            if (val === null || val === undefined || val === '' || val === '-') return '-';
            return String(val);
        };

        // Helper: format date for backend
        const safeDate = (val) => {
            if (!val || val === '-' || val === '') return '-';
            // If already ISO string, trim time part or keep as-is
            const d = new Date(val);
            if (isNaN(d.getTime())) return '-';
            return `${d.toISOString().split('T')[0]}T00:00:00`;
        };

        // --- Non-file text fields (all must be sent) ---
        const textFields = {
            employeeCode: safe(payload.employeeCode),
            name: safe(payload.name),
            email: safe(payload.email),
            mobileNumber: safe(payload.mobileNumber),
            alternateMobileNumber: safe(payload.alternateMobileNumber),
            password: safe(payload.password),
            confirmPassword: safe(confirmPwd),
            gender: safe(payload.gender),
            fatherName: safe(payload.fatherName),
            motherName: safe(payload.motherName),
            doB_Date: safeDate(payload.doB_Date),
            maritalStatus: safe(payload.maritalStatus),
            experienceType: safe(payload.experienceType),
            totalExperienceYears: payload.totalExperienceYears !== null && payload.totalExperienceYears !== undefined && payload.totalExperienceYears !== ''
                ? String(Number(payload.totalExperienceYears) || 0) : '-',
            lastCompanyName: safe(payload.lastCompanyName),
            joiningDate: safeDate(payload.joiningDate),
            department: safe(payload.department),
            position: safe(payload.position),
            salary: payload.salary !== null && payload.salary !== undefined && payload.salary !== ''
                ? String(Number(payload.salary) || 0) : '-',
            reportingManager: safe(payload.reportingManager),
            managerId: payload.managerId !== null && payload.managerId !== undefined
                ? String(payload.managerId) : '-',
            role: safe(payload.role),
            address: safe(payload.address),
            permanentAddress: safe(payload.permanentAddress),
            hscPercent: payload.hscPercent !== null && payload.hscPercent !== undefined && payload.hscPercent !== ''
                ? String(Number(payload.hscPercent) || 0) : '-',
            graduationCourse: safe(payload.graduationCourse),
            graduationPercent: payload.graduationPercent !== null && payload.graduationPercent !== undefined && payload.graduationPercent !== ''
                ? String(Number(payload.graduationPercent) || 0) : '-',
            postGraduationCourse: safe(payload.postGraduationCourse),
            postGraduationPercent: payload.postGraduationPercent !== null && payload.postGraduationPercent !== undefined && payload.postGraduationPercent !== ''
                ? String(Number(payload.postGraduationPercent) || 0) : '-',
            aadhaarNumber: safe(payload.aadhaarNumber),
            panNumber: safe(payload.panNumber),
            accountHolderName: safe(payload.accountHolderName),
            bankName: safe(payload.bankName),
            accountNumber: safe(payload.accountNumber),
            ifsc: safe(payload.ifsc),
            branch: safe(payload.branch),
            emergencyContactName: safe(payload.emergencyContactName),
            emergencyContactRelationship: safe(payload.emergencyContactRelationship),
            emergencyContactMobile: safe(payload.emergencyContactMobile),
            emergencyContactAddress: safe(payload.emergencyContactAddress),
            hasDisease: safe(payload.hasDisease),
            diseaseName: safe(payload.diseaseName),
            diseaseType: safe(payload.diseaseType),
            diseaseSince: safe(payload.diseaseSince),
            medicinesRequired: safe(payload.medicinesRequired),
            doctorName: safe(payload.doctorName),
            doctorContact: safe(payload.doctorContact),
            lastAffectedDate: safe(payload.lastAffectedDate),
            // System / readonly fields – sent from original
            status: safe(payload.status),
            deactiveReason: safe(payload.deactiveReason),
            compOffBalance: payload.compOffBalance !== null && payload.compOffBalance !== undefined
                ? String(payload.compOffBalance) : '-',
            passwordHash: safe(payload.passwordHash),
            failedLoginAttempts: payload.failedLoginAttempts !== null && payload.failedLoginAttempts !== undefined
                ? String(payload.failedLoginAttempts) : '-',
            createdAt: payload.createdAt ? safeDate(payload.createdAt) : '-',
            lastCompOffEarnedDate: payload.lastCompOffEarnedDate ? safeDate(payload.lastCompOffEarnedDate) : '-',
            lockoutEndUtc: payload.lockoutEndUtc ? safeDate(payload.lockoutEndUtc) : '-',
            // Existing file path strings (backend uses these to detect if path changed)
            profileImagePath: safe(payload.profileImagePath),
            aadhaarFilePath: safe(payload.aadhaarFilePath),
            panFilePath: safe(payload.panFilePath),
            passbookFilePath: safe(payload.passbookFilePath),
            tenthMarksheetFilePath: safe(payload.tenthMarksheetFilePath),
            twelfthMarksheetFilePath: safe(payload.twelfthMarksheetFilePath),
            graduationMarksheetFilePath: safe(payload.graduationMarksheetFilePath),
            postGraduationMarksheetFilePath: safe(payload.postGraduationMarksheetFilePath),
            medicalDocumentFilePath: safe(payload.medicalDocumentFilePath),
            experienceCertificateFilePath: safe(payload.experienceCertificateFilePath),
        };

        Object.entries(textFields).forEach(([key, val]) => fd.append(key, val));

        // --- File fields – only appended if user picked a new file ---
        const appendFile = (key, file) => {
            if (file) {
                fd.append(key, { uri: file.uri, name: file.name, type: file.type });
            }
        };
        appendFile('profilePhoto', profilePhotoFile);
        appendFile('aadhaarFile', aadhaarFile);
        appendFile('panFile', panFile);
        appendFile('passbookFile', passbookFile);
        appendFile('tenthMarksheetFile', tenthFile);
        appendFile('twelfthMarksheetFile', twelfthFile);
        appendFile('graduationMarksheetFile', graduationFile);
        appendFile('postGraduationMarksheetFile', postGraduationFile);
        appendFile('medicalDocumentFile', medicalFile);
        appendFile('experienceCertificateFile', experienceCertFile);

        return fd;
    };

    // ── Submit ──
    const handleSave = async () => {
        // Merge form into originalEmployee first
        const merged = { ...originalEmployee, ...form };

        const errs = validateForm(merged, confirmPassword);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            Alert.alert('Validation Error', 'Please fix the highlighted errors before saving.');
            return;
        }
        setErrors({});
        setSaving(true);
        try {
            const fd = buildFormData(merged, confirmPassword);
            await EmployeeService.updateEmployee(employeeId, fd);
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Update failed';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading employee data...</Text>
            </View>
        );
    }
    if (!form || !originalEmployee) return null;

    // Profile photo preview
    const photoPreviewUri = profilePhotoFile?.uri
        || EmployeeService.getDocumentUrl(form.employeeCode, form.profileImagePath);
    const initials = form.name
        ? form.name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerBgContainer}>
                <LinearGradient
                    colors={theme.colors.gradientHeader}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitleText}>Edit Profile</Text>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={styles.headerSubRow}>
                        <Ionicons name="person-circle" size={18} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.headerSubText}>{form.name}  ·  {form.employeeCode}</Text>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Profile Photo ── */}
                <SectionCard title="Profile Photo" icon="camera-outline">
                    <View style={styles.photoSection}>
                        <View style={styles.avatarRing}>
                            {photoPreviewUri ? (
                                <Image source={{ uri: photoPreviewUri }} style={styles.avatarPhoto} />
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Text style={styles.avatarInitial}>{initials}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.photoPickBtn} onPress={pickProfilePhoto}>
                            <Ionicons name="camera" size={18} color="#FFF" />
                            <Text style={styles.photoPickBtnText}>Change Photo</Text>
                        </TouchableOpacity>
                    </View>
                </SectionCard>

                {/* ── 1. Basic Details ── */}
                <SectionCard title="Basic Details" icon="person-outline">
                    <FieldInput label="Employee Code" value={v(form.employeeCode)} onChange={setField('employeeCode')} editable={false} />
                    <FieldInput label="Full Name *" value={v(form.name)} onChange={setField('name')} error={errors.name} autoCapitalize="words" />
                    <FieldInput label="Email *" value={v(form.email)} onChange={setField('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                    <FieldInput label="Mobile Number *" value={v(form.mobileNumber)} onChange={setField('mobileNumber')} keyboardType="phone-pad" autoCapitalize="none" error={errors.mobileNumber} />
                    <FieldInput label="Alternate Mobile" value={v(form.alternateMobileNumber)} onChange={setField('alternateMobileNumber')} keyboardType="phone-pad" autoCapitalize="none" error={errors.alternateMobileNumber} />
                    <PasswordField label="Password" value={form.password} onChange={setField('password')} error={errors.password} />
                    <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} />
                </SectionCard>

                {/* ── 2. Personal Details ── */}
                <SectionCard title="Personal Details" icon="happy-outline">
                    <PickerField label="Gender" value={form.gender} onChange={setField('gender')} options={['Male', 'Female', 'Other']} />
                    <FieldInput label="Father's Name" value={v(form.fatherName)} onChange={setField('fatherName')} autoCapitalize="words" />
                    <FieldInput label="Mother's Name" value={v(form.motherName)} onChange={setField('motherName')} autoCapitalize="words" />
                    <FieldInput label="Date of Birth (YYYY-MM-DD)" value={dateToInput(form.doB_Date)} onChange={setField('doB_Date')} autoCapitalize="none" />
                    <PickerField label="Marital Status" value={form.maritalStatus} onChange={setField('maritalStatus')} options={['Single', 'Married', 'Divorced', 'Widowed']} />
                    <FieldInput label="Current Address" value={v(form.address)} onChange={(val) => {
                        setField('address')(val);
                        if (sameAddress) setForm(prev => ({ ...prev, address: val, permanentAddress: val }));
                    }} multiline />
                    <View style={styles.switchRow}>
                        <Switch
                            value={sameAddress}
                            onValueChange={setSameAddress}
                            trackColor={{ true: theme.colors.primary }}
                        />
                        <Text style={styles.switchLabel}>Permanent address same as current</Text>
                    </View>
                    <FieldInput label="Permanent Address" value={v(form.permanentAddress)} onChange={setField('permanentAddress')} multiline editable={!sameAddress} />
                </SectionCard>

                {/* ── 3. Job Details ── */}
                <SectionCard title="Job Details" icon="business-outline">
                    <FieldInput label="Joining Date (YYYY-MM-DD)" value={dateToInput(form.joiningDate)} onChange={setField('joiningDate')} autoCapitalize="none" />
                    <FieldInput label="Department" value={v(form.department)} onChange={setField('department')} autoCapitalize="words" />
                    <FieldInput label="Position" value={v(form.position)} onChange={setField('position')} autoCapitalize="words" />
                    <PickerField label="Role" value={form.role} onChange={setField('role')} options={['Intern', 'Employee', 'HR', 'Manager', 'GM', 'VP', 'Director']} />
                    <FieldInput label="Reporting Manager" value={v(form.reportingManager)} onChange={setField('reportingManager')} autoCapitalize="words" />
                    <FieldInput label="Manager ID" value={v(form.managerId)} onChange={setField('managerId')} keyboardType="numeric" editable={false} />
                    <FieldInput label="Salary" value={form.salary !== null && form.salary !== undefined ? String(form.salary) : ''} onChange={setField('salary')} keyboardType="numeric" autoCapitalize="none" error={errors.salary} />
                </SectionCard>

                {/* ── 4. Experience ── */}
                <SectionCard title="Experience Details" icon="briefcase-outline">
                    <PickerField label="Experience Type" value={form.experienceType} onChange={setField('experienceType')} options={['Fresher', 'Experienced']} />
                    <FieldInput label="Total Experience (Years)" value={form.totalExperienceYears !== null && form.totalExperienceYears !== undefined ? String(form.totalExperienceYears) : ''} onChange={setField('totalExperienceYears')} keyboardType="numeric" autoCapitalize="none" error={errors.totalExperienceYears} />
                    <FieldInput label="Last Company Name" value={v(form.lastCompanyName)} onChange={setField('lastCompanyName')} autoCapitalize="words" />
                    <FilePickerField
                        label="Experience Certificate"
                        currentPath={form.experienceCertificateFilePath}
                        pickedFile={experienceCertFile}
                        onPick={() => pickDocument(setExperienceCertFile)}
                    />
                </SectionCard>

                {/* ── 5. Education ── */}
                <SectionCard title="Education" icon="school-outline">
                    <FieldInput label="12th Percentage" value={form.hscPercent !== null && form.hscPercent !== undefined ? String(form.hscPercent) : ''} onChange={setField('hscPercent')} keyboardType="numeric" autoCapitalize="none" error={errors.hscPercent} />
                    <FilePickerField label="10th Marksheet" currentPath={form.tenthMarksheetFilePath} pickedFile={tenthFile} onPick={() => pickDocument(setTenthFile)} />
                    <FilePickerField label="12th Marksheet" currentPath={form.twelfthMarksheetFilePath} pickedFile={twelfthFile} onPick={() => pickDocument(setTwelfthFile)} />
                    <FieldInput label="Graduation Course" value={v(form.graduationCourse)} onChange={setField('graduationCourse')} autoCapitalize="words" />
                    <FieldInput label="Graduation %" value={form.graduationPercent !== null && form.graduationPercent !== undefined ? String(form.graduationPercent) : ''} onChange={setField('graduationPercent')} keyboardType="numeric" autoCapitalize="none" error={errors.graduationPercent} />
                    <FilePickerField label="Graduation Marksheet" currentPath={form.graduationMarksheetFilePath} pickedFile={graduationFile} onPick={() => pickDocument(setGraduationFile)} />
                    <FieldInput label="Post Graduation Course" value={v(form.postGraduationCourse)} onChange={setField('postGraduationCourse')} autoCapitalize="words" />
                    <FieldInput label="Post Graduation %" value={form.postGraduationPercent !== null && form.postGraduationPercent !== undefined ? String(form.postGraduationPercent) : ''} onChange={setField('postGraduationPercent')} keyboardType="numeric" autoCapitalize="none" error={errors.postGraduationPercent} />
                    <FilePickerField label="PG Marksheet" currentPath={form.postGraduationMarksheetFilePath} pickedFile={postGraduationFile} onPick={() => pickDocument(setPostGraduationFile)} />
                </SectionCard>

                {/* ── 6. ID Proofs ── */}
                <SectionCard title="ID Proofs" icon="card-outline">
                    <FieldInput label="Aadhaar Number (12 digits)" value={v(form.aadhaarNumber)} onChange={setField('aadhaarNumber')} keyboardType="numeric" autoCapitalize="none" error={errors.aadhaarNumber} />
                    <FilePickerField label="Aadhaar File" currentPath={form.aadhaarFilePath} pickedFile={aadhaarFile} onPick={() => pickDocument(setAadhaarFile)} />
                    <FieldInput label="PAN Number (AAAAA9999A)" value={v(form.panNumber)} onChange={(val) => setField('panNumber')(val.toUpperCase())} autoCapitalize="characters" error={errors.panNumber} />
                    <FilePickerField label="PAN File" currentPath={form.panFilePath} pickedFile={panFile} onPick={() => pickDocument(setPanFile)} />
                </SectionCard>

                {/* ── 7. Bank Details ── */}
                <SectionCard title="Bank Details" icon="wallet-outline">
                    <FieldInput label="Account Holder Name" value={v(form.accountHolderName)} onChange={setField('accountHolderName')} autoCapitalize="words" />
                    <FieldInput label="Bank Name" value={v(form.bankName)} onChange={setField('bankName')} autoCapitalize="words" />
                    <FieldInput label="Account Number (numeric)" value={v(form.accountNumber)} onChange={setField('accountNumber')} keyboardType="numeric" autoCapitalize="none" error={errors.accountNumber} />
                    <FieldInput label="IFSC Code" value={v(form.ifsc)} onChange={(val) => setField('ifsc')(val.toUpperCase())} autoCapitalize="characters" error={errors.ifsc} />
                    <FieldInput label="Branch" value={v(form.branch)} onChange={setField('branch')} autoCapitalize="words" />
                    <FilePickerField label="Passbook / Cancelled Cheque" currentPath={form.passbookFilePath} pickedFile={passbookFile} onPick={() => pickDocument(setPassbookFile)} />
                </SectionCard>

                {/* ── 8. Emergency Contact ── */}
                <SectionCard title="Emergency Contact" icon="medkit-outline">
                    <FieldInput label="Contact Name" value={v(form.emergencyContactName)} onChange={setField('emergencyContactName')} autoCapitalize="words" />
                    <FieldInput label="Relationship" value={v(form.emergencyContactRelationship)} onChange={setField('emergencyContactRelationship')} autoCapitalize="words" />
                    <FieldInput label="Mobile" value={v(form.emergencyContactMobile)} onChange={setField('emergencyContactMobile')} keyboardType="phone-pad" autoCapitalize="none" error={errors.emergencyContactMobile} />
                    <FieldInput label="Address" value={v(form.emergencyContactAddress)} onChange={setField('emergencyContactAddress')} multiline />
                </SectionCard>

                {/* ── 9. Health Information ── */}
                <SectionCard title="Health Information" icon="fitness-outline">
                    <PickerField label="Pre-existing Disease?" value={form.hasDisease} onChange={setField('hasDisease')} options={['No', 'Yes']} />
                    {form.hasDisease === 'Yes' && <>
                        <FieldInput label="Disease Name *" value={v(form.diseaseName)} onChange={setField('diseaseName')} error={errors.diseaseName} />
                        <FieldInput label="Disease Type *" value={v(form.diseaseType)} onChange={setField('diseaseType')} error={errors.diseaseType} />
                        <FieldInput label="Since" value={v(form.diseaseSince)} onChange={setField('diseaseSince')} />
                        <FieldInput label="Medicines Required" value={v(form.medicinesRequired)} onChange={setField('medicinesRequired')} />
                        <FieldInput label="Doctor Name" value={v(form.doctorName)} onChange={setField('doctorName')} autoCapitalize="words" />
                        <FieldInput label="Doctor Contact" value={v(form.doctorContact)} onChange={setField('doctorContact')} keyboardType="phone-pad" autoCapitalize="none" error={errors.doctorContact} />
                        <FieldInput label="Last Affected Date (YYYY-MM-DD)" value={v(form.lastAffectedDate)} onChange={setField('lastAffectedDate')} autoCapitalize="none" />
                    </>}
                    <FilePickerField label="Medical Document" currentPath={form.medicalDocumentFilePath} pickedFile={medicalFile} onPick={() => pickDocument(setMedicalFile)} />
                </SectionCard>

                {/* ── Save Button ── */}
                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#FFF" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                            <Text style={styles.saveBtnText}>Save Changes</Text>
                        </>
                    }
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },

    headerBgContainer: {
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        backgroundColor: theme.colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
    },
    headerGradient: { paddingBottom: 24 },
    headerTop: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, marginBottom: 12,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
    headerTitleText: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
    headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 4 },
    headerSubText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

    scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },

    // Section Card
    sectionCard: {
        backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20,
        overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
        backgroundColor: '#F8FAFC',
    },
    sectionIconBg: {
        width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
    sectionBody: { padding: 20 },

    // Profile photo
    photoSection: { alignItems: 'center', gap: 14 },
    avatarRing: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, borderColor: theme.colors.primary,
        overflow: 'hidden',
    },
    avatarPhoto: { width: '100%', height: '100%' },
    avatarFallback: { flex: 1, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 34, fontWeight: '900', color: theme.colors.primary },
    photoPickBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.primary, paddingHorizontal: 20,
        paddingVertical: 10, borderRadius: 12,
    },
    photoPickBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    // Fields
    fieldWrap: { marginBottom: 18 },
    fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.2 },
    input: {
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
        fontWeight: '500',
    },
    inputMulti: { minHeight: 100, textAlignVertical: 'top' },
    inputReadonly: { backgroundColor: '#F1F5F9', color: '#64748B', borderColor: '#F1F5F9' },
    inputError: { borderColor: '#EF4444' },
    errorText: { color: '#EF4444', fontSize: 11, fontWeight: '600', marginTop: 4 },

    // Password
    passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC' },
    passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 14, color: '#1E293B', fontWeight: '500' },
    eyeBtn: { paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 11 },

    // Picker
    pickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 14, color: '#1E293B', fontWeight: '500' },
    pickerPlaceholder: { fontSize: 14, color: '#94A3B8' },
    pickerDropdown: {
        borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12,
        backgroundColor: '#FFF', marginTop: 8, overflow: 'hidden',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, zIndex: 999,
    },
    pickerOption: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    pickerOptionSelected: { backgroundColor: '#EFF6FF' },
    pickerOptionText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    pickerOptionTextSelected: { color: theme.colors.primary, fontWeight: '700' },

    // Switch row
    switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    switchLabel: { fontSize: 13, color: '#475569', flex: 1, fontWeight: '600' },

    // File picker
    fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fileNameBox: {
        flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
        backgroundColor: '#F8FAFC',
    },
    fileNameText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
    fileNamePlaceholder: { color: '#94A3B8' },
    filePickBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.primary, paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 14 : 10, borderRadius: 12,
    },
    filePickBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

    // Save button
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: theme.colors.primary, borderRadius: 16,
        paddingVertical: 18, marginTop: 12,
        shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
});

export default EditProfileScreen;