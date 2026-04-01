import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import theme from '../../../constants/theme';

// Helper to format date nicely
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Calculate expiry date (e.g., 90 days from earned date)
const getExpiryDate = (earnedDate) => {
  if (!earnedDate) return 'N/A';
  const date = new Date(earnedDate);
  date.setDate(date.getDate() + 90); // 90 days validity
  return formatDate(date);
};

const CompOffScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // State
  const [compOffData, setCompOffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch comp off data on mount
  useEffect(() => {
    fetchCompOffData();
  }, []);

  const fetchCompOffData = async () => {
    setLoading(true);
    setError('');

    try {
      // The endpoint might need employeeId as a parameter – adjust if needed
      // Assuming it uses the logged-in user from token
      const response = await api.get('/Leave/Create');
      setCompOffData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load Comp Off details';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render each comp off entry
  const renderCompOffItem = (earnedDate, index) => {
    const earned = formatDate(earnedDate);
    const expiry = getExpiryDate(earnedDate);
    const status = 'Available'; // No usage info, so default
    const usedDate = '—';
    const leaveId = '—';
    const remarks = '—';

    return (
      <View key={index} style={styles.itemCard}>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Earned Date</Text>
          <Text style={styles.itemValue}>{earned}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Expiry Date</Text>
          <Text style={styles.itemValue}>{expiry}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Status</Text>
          <Text style={[styles.itemValue, styles.statusBadge]}>{status}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Used Date</Text>
          <Text style={styles.itemValue}>{usedDate}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Leave ID</Text>
          <Text style={styles.itemValue}>{leaveId}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Remarks</Text>
          <Text style={styles.itemValue}>{remarks}</Text>
        </View>
      </View>
    );
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
              <Text style={styles.headerTitleText}>Comp Off</Text>
              <Text style={styles.headerSubtext}>Your compensatory off details</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading Comp Off details...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCompOffData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : compOffData ? (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceIcon}>
                <Ionicons name="calendar-outline" size={28} color={theme.colors.primary} />
              </View>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceValue}>{compOffData.compOffBalance ?? 0}</Text>
              </View>
            </View>

            {/* Comp Off Dates List */}
            {compOffData.compOffDates && compOffData.compOffDates.length > 0 ? (
              <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Comp Off Earned Dates</Text>
                {compOffData.compOffDates.map((date, idx) => renderCompOffItem(date, idx))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="sad-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyText}>No Comp Off dates found</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
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
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    ...theme.shadow.medium,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  balanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  listContainer: {
    marginTop: 5,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.light,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  itemValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.light,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default CompOffScreen;