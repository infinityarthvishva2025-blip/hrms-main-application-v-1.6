import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-gifted-charts';
import theme from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 72;

// ---------- Dynamic greeting based on hour ----------
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user, accessToken, logout } = useAuth();
  const { attendanceStatus, checkInTime, remainingSeconds } = useAttendance();

  const [dashboard, setDashboard] = useState(null);
  const [celebrations, setCelebrations] = useState({ todaysBirthdays: [], tomorrowsBirthdays: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [attendanceBreakdown, setAttendanceBreakdown] = useState({
    present: 0,
    leave: 0,
    holiday: 0,
    absent: 0,
  });
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const employeeId = useMemo(() => user?.employeeId || null, [user]);

  // ---------- Fetch Dashboard ----------
  const fetchDashboard = useCallback(async () => {
    if (!employeeId) {
      setErrorMsg('Employee ID not available.');
      setLoading(false);
      return;
    }
    if (!accessToken) {
      setErrorMsg('Session expired. Please login again.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const dashboardPromise = api.get(`/employees/dashboard/${employeeId}?month=${selectedMonth}&year=${selectedYear}`);
      const celebrationsPromise = api.get('/employees/celebrations').catch(e => {
        console.log('Celebrations API failed softly:', e.message);
        return { data: { todaysBirthdays: [], tomorrowsBirthdays: [] }, ok: false };
      });

      const [dashboardRes, celebrationsRes] = await Promise.all([
        dashboardPromise,
        celebrationsPromise,
      ]);

      const dashboardData = dashboardRes.data;
      setDashboard(dashboardData);

      const breakdown = {
        present: dashboardData.presentDays ?? 0,
        leave: dashboardData.leaveDays ?? 0,
        holiday: dashboardData.holidayDays ?? 0,
        absent: dashboardData.absentDays ?? 0,
      };
      setAttendanceBreakdown(breakdown);

      if (celebrationsRes.ok !== false) {
        const celebrationsData = celebrationsRes.data;
        //   console.log(celebrationsData);
        setCelebrations(celebrationsData);
      }
    } catch (error) {
      console.log('Dashboard API Error:', error);
      setErrorMsg(error.message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedMonth, selectedYear, accessToken, logout]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ---------- Chart data ----------
  const chartData = useMemo(() => {
    const { present, leave, holiday, absent } = attendanceBreakdown;
    return [
      { value: present, label: 'Present', frontColor: '#22C55E', gradientColor: '#86EFAC' },
      { value: leave, label: 'Leave', frontColor: '#F97316', gradientColor: '#FDBA74' },
      { value: holiday, label: 'Holiday', frontColor: '#3B82F6', gradientColor: '#93C5FD' },
      { value: absent, label: 'Absent', frontColor: '#EF4444', gradientColor: '#FCA5A5' },
    ];
  }, [attendanceBreakdown]);

  // ---------- Month navigation ----------
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // ---------- Loading & Error ----------
  if (loading && !dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.center, { padding: 20 }]}>
        <View style={[styles.card, styles.errorCard]}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle" size={32} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboard} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const leaveDays = dashboard?.leaveDays ?? 0;
  const approvedLeaves = dashboard?.employee?.totalLeaves ?? 0;
  const department = dashboard?.employee?.department || '';
  const position = dashboard?.employee?.position || '';
  const hasCelebrations =
    (celebrations?.todaysBirthdays && celebrations.todaysBirthdays.length > 0) ||
    (celebrations?.tomorrowsBirthdays && celebrations.tomorrowsBirthdays.length > 0);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ───────── HEADER ───────── */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={theme.colors.gradientHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => navigation.navigate('More', { screen: 'ProfileScreen', initial: false })}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarText}>{user?.employeeName?.charAt(0) || 'U'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => navigation.navigate('More', { screen: 'AnnouncementsScreen', initial: false })}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={22} color="white" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>

            {/* Welcome */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
              <Text style={styles.welcomeName}>{user?.employeeName || 'Employee'}</Text>
              <View style={styles.empCodeBadge}>
                <Ionicons name="id-card-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.empCodeText}>{user?.employeeCode || 'EMP000'}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Overlapping Status Card */}
          <View style={styles.statusCardWrapper}>
            <View style={[styles.statusCard, theme.shadow.medium]}>
              <View style={styles.statusLeft}>
                <Text style={styles.statusLabel}>CURRENT STATUS</Text>
                <View
                  style={[
                    styles.statusBadge,
                    attendanceStatus === 'CHECKED_IN' ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: attendanceStatus === 'CHECKED_IN' ? theme.colors.success : theme.colors.textTertiary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      attendanceStatus === 'CHECKED_IN' ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {attendanceStatus === 'CHECKED_IN' ? 'On Duty' : 'Off Duty'}
                  </Text>
                </View>
              </View>

              {attendanceStatus === 'CHECKED_IN' && (
                <View style={styles.timerContainer}>
                  <Text style={styles.timerLabel}>SHIFT ENDS IN</Text>
                  <Text style={styles.timerValue}>{formatCountdown(remainingSeconds)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ───────── MAIN CONTENT ───────── */}
        <View style={styles.mainContent}>

          {/* QUICK ACTIONS
           *  ─────────────────────────────────────────────────────────────────
           *  This DashboardScreen is shared by BOTH EmployeeNavigator and
           *  HRNavigator. Their tab structures differ:
           *
           *    EmployeeNavigator: Home | Attendance | Leaves | More
           *    HRNavigator:       Home | Employees  | Approvals | More
           *
           *  Admin-level roles (HR / Director / GM / VP) have NO 'Attendance'
           *  or 'Leaves' tab. All self-service screens for those roles live
           *  inside the HR 'More' stack.  We must route based on role.
           *  ─────────────────────────────────────────────────────────────────*/}
          <View style={[styles.card, styles.quickActionsCard]}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <QuickActionItem
                icon="location"
                label="Mark Attendance"
                colors={['#2076C7', '#5BA3E0']}
                onPress={() => {
                  const role = user?.role;
                  const isAdminRole = ['HR', 'Director', 'GM', 'VP'].includes(role);
                  if (isAdminRole) {
                    // HR Navigator: MarkAttendance is in the More stack
                    navigation.navigate('More', { screen: 'MarkAttendance', initial: false });
                  } else {
                    // Employee Navigator: MarkAttendance is in the Attendance tab stack
                    navigation.navigate('Attendance', { screen: 'MarkAttendance', initial: false });
                  }
                }}
              />
              <QuickActionItem
                icon="stats-chart"
                label="Summary"
                colors={['#1CADA3', '#34D6CB']}
                onPress={() => {
                  const role = user?.role;
                  const isAdminRole = ['HR', 'Director', 'GM', 'VP'].includes(role);
                  if (isAdminRole) {
                    // HR Navigator: AttendanceSummary (single 'y') is in the More stack
                    navigation.navigate('More', { screen: 'AttendanceSummary', initial: false });
                  } else {
                    // Employee Navigator: AttendanceSummary is in Attendance tab
                    navigation.navigate('Attendance', { screen: 'AttendanceSummary', initial: false });
                  }
                }}
              />
              <QuickActionItem
                icon="document-text"
                label="Apply Leave"
                colors={['#0D9488', '#28C4B4']}
                onPress={() => {
                  const role = user?.role;
                  const isAdminRole = ['HR', 'Director', 'GM', 'VP'].includes(role);
                  if (isAdminRole) {
                    // HR Navigator: ApplyLeave is in the More stack
                    navigation.navigate('More', { screen: 'ApplyLeave', initial: false });
                  } else {
                    // Employee Navigator: ApplyLeave is in the Leaves tab stack
                    navigation.navigate('Leaves', { screen: 'ApplyLeave', initial: false });
                  }
                }}
              />
              <QuickActionItem
                icon="wallet"
                label="Payslips"
                colors={['#8B5CF6', '#A78BFA']}
                onPress={() => navigation.navigate('More', { screen: 'Payslips', initial: false })}
              />
            </View>
          </View>

          {/* OVERVIEW STATS */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statsCard, theme.shadow.light]}>
              <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.statsIconBg}>
                <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
              </LinearGradient>
              <Text style={styles.statsValue}>{leaveDays}</Text>
              <Text style={styles.statsLabel}>Total Leaves</Text>
            </View>
            <View style={[styles.statsCard, theme.shadow.light]}>
              <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.statsIconBg}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
              </LinearGradient>
              <Text style={styles.statsValue}>{approvedLeaves}</Text>
              <Text style={styles.statsLabel}>Approved</Text>
            </View>
          </View>

          {/* MONTH / YEAR PICKER */}
          <View style={[styles.card, styles.monthPickerCard]}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.monthCenterBlock}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.monthYearText}>
                {monthNames[selectedMonth - 1]} {selectedYear}
              </Text>
            </View>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ATTENDANCE CHART */}
          <View style={[styles.card, styles.chartCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderIcon}>
                <Ionicons name="bar-chart-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Attendance Summary</Text>
            </View>

            {breakdownLoading ? (
              <View style={styles.chartLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.chartLoaderText}>Loading chart…</Text>
              </View>
            ) : chartData.every(item => item.value === 0) ? (
              <View style={styles.emptyChartContainer}>
                <View style={styles.emptyChartIcon}>
                  <Ionicons name="pie-chart-outline" size={36} color={theme.colors.textTertiary} />
                </View>
                <Text style={styles.emptyChartTitle}>No Data Available</Text>
                <Text style={styles.emptyChartText}>No attendance data for this month</Text>
              </View>
            ) : (
              <View style={styles.chartWrapper}>
                <BarChart
                  data={chartData}
                  width={CHART_WIDTH}
                  height={180}
                  barWidth={36}
                  barBorderRadius={8}
                  spacing={20}
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  noOfSections={4}
                  maxValue={Math.max(...chartData.map(d => d.value), 5)}
                  isAnimated={false}
                  showValuesAsTopLabel
                  topLabelTextStyle={styles.topLabel}
                  xAxisLabelTextStyle={styles.xAxisLabel}
                  yAxisTextStyle={styles.yAxisText}
                />
                {/* Legend */}
                <View style={styles.legendRow}>
                  {chartData.map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.frontColor }]} />
                      <Text style={styles.legendText}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* PROFILE CARD */}
          <TouchableOpacity
            style={[styles.profileCard, theme.shadow.light]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('More', { screen: 'ProfileScreen', initial: false })}
          >
            <View style={styles.profileRow}>
              <LinearGradient colors={theme.colors.gradientPrimary} style={styles.profileIconContainer}>
                <Ionicons name="person" size={18} color="white" />
              </LinearGradient>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{department || 'Department'}</Text>
                <Text style={styles.profileRole}>{position || 'Position'}</Text>
              </View>
              <View style={styles.profileChevron}>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* CELEBRATIONS */}
          <View style={[styles.card, styles.celebrationCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="gift-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.cardTitle}>Celebrations</Text>
            </View>

            {!hasCelebrations ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="happy-outline"
                  size={28}
                  color={theme.colors.textTertiary}
                />
                <Text style={styles.emptyStateText}>
                  No celebrations today or tomorrow
                </Text>
              </View>
            ) : (
              <View>
                {celebrations?.todaysBirthdays?.length > 0 && (
                  <View style={styles.celebrationSection}>
                    <Text style={styles.celebrationLabel}>
                      🎂 Today's Birthdays
                    </Text>

                    {celebrations.todaysBirthdays.map((emp, index) => (
                      <View key={`today-${index}`} style={styles.celebrationItem}>
                        <LinearGradient
                          colors={['#FEF3C7', '#FDE68A']}
                          style={styles.celebrationAvatar}
                        >
                          <Text style={styles.celebrationAvatarText}>
                            {emp.name?.charAt(0) || 'U'}
                          </Text>
                        </LinearGradient>

                        <View style={styles.celebrationInfo}>
                          <Text style={styles.celebrationName}>
                            {emp.name}
                          </Text>
                          <Text style={styles.celebrationRole}>
                            {emp.department || 'Employee'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {celebrations?.tomorrowsBirthdays?.length > 0 && (
                  <View
                    style={[
                      styles.celebrationSection,
                      celebrations?.todaysBirthdays?.length > 0 &&
                      styles.celebrationSectionBorder,
                    ]}
                  >
                    <Text style={styles.celebrationLabel}>
                      🎈 Tomorrow's Birthdays
                    </Text>

                    {celebrations.tomorrowsBirthdays.map((emp, index) => (
                      <View key={`tomorrow-${index}`} style={styles.celebrationItem}>
                        <LinearGradient
                          colors={['#E0F2FE', '#BAE6FD']}
                          style={styles.celebrationAvatar}
                        >
                          <Text
                            style={[
                              styles.celebrationAvatarText,
                              { color: '#0284C7' },
                            ]}
                          >
                            {emp.name?.charAt(0) || 'U'}
                          </Text>
                        </LinearGradient>

                        <View style={styles.celebrationInfo}>
                          <Text style={styles.celebrationName}>
                            {emp.name}
                          </Text>
                          <Text style={styles.celebrationRole}>
                            {emp.department || 'Employee'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}


          </View>

        </View>
      </ScrollView>
    </View>
  );
};

// ---------- Helpers ----------
const formatCountdown = (seconds) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

// QuickActionItem — circular gradient icon with label
const QuickActionItem = ({ icon, label, colors, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.quickActionItem, pressed && styles.quickActionPressed]}
  >
    <LinearGradient colors={colors} style={styles.quickActionCircle}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
    </LinearGradient>
    <Text style={styles.quickActionLabel} numberOfLines={2}>{label}</Text>
  </Pressable>
);

// ==================== STYLES ====================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // ─── Header ───
  headerContainer: {
    marginBottom: 48,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 20,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  welcomeContainer: {
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  empCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  empCodeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ─── Status Card ───
  statusCardWrapper: {
    position: 'absolute',
    bottom: -32,
    left: 20,
    right: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {},
  statusLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTextActive: {
    color: theme.colors.success,
  },
  statusTextInactive: {
    color: theme.colors.textSecondary,
  },
  timerContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  timerLabel: {
    fontSize: 9,
    color: theme.colors.primary,
    marginBottom: 3,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },

  // ─── Main Content ───
  mainContent: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 14,
    marginTop: 8,
    letterSpacing: -0.2,
  },

  // ─── Quick Actions ───
  quickActionsCard: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 18,
    letterSpacing: -0.2,
    paddingLeft: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - 88) / 4,
  },
  quickActionPressed: {
    opacity: 0.65,
  },
  quickActionCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...theme.shadow.light,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 15,
  },

  // ─── Stats ───
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statsLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // ─── Month picker ───
  monthPickerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  monthNavButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenterBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // ─── Chart ───
  chartCard: {
    paddingBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartLoader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoaderText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  emptyChartContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyChartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  emptyChartText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  topLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  xAxisLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  yAxisText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // ─── Profile Card ───
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  profileChevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Celebrations ───
  celebrationCard: {},
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emptyStateText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  celebrationSection: {
    marginBottom: 8,
  },
  celebrationSectionBorder: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  celebrationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  celebrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  celebrationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  celebrationAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  celebrationInfo: {
    flex: 1,
  },
  celebrationName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  celebrationRole: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '400',
  },

  // ─── Error Card ───
  errorCard: {
    alignItems: 'center',
    padding: 28,
    borderColor: theme.colors.error + '30',
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default DashboardScreen;