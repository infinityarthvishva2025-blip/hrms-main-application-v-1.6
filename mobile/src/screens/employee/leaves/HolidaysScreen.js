/**
 * HolidaysScreen.js
 * ─────────────────────────────────────────────────────────
 * Premium Holidays screen with event-style cards and
 * next upcoming holiday highlight.
 *
 * Preserved Logic:
 *  • Fetches holidays from EmployeeService
 *  • Filters for 'Active' status
 *  • Sorts by date ascending
 *  • Pull-to-refresh
 *  • Loading / Empty states
 * ─────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import EmployeeService from '../../../services/employee/EmployeeService';

// ── Reusable Status Badge (Local) ──
const StatusBadge = ({ status }) => {
  // Map status to colors
  let bg = theme.colors.surfaceAlt;
  let text = theme.colors.textSecondary;

  if (status === 'Active') {
    bg = '#DCFCE7'; // Green-100
    text = '#166534'; // Green-800
  } else if (status === 'Inactive') {
    bg = '#F3F4F6';
    text = '#6B7280';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{status}</Text>
    </View>
  );
};

// ── Holiday Card Component ──
const HolidayCard = ({ holiday, index }) => {
  const dateObj = new Date(holiday.holidayDate);
  const dayNum = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear();
  const fullDate = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Check if it's the next upcoming holiday
  const isUpcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateObj >= today;
  }, [dateObj]);

  return (
    <View style={[styles.card, isUpcoming && styles.cardUpcoming]}>
      {/* Left Calendar Block */}
      <View style={styles.calendarBlock}>
        <View style={styles.monthStrip}>
          <Text style={styles.monthText}>{month.toUpperCase()}</Text>
        </View>
        <View style={styles.dayBlock}>
          <Text style={styles.dayNumText}>{dayNum}</Text>
          <Text style={styles.yearText}>{year}</Text>
        </View>
      </View>

      {/* Right Details */}
      <View style={styles.cardContent}>
        <View style={styles.contentHeader}>
          <StatusBadge status={holiday.status} />
          {holiday.day && (
            <View style={styles.weekdayBadge}>
              <Text style={styles.weekdayText}>{holiday.day}</Text>
            </View>
          )}
        </View>
        <Text style={styles.holidayName} numberOfLines={2}>
          {holiday.holidayName}
        </Text>
        <Text style={styles.fullDate}>{fullDate}</Text>
      </View>

      {/* Decorative Circle */}
      <View style={styles.decoCircle} />
    </View>
  );
};

// ── Main Screen ──
const HolidaysScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holidaysData, setHolidaysData] = useState([]);

  const fetchHolidays = useCallback(async () => {
    try {
      const data = await EmployeeService.getHolidays();
      setHolidaysData(data || []);
    } catch (error) {
      console.error('Fetch holiday error:', error);
      Alert.alert('Error', 'Failed to load holiday data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Filter active & sort (Existing Logic)
  const activeHolidays = useMemo(() => {
    return (holidaysData || [])
      .filter((item) => item.status === 'Active')
      .sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate));
  }, [holidaysData]);

  // Compute stats for header
  const upcomingCount = activeHolidays.filter(
    (h) => new Date(h.holidayDate) >= new Date().setHours(0, 0, 0, 0)
  ).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHolidays();
  }, [fetchHolidays]);

  const renderItem = ({ item, index }) => <HolidayCard holiday={item} index={index} />;

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Text style={{ fontSize: 40 }}>🏖️</Text>
      </View>
      <Text style={styles.emptyTitle}>No holidays found</Text>
      <Text style={styles.emptySubtitle}>
        There are no active holidays scheduled at the moment.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ══ Gradient Header ══ */}
      <LinearGradient
        colors={theme.colors.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Public Holidays</Text>
            <Text style={styles.headerSubtitle}>
              {new Date().getFullYear()} Calendar
            </Text>
          </View>
        </View>

        {/* Sub-header info */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>Total: {activeHolidays.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Ionicons name="star" size={14} color="#FDE68A" />
            <Text style={[styles.statText, { color: '#FDE68A' }]}>
              Upcoming: {upcomingCount}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ══ Content ══ */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : (
        <FlatList
          data={activeHolidays}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={ListEmptyComponent}
        />
      )}
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
  // Header
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },

  // Loading / Empty
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },

  // List
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.light,
  },
  cardUpcoming: {
    borderColor: theme.colors.primary + '50', // Light blue border
    backgroundColor: '#F8FAFF',
    ...theme.shadow.medium,
  },
  calendarBlock: {
    width: 80,
    backgroundColor: '#F1F5F9', // light slate
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.divider,
  },
  monthStrip: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dayBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dayNumText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textTertiary,
  },

  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekdayBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weekdayText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  fullDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  decoCircle: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    opacity: 0.03,
  },
});

export default HolidaysScreen;