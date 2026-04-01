import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';

const { width } = Dimensions.get('window');

const PayslipModal = ({ data, onClose }) => {
  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>No payslip data available</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format dates safely
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  const fromDateFormatted = formatDate(data.fromDate);
  const toDateFormatted = formatDate(data.toDate);

  // Safe access with fallbacks
  const safeData = {
    empCode: data.empCode || 'N/A',
    empName: data.empName || 'N/A',
    department: data.department || 'N/A',
    designation: data.designation || 'N/A',
    totalDaysInMonth: Number(data.totalDaysInMonth || 0),
    presentHalfDays: Number(data.presentHalfDays || 0),
    absentDays: Number(data.absentDays || 0),
    weeklyOffDays: Number(data.weeklyOffDays || 0),
    paidDays: Number(data.paidDays || 0),

    // Earnings
    monthlySalary: Number(data.monthlySalary || 0),
    perDaySalary: Number(data.perDaySalary || 0),
    performanceAllowance: Number(data.performanceAllowance || 0),
    otherAllowances: Number(data.otherAllowances || 0),
    petrolAllowance: Number(data.petrolAllowance || 0),
    reimbursement: Number(data.reimbursement || 0),
    grossSalary: Number(data.grossSalary || 0),

    // Deductions
    professionalTax: Number(data.professionalTax || 0),
    otherDeductions: Number(data.otherDeductions || 0),
    totalDeductions: Number(data.totalDeductions || 0),

    // Net
    netSalary: Number(data.netSalary || 0),
  };

  const infoRow = (label, value) => (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Payslip Details</Text>
            <Text style={styles.headerSubtitle}>{fromDateFormatted} - {toDateFormatted}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Company Identity */}
        <View style={styles.companyHeader}>
          <Text style={styles.companyName}>INFINITY ARTHVISHVA</Text>
          <Text style={styles.companyAddress}>Human Resources Department</Text>
        </View>

        {/* Employee Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.cardHeaderText}>Employee Information</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.row}>
              {infoRow('Code', safeData.empCode)}
              {infoRow('Name', safeData.empName)}
            </View>
            <View style={styles.row}>
              {infoRow('Dept', safeData.department)}
              {infoRow('Role', safeData.designation)}
            </View>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.cardHeaderText}>Attendance</Text>
          </View>
          <View style={styles.attendanceGrid}>
            <View style={styles.attItem}>
              <Text style={styles.attVal}>{safeData.totalDaysInMonth}</Text>
              <Text style={styles.attLab}>Days</Text>
            </View>
            <View style={styles.attDivider} />
            <View style={styles.attItem}>
              <Text style={styles.attVal}>{safeData.absentDays}</Text>
              <Text style={styles.attLab}>Absent</Text>
            </View>
            <View style={styles.attDivider} />
            <View style={styles.attItem}>
              <Text style={styles.attVal}>{safeData.paidDays.toFixed(1)}</Text>
              <Text style={styles.attLab}>Paid</Text>
            </View>
          </View>
        </View>

        {/* Financial Breakdown */}
        <View style={styles.dualGrid}>
          {/* Earnings */}
          <View style={[styles.miniCard, { backgroundColor: '#F0F9FF' }]}>
            <Text style={[styles.miniCardTitle, { color: '#0369A1' }]}>Earnings</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLab}>Basic Salary</Text>
              <Text style={styles.calcVal}>₹{safeData.monthlySalary.toLocaleString()}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLab}>Performance</Text>
              <Text style={styles.calcVal}>₹{safeData.performanceAllowance.toLocaleString()}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLab}>Allowances</Text>
              <Text style={styles.calcVal}>₹{safeData.otherAllowances.toLocaleString()}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLab}>Reimburse</Text>
              <Text style={styles.calcVal}>₹{safeData.reimbursement.toLocaleString()}</Text>
            </View>
            <View style={[styles.calcRow, styles.calcTotal]}>
              <Text style={styles.calcTotalLab}>Gross</Text>
              <Text style={styles.calcTotalVal}>₹{safeData.grossSalary.toLocaleString()}</Text>
            </View>
          </View>

          {/* Deductions */}
          <View style={[styles.miniCard, { backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.miniCardTitle, { color: '#B91C1C' }]}>Deductions</Text>
            <View style={styles.calcRow}>
              <Text style={styles.calcLab}>Prof Tax</Text>
              <Text style={styles.calcVal}>₹{safeData.professionalTax.toLocaleString()}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLab}>Other</Text>
              <Text style={styles.calcVal}>₹{safeData.otherDeductions.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={[styles.calcRow, styles.calcTotal]}>
              <Text style={styles.calcTotalLab}>Total</Text>
              <Text style={styles.calcTotalVal}>₹{safeData.totalDeductions.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Net Salary Highlight */}
        <View style={styles.netCard}>
          <Text style={styles.netLabel}>NET PAYABLE AMOUNT</Text>
          <Text style={styles.netAmount}>₹{safeData.netSalary.toLocaleString()}</Text>
          <View style={styles.netStatusPill}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.netStatusText}>Final Calculated Amount</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            Note: This is an electronically generated document and does not require a physical signature.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: 1,
  },
  companyAddress: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...theme.shadow.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 8,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  cardBody: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 20,
  },
  infoField: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  attendanceGrid: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  attItem: {
    alignItems: 'center',
  },
  attVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  attLab: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  attDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  dualGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 160,
  },
  miniCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLab: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  calcVal: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '700',
  },
  calcTotal: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  calcTotalLab: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  calcTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E293B',
  },
  netCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  netLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  netAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  netStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginTop: 15,
  },
  netStatusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  footerNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 25,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default PayslipModal;
