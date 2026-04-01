/**
 * ProfileScreen.js
 * ─────────────────────────────────────────────────────────────
 * My Profile – matches My_Profile.html functionality exactly.
 *
 *  • Fetches employee by ID (GET /api/employees/{id})
 *  • Profile photo via ViewDocument API, falls back to initials
 *  • 8 data sections with "View Document" deep links
 *  • Edit button navigates to EditProfile screen
 *  • Pull-to-refresh
 * ─────────────────────────────────────────────────────────────
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../constants/theme';
import EmployeeService from '../../services/employee/EmployeeService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── Helper: format date string ───────────────────────────────
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return 'N/A';
    }
};

// ─── Helper: check if value is meaningful ─────────────────────
const hasValue = (v) => v && v !== '-' && v !== 'null';

// ─── Sub-component: single info row ───────────────────────────
const InfoRow = ({ icon, label, value }) => {
    if (!hasValue(value)) return null;
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
                <Ionicons name={icon} size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
};

// ─── Sub-component: document button ───────────────────────────
const DocButton = ({ label, empCode, fileName }) => {
    const url = EmployeeService.getDocumentUrl(empCode, fileName);
    if (!url) return null;
    return (
        <TouchableOpacity
            style={styles.docBtn}
            onPress={() => Linking.openURL(url).catch(() =>
                Alert.alert('Error', 'Cannot open document')
            )}
        >
            <Ionicons name="document-text-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.docBtnText}>{label}</Text>
        </TouchableOpacity>
    );
};

// ─── Sub-component: section card ──────────────────────────────
const SectionCard = ({ title, icon, children }) => (
    <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
                <Ionicons name={icon} size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionBody}>{children}</View>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [emp, setEmp] = useState(null);
    const [photoError, setPhotoError] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const id = user?.employeeId;
            if (!id) throw new Error('No employee ID in session');
            const data = await EmployeeService.getEmployeeById(id);
            setEmp(data);
            setPhotoError(false);
        } catch (error) {
            console.error('Fetch profile error:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleRefresh = () => { setRefreshing(true); fetchProfile(); };

    // ── Loading ──
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    // ── Error ──
    if (!emp) {
        return (
            <View style={styles.center}>
                <View style={styles.errorIconBg}>
                    <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
                </View>
                <Text style={styles.errorText}>Failed to load profile</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const initials = emp.name
        ? emp.name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    const photoUrl = EmployeeService.getDocumentUrl(emp.employeeCode, emp.profileImagePath);

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
                }
            >
                {/* ── Banner with theme gradient ── */}
                <LinearGradient
                    colors={theme.colors.gradientHeader}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.banner, { paddingTop: insets.top }]}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditProfile', { employeeId: emp.id })}
                        >
                            <Ionicons name="create" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* ── Profile Header Card (overlaps banner) ── */}
                <View style={styles.profileHeaderCard}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarRing}>
                            {photoUrl && !photoError ? (
                                <Image
                                    source={{ uri: photoUrl }}
                                    style={styles.avatarPhoto}
                                    onError={() => setPhotoError(true)}
                                />
                            ) : (
                                <View style={styles.avatarImage}>
                                    <Text style={styles.avatarInitial}>{initials}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{emp.name}</Text>
                        <Text style={styles.profileRole}>{emp.position || emp.role || 'Professional'}</Text>
                        <View style={styles.profileMetaRow}>
                            <View style={styles.idChip}>
                                <Text style={styles.idText}>{emp.employeeCode}</Text>
                            </View>
                            <View style={[styles.statusPill,
                                { backgroundColor: emp.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                <Text style={[styles.statusPillText,
                                    { color: emp.status === 'Active' ? '#16A34A' : '#DC2626' }]}>
                                    {emp.status || 'Unknown'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── 1. Basic / Personal ── */}
                <SectionCard title="Personal Information" icon="person-outline">
                    <InfoRow icon="mail-outline" label="Email" value={emp.email} />
                    <InfoRow icon="call-outline" label="Mobile" value={emp.mobileNumber} />
                    <InfoRow icon="call-outline" label="Alternate Mobile" value={emp.alternateMobileNumber} />
                    <InfoRow icon="male-female-outline" label="Gender" value={emp.gender} />
                    <InfoRow icon="calendar-outline" label="Date of Birth" value={formatDate(emp.doB_Date)} />
                    <InfoRow icon="heart-outline" label="Marital Status" value={emp.maritalStatus} />
                    <InfoRow icon="person-outline" label="Father's Name" value={emp.fatherName} />
                    <InfoRow icon="person-outline" label="Mother's Name" value={emp.motherName} />
                </SectionCard>

                {/* ── 2. Address ── */}
                <SectionCard title="Address" icon="location-outline">
                    <InfoRow icon="home-outline" label="Current Address" value={emp.address} />
                    <InfoRow icon="home-outline" label="Permanent Address" value={emp.permanentAddress} />
                </SectionCard>

                {/* ── 3. Job Details ── */}
                <SectionCard title="Job Details" icon="briefcase-outline">
                    <InfoRow icon="calendar-outline" label="Joining Date" value={formatDate(emp.joiningDate)} />
                    <InfoRow icon="business-outline" label="Department" value={emp.department} />
                    <InfoRow icon="ribbon-outline" label="Position" value={emp.position} />
                    <InfoRow icon="shield-checkmark-outline" label="Role" value={emp.role} />
                    <InfoRow icon="person-outline" label="Reporting Manager" value={emp.reportingManager} />
                    <InfoRow icon="cash-outline" label="Salary" value={emp.salary ? `₹ ${emp.salary.toLocaleString()}` : null} />
                    <InfoRow icon="hourglass-outline" label="Experience" value={
                        emp.totalExperienceYears > 0 ? `${emp.totalExperienceYears} yr(s)` : 'Fresher'
                    } />
                    <InfoRow icon="briefcase-outline" label="Last Company" value={emp.lastCompanyName} />

                    {/* View Payslips Button */}
                    <TouchableOpacity
                        style={[styles.docBtn, { marginTop: 16, alignSelf: 'flex-start' }]}
                        onPress={() => navigation.navigate('Payslips')}
                    >
                        <Ionicons name="document-text" size={16} color={theme.colors.primary} />
                        <Text style={styles.docBtnText}>View Payslips</Text>
                    </TouchableOpacity>
                </SectionCard>

                {/* ── 4. Education ── */}
                <SectionCard title="Education" icon="school-outline">
                    <InfoRow icon="document-text-outline" label="12th Percentage" value={emp.hscPercent ? `${emp.hscPercent}%` : null} />
                    <InfoRow icon="document-text-outline" label="Graduation" value={
                        emp.graduationCourse ? `${emp.graduationCourse} (${emp.graduationPercent}%)` : null
                    } />
                    <InfoRow icon="document-text-outline" label="Post Graduation" value={
                        emp.postGraduationCourse ? `${emp.postGraduationCourse} (${emp.postGraduationPercent}%)` : null
                    } />
                    <View style={styles.docRow}>
                        <DocButton label="12th Marksheet" empCode={emp.employeeCode} fileName={emp.twelfthMarksheetFilePath} />
                        <DocButton label="Graduation" empCode={emp.employeeCode} fileName={emp.graduationMarksheetFilePath} />
                        <DocButton label="Post Graduation" empCode={emp.employeeCode} fileName={emp.postGraduationMarksheetFilePath} />
                    </View>
                </SectionCard>

                {/* ── 5. ID Proofs ── */}
                <SectionCard title="ID Proofs" icon="card-outline">
                    <InfoRow icon="finger-print-outline" label="Aadhaar Number" value={emp.aadhaarNumber} />
                    <InfoRow icon="card-outline" label="PAN Number" value={emp.panNumber} />
                    <View style={styles.docRow}>
                        <DocButton label="View Aadhaar" empCode={emp.employeeCode} fileName={emp.aadhaarFilePath} />
                        <DocButton label="View PAN" empCode={emp.employeeCode} fileName={emp.panFilePath} />
                    </View>
                </SectionCard>

                {/* ── 6. Bank Details ── */}
                <SectionCard title="Bank Details" icon="wallet-outline">
                    <InfoRow icon="person-circle-outline" label="Account Holder" value={emp.accountHolderName} />
                    <InfoRow icon="business-outline" label="Bank Name" value={emp.bankName} />
                    <InfoRow icon="pricetag-outline" label="Account Number" value={emp.accountNumber} />
                    <InfoRow icon="qr-code-outline" label="IFSC" value={emp.ifsc} />
                    <InfoRow icon="location-outline" label="Branch" value={emp.branch} />
                    <View style={styles.docRow}>
                        <DocButton label="View Passbook" empCode={emp.employeeCode} fileName={emp.passbookFilePath} />
                    </View>
                </SectionCard>

                {/* ── 7. Emergency Contact ── */}
                <SectionCard title="Emergency Contact" icon="medkit-outline">
                    <InfoRow icon="person-outline" label="Name" value={emp.emergencyContactName} />
                    <InfoRow icon="people-outline" label="Relationship" value={emp.emergencyContactRelationship} />
                    <InfoRow icon="call-outline" label="Mobile" value={emp.emergencyContactMobile} />
                    <InfoRow icon="home-outline" label="Address" value={emp.emergencyContactAddress} />
                </SectionCard>

                {/* ── 8. Health ── */}
                <SectionCard title="Health Information" icon="fitness-outline">
                    <InfoRow icon="medkit-outline" label="Pre-existing Disease?" value={emp.hasDisease} />
                    {emp.hasDisease === 'Yes' && <>
                        <InfoRow icon="alert-outline" label="Disease Name" value={emp.diseaseName} />
                        <InfoRow icon="alert-outline" label="Disease Type" value={emp.diseaseType} />
                        <InfoRow icon="calendar-outline" label="Since" value={emp.diseaseSince} />
                        <InfoRow icon="medical-outline" label="Medicines Required" value={emp.medicinesRequired} />
                        <InfoRow icon="person-outline" label="Doctor Name" value={emp.doctorName} />
                        <InfoRow icon="call-outline" label="Doctor Contact" value={emp.doctorContact} />
                    </>}
                    <View style={styles.docRow}>
                        <DocButton label="Medical Document" empCode={emp.employeeCode} fileName={emp.medicalDocumentFilePath} />
                    </View>
                </SectionCard>

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
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC',
    },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },
    errorIconBg: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    errorText: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
    retryBtn: { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: theme.colors.primary, borderRadius: 12 },
    retryBtnText: { color: '#FFF', fontWeight: '700' },

    // Banner
    banner: {
        height: 140,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerTop: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
    editButton: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },

    // Profile header card (overlaps banner)
    profileHeaderCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: -40,
        padding: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    avatarWrapper: {
        marginRight: 16,
    },
    avatarRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarPhoto: { width: '100%', height: '100%', borderRadius: 45 },
    avatarImage: {
        flex: 1, borderRadius: 45, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarInitial: { fontSize: 34, fontWeight: '900', color: theme.colors.primary },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    profileRole: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
        marginBottom: 8,
    },
    profileMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    idChip: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: '#F1F5F9',
    },
    idText: { fontSize: 12, fontWeight: '700', color: '#334155', letterSpacing: 0.5 },
    statusPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 100 },
    statusPillText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Content
    scrollContent: { paddingTop: 0, paddingBottom: 40 },

    // Section Card (unchanged)
    sectionCard: {
        backgroundColor: '#FFF', borderRadius: 24, marginHorizontal: 16, marginBottom: 20,
        overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 12, elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
        backgroundColor: '#F8FAFC',
    },
    sectionIconBg: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', letterSpacing: 0.3 },
    sectionBody: { padding: 20 },

    // Info Row (unchanged)
    infoRow: { flexDirection: 'row', marginBottom: 18 },
    infoIconBox: { width: 32, alignItems: 'center', marginRight: 12, paddingTop: 4 },
    infoContent: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
    infoLabel: {
        fontSize: 10, color: '#94A3B8',
        textTransform: 'uppercase', fontWeight: '800', marginBottom: 4, letterSpacing: 1,
    },
    infoValue: { fontSize: 15, fontWeight: '600', color: '#1E293B', lineHeight: 22 },

    // Document buttons (unchanged)
    docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    docBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1, borderColor: '#3B82F6', backgroundColor: '#EFF6FF',
    },
    docBtnText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
});

export default ProfileScreen;