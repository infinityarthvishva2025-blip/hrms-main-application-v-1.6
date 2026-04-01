import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import DatePickerInput from '../../../components/common/DatePickerInput';
import api from '../../../services/api';

// Helper to format numbers with 2 decimals
const formatSalary = (value) => (value || 0).toFixed(2);

// Default date range: first and last day of the previous month
const getDefaultFromDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1, 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
};

const getDefaultToDate = () => {
  const date = new Date();
  // Day 0 of current month = last day of previous month
  date.setDate(0);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0];
};

const PayrollScreen = () => {
  // Date states
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getDefaultToDate());

  // Data states
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Table column definitions (widths for horizontal scrolling)
  const columns = [
    { label: 'Emp Code', width: 90 },
    { label: 'Name', width: 180 },
    { label: 'Working Days', width: 110 },
    { label: 'Half Days', width: 90 },
    { label: 'Absent Days', width: 100 },
    { label: 'Paid Days', width: 90 },
    { label: 'Basic Salary', width: 110 },
    { label: 'Gross Salary', width: 110 },
    { label: 'Deduction', width: 100 },
    { label: 'Net Salary', width: 110 },
    { label: 'Payslip', width: 110 },
  ];

  // Fetch payroll data from API
  const fetchPayroll = useCallback(async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/payroll/generate-range', {
        fromDate,
        toDate,
      });

      // the api returns { fromdate, tdate, payrolls }
      setPayrollData(response.data.payrolls || []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'failed to fetch payroal date';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  // Fetch on mount and whenever dates change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromDate && toDate) {
        fetchPayroll();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fromDate, toDate, fetchPayroll]);

  // Download payslip for a specific employee
  const downloadPayslip = async (empCode) => {
    if (!fromDate || !toDate) {
      Alert.alert('Error', 'PLease select a date range');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      // extract base url from axios config (removes trailing '/api')
      const baseURL = api.defaults.baseURL.replace('/api', '');
      const url = `${baseURL}/api/payroll/download-range?empCode=${empCode}&fromDate=${fromDate}&toDate=${toDate}`;
      // console.log(`Opening download link: ${url}`);

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open the download link');
      }
    } catch (err) {
      const errorMessage = err?.message || 'Failed to initiate download';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  // Render a single payroll row
  const renderRow = (item) => (
    <View style={styles.row} key={item.empCode}>
      <View style={[styles.cell, { width: columns[0].width }]}>
        <Text style={styles.cellText}>{item.empCode}</Text>
      </View>

      <View style={[styles.cell, { width: columns[1].width }]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {item.empName}
        </Text>
      </View>

      <View style={[styles.cell, { width: columns[2].width }]}>
        <Text style={styles.cellText}>
          {(item.totalDaysInMonth - item.absentDays).toFixed(2)}
        </Text>
      </View>

      <View style={[styles.cell, { width: columns[3].width }]}>
        <Text style={styles.cellText}>{item.presentHalfDays}</Text>
      </View>

      <View style={[styles.cell, { width: columns[4].width }]}>
        <Text style={styles.cellText}>{item.absentDays}</Text>
      </View>

      <View style={[styles.cell, { width: columns[5].width }]}>
        <Text style={styles.cellText}>{item.paidDays.toFixed(2)}</Text>
      </View>

      <View style={[styles.cell, { width: columns[6].width }]}>
        <Text style={styles.cellText}>{formatSalary(item.monthlySalary)}</Text>
      </View>

      <View style={[styles.cell, { width: columns[7].width }]}>
        <Text style={styles.cellText}>{formatSalary(item.grossSalary)}</Text>
      </View>

      <View style={[styles.cell, { width: columns[8].width }]}>
        <Text style={styles.cellText}>
          {formatSalary(item.totalDeductions)}
        </Text>
      </View>

      <View style={[styles.cell, { width: columns[9].width }]}>
        <Text style={styles.cellText}>{formatSalary(item.netSalary)}</Text>
      </View>

      <View style={[styles.cell, { width: columns[10].width }]}>
        <TouchableOpacity
          onPress={() => downloadPayslip(item.empCode)}
          disabled={downloading}
          activeOpacity={0.85}
          style={[
            styles.downloadButton,
            downloading && styles.downloadButtonDisabled,
          ]}
        >
          <Ionicons
            name="download-outline"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.downloadText}>Payslip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Premium filter bar (From Date + To Date + Export) */}
        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.filterTitle}>Payroll Range</Text>
          </View>

          {/* All three components in ONE horizontal row */}
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <DatePickerInput
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
                maximumDate={toDate ? new Date(toDate) : undefined}
                required
              />
            </View>

            <View style={styles.filterItem}>
              <DatePickerInput
                label="To Date"
                value={toDate}
                onChange={setToDate}
                minimumDate={fromDate ? new Date(fromDate) : undefined}
                required
              />
            </View>

            <TouchableOpacity
              style={styles.exportButton}
              activeOpacity={0.9}
              onPress={() => Alert.alert('Info', 'Excel export coming soon')}
            >
              <Ionicons
                name="download-outline"
                size={18}
                color={theme.colors.white}
              />
              <Text style={styles.exportButtonText} numberOfLines={1}>
                Export Excel
              </Text>
              <Text style={styles.exportButtonSubText} numberOfLines={1}>
                All Employees
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterHintRow}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.filterHintText}>
              Payroll auto-refreshes when you change dates.
            </Text>
          </View>
        </View>

        {/* Error message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={theme.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading payroll data...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && payrollData.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="document-text-outline"
                size={34}
                color={theme.colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No payroll data</Text>
            <Text style={styles.emptyText}>
              No payroll data for the selected date range.
            </Text>
          </View>
        )}

        {/* Payroll table */}
        {!loading && !error && payrollData.length > 0 && (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderBar}>
              <Text style={styles.tableTitle}>Payroll Summary</Text>
              <View style={styles.tableMeta}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={theme.colors.textTertiary}
                />
                <Text style={styles.tableMetaText}>
                  {fromDate} → {toDate}
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                {/* Table header */}
                <View style={styles.headerRow}>
                  {columns.map((col, index) => (
                    <View
                      key={index}
                      style={[styles.headerCell, { width: col.width }]}
                    >
                      <Text style={styles.headerText}>{col.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Table rows */}
                <ScrollView
                  showsVerticalScrollIndicator
                  refreshControl={
                    <RefreshControl
                      refreshing={loading}
                      onRefresh={fetchPayroll}
                      colors={[theme.colors.primary]}
                      tintColor={theme.colors.primary}
                    />
                  }
                >
                  {payrollData.map((item) => renderRow(item))}
                  <View style={styles.tableBottomSpacer} />
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },

  // Filter Card
  filterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.light,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterTitle: {
    ...theme.typography.h5,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },

  // One-row layout: From + To + Export
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  filterItem: {
    flex: 1,
    minWidth: 120,
  },

  exportButton: {
    width: 140,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    ...theme.shadow.light,
  },
  exportButtonText: {
    ...theme.typography.buttonSmall,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  exportButtonSubText: {
    ...theme.typography.captionSmall,
    color: theme.colors.white,
    opacity: Platform.OS === 'ios' ? 0.9 : 0.95,
    marginTop: 2,
    textAlign: 'center',
  },

  filterHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  filterHintText: {
    ...theme.typography.captionSmall,
    color: theme.colors.textTertiary,
  },

  // Error
  errorContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    flex: 1,
  },

  // Loading / Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.light,
  },
  emptyTitle: {
    ...theme.typography.h4,
    fontSize: 18,
    marginTop: theme.spacing.md,
    color: theme.colors.text,
  },
  emptyText: {
    marginTop: theme.spacing.xs,
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Table Card
  tableCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow.light,
  },
  tableHeaderBar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  tableTitle: {
    ...theme.typography.h5,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  tableMeta: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tableMetaText: {
    ...theme.typography.captionSmall,
    color: theme.colors.textTertiary,
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  headerCell: {
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerText: {
    ...theme.typography.label,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  cell: {
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
  },
  cellText: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
  },

  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadText: {
    ...theme.typography.captionSmall,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  tableBottomSpacer: {
    height: theme.spacing.md,
  },
});

export default PayrollScreen;