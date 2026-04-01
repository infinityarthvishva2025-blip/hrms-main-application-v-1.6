// screens/hrms/dailyreports/DailyReportsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import DatePickerInput from '../../../components/common/DatePickerInput';
import theme from '../../../constants/theme';

// Helper to format ISO date to "DD MMM YYYY"
const formatDisplayDate = (isoString) => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' }); // "Feb"
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DailyReportsScreen = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/DailyReportApi/mysent', {
        params: { selectedDate },
      });
      setReports(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const renderRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) {
      return <Text style={styles.placeholderText}>No recipients</Text>;
    }
    return recipients.map((recipient, index) => (
      <View key={index} style={styles.recipientItem}>
        <View style={styles.recipientInfo}>
          <Text style={styles.recipientName}>{recipient.receiverName}</Text>
          <Text style={styles.recipientRole}>{recipient.receiverRole}</Text>
        </View>
        <View
          style={[
            styles.readStatusBadge,
            recipient.isRead ? styles.readBadge : styles.unreadBadge,
          ]}
        >
          <Text
            style={[
              styles.readStatusText,
              recipient.isRead ? styles.readText : styles.unreadText,
            ]}
          >
            {recipient.isRead ? 'Read' : 'Unread'}
          </Text>
        </View>
      </View>
    ));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Header with date and ID */}
      <View style={styles.cardHeader}>
        <View style={styles.dateChip}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.dateText}>{formatDisplayDate(item.createdDate)}</Text>
        </View>
        <View style={styles.idChip}>
          <Text style={styles.idText}>#{item.id}</Text>
        </View>
      </View>

      {/* Today's Work */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Today's outcome</Text>
        <Text style={styles.sectionContent}>{item.todaysWork || 'Not reported'}</Text>
      </View>

      {/* Pending Work */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pipeline / pending</Text>
        <Text style={styles.sectionContent}>{item.pendingWork || 'None'}</Text>
      </View>

      {/* Issues */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Blockers & issues</Text>
        <Text style={styles.sectionContent}>{item.issues || 'No issues reported'}</Text>
      </View>

      {/* Attachment (if any) */}
      {item.attachment ? (
        <View style={styles.attachmentContainer}>
          <Ionicons name="attach-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.attachmentText} numberOfLines={1}>
            {item.attachment}
          </Text>
          <Ionicons name="chevron-forward-outline" size={16} color={theme.colors.primary} />
        </View>
      ) : null}

      {/* Recipients section */}
      <View style={styles.recipientsContainer}>
        <Text style={styles.sectionLabel}>Tracking & recipients</Text>
        {renderRecipients(item.recipients)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with date picker */}
      <View style={styles.header}>
        <DatePickerInput
          label="Report date"
          value={selectedDate}
          onChange={setSelectedDate}
          maximumDate={new Date()}
          style={styles.datePicker}
        />
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching reports…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && reports.length === 0 && (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No reports</Text>
          <Text style={styles.emptyMessage}>No reports documented for this date</Text>
        </View>
      )}

      {!loading && !error && reports.length > 0 && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadow.medium,
    marginBottom: theme.spacing.xs,
  },
  datePicker: {
    width: '100%',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  dateText: {
    ...theme.typography.captionSmall,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  idChip: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  idText: {
    ...theme.typography.captionSmall,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  sectionContent: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    gap: 8,
  },
  attachmentText: {
    flex: 1,
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  recipientsContainer: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  recipientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  recipientRole: {
    ...theme.typography.captionSmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  readStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
  },
  readBadge: {
    borderColor: theme.colors.success,
  },
  unreadBadge: {
    borderColor: theme.colors.warning,
  },
  readStatusText: {
    ...theme.typography.captionSmall,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readText: {
    color: theme.colors.success,
  },
  unreadText: {
    color: theme.colors.warning,
  },
  placeholderText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.error + '10', // light red using opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadow.medium,
  },
  retryButtonText: {
    ...theme.typography.buttonSmall,
    color: theme.colors.white,
    fontWeight: '700',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.h5,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyMessage: {
    ...theme.typography.body,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});

export default DailyReportsScreen;