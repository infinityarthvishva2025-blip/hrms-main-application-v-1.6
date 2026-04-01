import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import DatePickerInput from '../../../components/common/DatePickerInput';
import theme from '../../../constants/theme';

const DailyReportInboxScreen = ({ navigation }) => {
  const { role } = useAuth();
  const normalizedRole = role?.toLowerCase();

  // Role‑based access: visible only for Director, GM, Manager, VP
  const canViewReports =
    normalizedRole === 'manager' ||
    normalizedRole === 'director' ||
    normalizedRole === 'gm' ||
    normalizedRole === 'vp';

  // Redirect if not allowed
  useEffect(() => {
    if (!canViewReports) {
      navigation.replace('MoreMenu');
    }
  }, [canViewReports]);

  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch reports when selectedDate changes
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/DailyReportApi/inbox', {
        params: { selectedDate },
      });
      setReports(response.data);
    } catch (err) {
      console.error('Fetch reports error:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Mark report as read
  const markAsRead = async (reportId) => {
    setUpdatingId(reportId);
    try {
      await api.post(`/DailyReportApi/mark-read/${reportId}`);
      // Update local state: set isRead to true for that report
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId ? { ...report, isRead: true } : report
        )
      );
    } catch (err) {
      console.error('Mark as read error:', err);
      Alert.alert('Error', 'Failed to mark as read. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Format date for display
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Render table header
  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.colFrom]}>From</Text>
      <Text style={[styles.headerCell, styles.colRole]}>Role</Text>
      <Text style={[styles.headerCell, styles.colDate]}>Date</Text>
      <Text style={[styles.headerCell, styles.colReport]}>Report</Text>
      <Text style={[styles.headerCell, styles.colStatus]}>Status</Text>
    </View>
  );

  // Render each row
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      {/* From */}
      <Text style={[styles.cell, styles.colFrom]} numberOfLines={1}>
        {item.sender || 'N/A'}
      </Text>

      {/* Role – if not available, display placeholder */}
      <Text style={[styles.cell, styles.colRole]} numberOfLines={1}>
        {item.role || 'Employee'}
      </Text>

      {/* Date */}
      <Text style={[styles.cell, styles.colDate]}>
        {formatDate(item.createdDate)}
      </Text>

      {/* Report column with View button */}
      <View style={[styles.cell, styles.colReport]}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            setSelectedReport(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>

      {/* Status column with Mark as Read checkbox/button */}
      <View style={[styles.cell, styles.colStatus]}>
        {item.isRead ? (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
        ) : (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => markAsRead(item.id)}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator size="small" color={theme.colors.brandBlue} />
            ) : (
              <Text style={styles.markReadText}>Mark as Read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Empty list placeholder
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={theme.colors.textLight} />
      <Text style={styles.emptyText}>No reports found for this date</Text>
    </View>
  );

  if (!canViewReports) {
    return null; // Will be redirected by useEffect
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Date picker */}
      <View style={styles.datePickerContainer}>
        <DatePickerInput
          label="Select Date"
          value={selectedDate}
          onChange={setSelectedDate}
          maximumDate={new Date()} // can't select future dates
        />
      </View>

      {/* Table header */}
      {renderHeader()}

      {/* Report list */}
      {loading && reports.length === 0 ? (
        <ActivityIndicator size="large" color={theme.colors.brandBlue} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchReports} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Report Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From:</Text>
                  <Text style={styles.detailValue}>{selectedReport.sender}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedReport.createdDate)}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Today's Work</Text>
                  <Text style={styles.detailSectionText}>
                    {selectedReport.todaysWork || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Pending Work</Text>
                  <Text style={styles.detailSectionText}>
                    {selectedReport.pendingWork || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Issues</Text>
                  <Text style={styles.detailSectionText}>
                    {selectedReport.issues || 'N/A'}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  datePickerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 13,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  cell: {
    fontSize: 14,
    color: theme.colors.text,
  },
  colFrom: {
    flex: 2,
  },
  colRole: {
    flex: 1,
  },
  colDate: {
    flex: 1.2,
  },
  colReport: {
    flex: 1,

    alignItems: 'center',
  },
  colStatus: {
    flex: 1.5,
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  markReadButton: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  markReadText: {
    color: theme.colors.brandBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: theme.colors.brandBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
  },
  listContent: {
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  detailSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
  },
  detailSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
  },
  detailSectionText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.brandBlue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default  DailyReportInboxScreen;