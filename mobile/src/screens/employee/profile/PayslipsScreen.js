import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePickerInput from '../../../components/common/DatePickerInput';
import PayslipModal from '../../../components/salarySlips/PayslipModal';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import theme from '../../../constants/theme';

const PayslipsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Date states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal & data
  const [modalVisible, setModalVisible] = useState(false);
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  // Validate dates
  const validateDates = () => {
    if (!fromDate || !toDate) {
      Alert.alert('Error', 'Please select both From Date and To Date');
      return false;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      Alert.alert('Error', 'From Date cannot be after To Date');
      return false;
    }
    return true;
  };

  // Fetch payslip
  const fetchPayslip = async () => {
    if (!validateDates()) return;
    if (!user || (!user.employeeCode && !user.emp_code)) {
      Alert.alert('Error', 'User information is missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const empCode = user.employeeCode || user.emp_code;
      const response = await api.get(`/payroll/payslip-range?empCode=${empCode}&fromDate=${fromDate}&toDate=${toDate}`);

      const data = response.data;
      if (!data || Object.keys(data).length === 0) {
        throw new Error('No payslip data found for this range');
      }

      setPayslipData(data);
      setModalVisible(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      Alert.alert('Error', `Failed to load payslip: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Download payslip
  const downloadPayslip = async () => {
    if (!validateDates()) return;
    if (!user || (!user.employeeCode && !user.emp_code)) {
      Alert.alert('Error', 'User information is missing');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const empCode = user.employeeCode || user.emp_code;
      const baseURL = api.defaults.baseURL.replace('/api', '');
      const url = `${baseURL}/api/payroll/download-range?empCode=${empCode}&fromDate=${fromDate}&toDate=${toDate}`;

      console.log(`Opening download link: ${url}`);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Could not open the download link`);
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to initiate download";
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={theme.colors.gradientHeader || ['#2563EB', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 15 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation?.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleText}>Pay Slips</Text>
              <Text style={styles.headerSubtext}>View or download your salary records</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Select Pay Period</Text>
          </View>

          <View style={styles.inputContainer}>
            <DatePickerInput
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              required
            />
            <View style={{ height: 12 }} />
            <DatePickerInput
              label="To Date"
              value={toDate}
              onChange={setToDate}
              required
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={fetchPayslip}
              disabled={loading || downloading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2563EB', '#1E40AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="eye-outline" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>VIEW SLIP</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={downloadPayslip}
              disabled={loading || downloading}
              activeOpacity={0.8}
            >
              {downloading ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>DOWNLOAD</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Instructional Section */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Important Note</Text>
          <Text style={styles.instructionText}>
            You can view or download payslips by selecting a valid date range.
            Usually, payslips are generated monthly.
          </Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.instructionItemText}>Check for correct employee code</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.instructionItemText}>Ensure the range is within 31 days</Text>
          </View>
        </View>
      </ScrollView>

      {/* Payslip Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PayslipModal
              data={payslipData}
              onClose={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    backgroundColor: '#FFF',
  },
  header: {
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    ...theme.shadow.medium,
    shadowOpacity: 0.08,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputContainer: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...theme.shadow.light,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFF',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  instructionCard: {
    marginTop: 25,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  instructionItemText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '85%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.shadow.dark,
  },
});

export default PayslipsScreen;
