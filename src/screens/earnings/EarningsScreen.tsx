import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHeaderPaddingTop } from '../../utils/layout';
import { useAuth } from '../../hooks/useAuth';
import { DriverService } from '../../services/DriverService';
import { ROUTES } from '../../constants/routes';

export const EarningsScreen = () => {
  const insets = useSafeAreaInsets();
  const { driver, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [earningsData, setEarningsData] = useState<any>(null);

  // Modal & Request Payout States
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNote, setPayoutNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancelPayout = (id: number) => {
    Alert.alert(
      'Cancel Payout Request',
      'Are you sure you want to cancel this withdrawal request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(id);
            try {
              const res = await DriverService.cancelPayoutRequest(id);
              if (res?.withdraw) {
                setEarningsData((prev: any) => {
                  const prevRequests = prev?.payoutRequests || [];
                  const updatedRequests = prevRequests.map((r: any) =>
                    r.id === id ? { ...r, status: 'cancelled' } : r
                  );
                  const cancelledAmount = res.withdraw.requestedAmount || res.withdraw.amount || 0;
                  const newAmountAlreadyRequested = Math.max(0, (prev?.amountAlreadyRequested || 0) - cancelledAmount);
                  const currentBal = prev?.balance ?? balance;
                  const newAvailableBalance = Math.max(0, currentBal - newAmountAlreadyRequested);
                  return {
                    ...prev,
                    amountAlreadyRequested: newAmountAlreadyRequested,
                    availableBalance: newAvailableBalance,
                    payoutRequests: updatedRequests
                  };
                });
              }
              Alert.alert('Success', 'Payout request cancelled successfully.');
              fetchEarnings();
            } catch (err: any) {
              const errMsg = typeof err === 'string' ? err : err?.message || 'Failed to cancel payout request.';
              Alert.alert('Error', errMsg);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const fetchEarnings = useCallback(async () => {
    try {
      console.log('📱 [EARNINGS SCREEN] Calling DriverService.getEarnings()...');
      const data = await DriverService.getEarnings();
      console.log('📱 [EARNINGS SCREEN] DriverService.getEarnings() returned data:', JSON.stringify(data));
      if (data) {
        setEarningsData({ ...data });
      }
      await refreshProfile();
    } catch (error) {
      console.warn('❌ [EARNINGS SCREEN] Error loading earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEarnings();
  }, [fetchEarnings]);

  const balance = earningsData?.balance ?? driver?.balance ?? 0;
  const blockedBalance = earningsData?.blockedBalance ?? (driver as any)?.blockedBalance ?? 0;
  const minimumBalance = earningsData?.minimumBalance ?? (driver as any)?.minimumBalance ?? 0;
  const amountAlreadyRequested = earningsData?.amountAlreadyRequested ?? 0;
  const availableBalance = earningsData?.availableBalance ?? Math.max(0, balance - blockedBalance - amountAlreadyRequested);

  const todayEarnings = earningsData?.todayEarnings ?? 0;
  const todayOrdersCount = earningsData?.todayOrdersCount ?? 0;
  const weekEarnings = earningsData?.weekEarnings ?? 0;
  const weekOrdersCount = earningsData?.weekOrdersCount ?? 0;
  const payoutRequests = earningsData?.payoutRequests || [];

  console.log('📱 [EARNINGS SCREEN RENDER METRICS]:', {
    hasEarningsData: !!earningsData,
    balance,
    availableBalance,
    amountAlreadyRequested,
    payoutRequestsCount: payoutRequests.length,
    payoutRequests
  });

  const handleOpenModal = () => {
    setPayoutAmount('');
    setPayoutNote('');
    setValidationError(null);
    setModalVisible(true);
  };

  const handleSubmitPayout = async () => {
    const trimmedAmount = payoutAmount.trim();
    if (!trimmedAmount) {
      setValidationError('Please enter an amount.');
      return;
    }

    const numAmount = parseFloat(trimmedAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Amount must be greater than 0');
      return;
    }

    const minBalance = earningsData?.minDriverBalance ?? earningsData?.minimumBalance ?? (driver as any)?.minimumBalance ?? 0;
    const currentBal = earningsData?.balance ?? balance ?? 0;
    const remainingBalance = currentBal - numAmount;

    console.log('📱 [SUBMIT PAYOUT ATTEMPT]:', {
      numAmount,
      minBalance,
      currentBal,
      remainingBalance,
      availableBalance
    });

    if (minBalance > 0 && remainingBalance < minBalance) {
      setValidationError(`Your minimum balance should be ₹${minBalance}.`);
      return;
    }

    if (numAmount > availableBalance) {
      setValidationError('Insufficient balance');
      return;
    }

    setValidationError(null);
    setSubmitting(true);

    try {
      const res = await DriverService.requestPayout(numAmount, payoutNote.trim());
      setSubmitting(false);
      setModalVisible(false);
      if (res?.payoutRequest) {
        const newReq = res.payoutRequest;
        setEarningsData((prev: any) => {
          const prevRequests = prev?.payoutRequests || [];
          const updatedRequests = [newReq, ...prevRequests.filter((r: any) => r.id !== newReq.id)];
          const newAmountAlreadyRequested = (prev?.amountAlreadyRequested || 0) + numAmount;
          const currentBal = prev?.balance ?? balance;
          const newAvailableBalance = Math.max(0, currentBal - newAmountAlreadyRequested);
          return {
            ...prev,
            amountAlreadyRequested: newAmountAlreadyRequested,
            availableBalance: newAvailableBalance,
            payoutRequests: updatedRequests
          };
        });
      }
      Alert.alert('Success', 'Payout request submitted successfully.');
      fetchEarnings();
    } catch (err: any) {
      setSubmitting(false);
      const errMsg = typeof err === 'string' ? err : err?.message || 'Failed to submit payout request.';
      setValidationError(errMsg);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'paid') {
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (s === 'rejected' || s === 'cancelled') {
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
    }
    return { bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: getHeaderPaddingTop(insets.top) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate(ROUTES.HOME);
            }
          }}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings & Balance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0066FF"
            colors={['#0066FF']}
          />
        }
      >
        {/* Main Earnings Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL EARNINGS BALANCE</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>

          <View style={styles.balanceMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>AVAILABLE</Text>
              <Text style={[styles.metricValue, { color: '#34D399' }]}>₹{availableBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>REQUESTED</Text>
              <Text style={[styles.metricValue, { color: '#FBBF24' }]}>₹{amountAlreadyRequested.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.payoutBtn}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <Text style={styles.payoutBtnText}>Request Payout</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Performance Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>TODAY'S EARNINGS</Text>
            <Text style={styles.summaryCardValue}>₹{todayEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryCardSub}>{todayOrdersCount} completed order{todayOrdersCount !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>THIS WEEK</Text>
            <Text style={styles.summaryCardValue}>₹{weekEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryCardSub}>{weekOrdersCount} total order{weekOrdersCount !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Section: Payout Requests History */}
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>PAYOUT REQUESTS HISTORY</Text>
          {payoutRequests.length === 0 ? (
            <View style={styles.emptyHistoryCard}>
              <Text style={styles.emptyHistoryText}>No payout requests submitted yet.</Text>
            </View>
          ) : (
            payoutRequests.map((item: any) => {
              const badge = getStatusBadgeStyle(item.status);
              const isPending = (item.status || '').toLowerCase() === 'pending';
              return (
                <View key={item.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View>
                      <Text style={styles.requestAmount}>₹{(item.requestedAmount || item.amount || 0).toFixed(2)}</Text>
                      {item.note ? (
                        <Text style={styles.requestNote}>"{item.note}"</Text>
                      ) : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {(item.status || 'pending').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.requestFooter}>
                    <Text style={styles.requestDate}>{formatDate(item.createdAt)}</Text>
                    {isPending && (
                      <TouchableOpacity
                        style={styles.cancelPayoutBtn}
                        disabled={cancellingId === item.id}
                        onPress={() => handleCancelPayout(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelPayoutBtnText}>
                          {cancellingId === item.id ? 'Cancelling...' : 'Cancel Request'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Payout Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!submitting) setModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Payout</Text>
                <TouchableOpacity
                  disabled={submitting}
                  onPress={() => setModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Balance Summary Banner */}
              <View style={styles.modalBalanceBanner}>
                <Text style={styles.modalBalanceLabel}>AVAILABLE BALANCE</Text>
                <Text style={styles.modalBalanceValue}>₹{availableBalance.toFixed(2)}</Text>
                {amountAlreadyRequested > 0 && (
                  <Text style={styles.modalSubBalance}>
                    Total Wallet: ₹{balance.toFixed(2)} | Pending: ₹{amountAlreadyRequested.toFixed(2)}
                  </Text>
                )}
              </View>

              {/* Input Form */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Enter Amount (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 200"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={payoutAmount}
                  editable={!submitting}
                  onChangeText={(text) => {
                    setPayoutAmount(text);
                    setValidationError(null);
                  }}
                />

                {/* Quick Amount Chips */}
                <View style={styles.quickChipsRow}>
                  {[100, 200, 500].map((val) => (
                    <TouchableOpacity
                      key={val}
                      disabled={submitting}
                      style={styles.chipBtn}
                      onPress={() => {
                        setPayoutAmount(val.toString());
                        setValidationError(null);
                      }}
                    >
                      <Text style={styles.chipBtnText}>₹{val}</Text>
                    </TouchableOpacity>
                  ))}
                  {availableBalance > 0 && (
                    <TouchableOpacity
                      disabled={submitting}
                      style={[styles.chipBtn, styles.chipBtnMax]}
                      onPress={() => {
                        setPayoutAmount(Math.floor(availableBalance).toString());
                        setValidationError(null);
                      }}
                    >
                      <Text style={[styles.chipBtnText, { color: '#0066FF' }]}>MAX</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.noteInput]}
                  placeholder="e.g. Weekly payout"
                  placeholderTextColor="#64748B"
                  value={payoutNote}
                  editable={!submitting}
                  onChangeText={setPayoutNote}
                  multiline={false}
                />
              </View>

              {/* Validation Error Banner */}
              {validationError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {validationError}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                disabled={submitting}
                onPress={handleSubmitPayout}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Submitting...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>Submit Payout Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0B2246',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  balanceCard: {
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  balanceMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0D2A54',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1E3A8A',
  },
  payoutBtn: {
    backgroundColor: '#0066FF',
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  payoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0B2246',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  summaryCardSub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 4,
  },
  historySection: {
    gap: 12,
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  emptyHistoryCard: {
    backgroundColor: '#0B2246',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  requestCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  requestNote: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  requestDate: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cancelPayoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelPayoutBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0B2246',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalBalanceBanner: {
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  modalBalanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  modalBalanceValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#34D399',
    marginTop: 4,
  },
  modalSubBalance: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  textInput: {
    backgroundColor: '#061A3A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  noteInput: {
    fontSize: 14,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chipBtn: {
    backgroundColor: '#0D2A54',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  chipBtnMax: {
    backgroundColor: '#0D2A54',
    borderColor: '#0066FF',
  },
  chipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  errorBanner: {
    backgroundColor: '#450A0A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#0066FF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default EarningsScreen;

