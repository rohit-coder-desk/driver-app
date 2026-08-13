import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderData, OrderService } from '../../services/OrderService';
import { COLORS } from '../../constants/colors';
import { CustomDriverModal } from '../common/CustomDriverModal';
import apiClient from '../../api/axios';

interface ActiveOrderCardProps {
  order: OrderData;
  onReachedPickup?: () => void;
  onConfirmPickup: () => void;
  onReachedDestination?: () => void;
  onCompleteDelivery: () => void;
  onCancelOrderSuccess?: () => void;
  onCheckOnlineState?: () => boolean;
  loading?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'driver' | 'customer';
  text: string;
  time: string;
}

export const ActiveOrderCard = ({
  order,
  onReachedPickup,
  onConfirmPickup,
  onReachedDestination,
  onCompleteDelivery,
  onCancelOrderSuccess,
  onCheckOnlineState,
  loading = false,
}: ActiveOrderCardProps) => {
  const insets = useSafeAreaInsets();
  const [chatVisible, setChatVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  // Cancellation Flow States
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [adminReasons, setAdminReasons] = useState<any[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [selectedReasonName, setSelectedReasonName] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [reasonsLoading, setReasonsLoading] = useState(false);
  const [reasonValidationError, setReasonValidationError] = useState('');

  const handleOpenConfirmModal = () => {
    if (onCheckOnlineState && !onCheckOnlineState()) {
      return;
    }
    setConfirmModalVisible(true);
  };

  const handleProceedToReasons = async () => {
    setConfirmModalVisible(false);
    setReasonModalVisible(true);
    setSelectedReason('');
    setSelectedReasonName('');
    setCustomReasonText('');
    setReasonValidationError('');
    setReasonsLoading(true);

    try {
      const data = await OrderService.getFailureReasons();
      const filtered = Array.isArray(data)
        ? data.filter((item: any) => {
            if (item.isActive === false) return false;
            const t = (item.type || '').toLowerCase().trim();
            return t === 'delivery_failed' || t === 'delivery failed';
          })
        : [];
      setAdminReasons(filtered);
    } catch (err) {
      console.warn('Error fetching failure reasons:', err);
      setAdminReasons([]);
    } finally {
      setReasonsLoading(false);
    }
  };

  const handleSubmitCancellation = async () => {
    if (submittingCancel) return;
    if (onCheckOnlineState && !onCheckOnlineState()) return;

    if (!selectedReason) {
      setReasonValidationError('Please select a failure reason before continuing.');
      return;
    }

    let finalReason = '';
    if (selectedReason === 'other') {
      const trimmed = customReasonText.trim();
      if (!trimmed) {
        setReasonValidationError('Please enter a reason before continuing.');
        return;
      }
      finalReason = trimmed;
    } else {
      finalReason = selectedReasonName || selectedReason;
    }

    setReasonValidationError('');
    setSubmittingCancel(true);

    try {
      await OrderService.cancelOrder(order.id, finalReason);
      setSubmittingCancel(false);
      setReasonModalVisible(false);

      if (onCancelOrderSuccess) {
        onCancelOrderSuccess();
      }
    } catch (error: any) {
      setSubmittingCancel(false);
      const msg = typeof error === 'string' ? error : error?.message || 'Failed to cancel order.';
      setAlertModalConfig({
        visible: true,
        title: 'Cancellation Failed',
        message: msg,
      });
    }
  };

  useEffect(() => {
    if (chatVisible && order?.id) {
      fetchOrderChatMessages();
    }
  }, [chatVisible, order?.id]);

  const fetchOrderChatMessages = async () => {
    try {
      setChatLoading(true);
      const res = await apiClient.get(`/api/chat/orders/${order.id}/messages`);
      if (Array.isArray(res.data)) {
        const formatted = res.data.map((m: any) => ({
          id: m.id.toString(),
          sender: (m.senderType === 'driver' ? 'driver' : 'customer') as 'driver' | 'customer',
          text: m.text,
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formatted);
      }
    } catch (e) {
      console.error('Error loading order chat:', e);
    } finally {
      setChatLoading(false);
    }
  };

  const status = order.status;
  const isHeadingToPickup = status === 'assigned';
  const isAtPickup = status === 'arrived';
  const isDelivering = status === 'picked_up';
  const isNearDestination = status === 'near_destination';

  const isPickedUp = isDelivering || isNearDestination;

  const customerPhone = order.customerPhone || order.dropoff?.contactPhone || order.pickup?.contactPhone;

  const handleCallCustomer = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    } else {
      setAlertModalConfig({
        visible: true,
        title: 'Customer Phone',
        message: 'Phone number not provided for this order.',
      });
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'driver',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!customText) setInputText('');

    try {
      await apiClient.post(`/api/chat/orders/${order.id}/messages`, {
        text,
        senderType: 'driver',
      });
    } catch (e) {
      console.error('Error persisting chat message:', e);
    }
  };

  let currentStageTitle = 'HEAD TO PICKUP LOCATION';
  if (isAtPickup) currentStageTitle = 'AT PICKUP LOCATION';
  else if (isDelivering) currentStageTitle = 'DELIVERING TO CUSTOMER';
  else if (isNearDestination) currentStageTitle = 'AT DELIVERY LOCATION';

  const activeTargetAddress = isPickedUp
    ? order.dropoff?.address
    : order.pickup?.address;

  const contactName =
    order.customerName ||
    (isPickedUp ? order.dropoff?.contactName : order.pickup?.contactName) ||
    'Customer';

  const quickMessages = [
    'I am on my way to pickup location.',
    'I have reached the store/pickup point.',
    'Picked up order, heading to delivery location.',
    'I am near your delivery location.',
  ];

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom + 8, 16) }]}>
      {/* Top Header: Stage Status Badge */}
      <View style={styles.topRow}>
        <View style={[styles.stageBadge, isPickedUp ? styles.deliveryBadge : styles.pickupBadge]}>
          <View style={[styles.stageDot, isPickedUp ? styles.deliveryDot : styles.pickupDot]} />
          <Text style={[styles.stageText, isPickedUp ? styles.deliveryText : styles.pickupText]}>
            {currentStageTitle}
          </Text>
        </View>
      </View>

      {/* Timeline & Customer Details Card */}
      <View style={styles.detailsCard}>
        {/* Customer Header Info */}
        <View style={styles.customerRow}>
          <View style={styles.customerInfoLeft}>
            <Text style={styles.customerName}>{contactName}</Text>
            {order.code ? <Text style={styles.orderCode}>#{order.code}</Text> : null}
          </View>

          <View style={styles.communicationButtons}>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => setChatVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnLabel}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCallCustomer}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnIcon}>📞</Text>
              <Text style={styles.actionBtnLabel}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pickup & Delivery Location Timeline */}
        <View style={styles.timelineContainer}>
          {/* Pickup Step */}
          <View style={styles.timelineRow}>
            <View style={styles.nodeColumn}>
              <View style={[styles.timelineNode, !isPickedUp && styles.activeNode]}>
                <Text style={styles.nodeIcon}>🏪</Text>
              </View>
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.addressColumn}>
              <Text style={styles.addressLabel}>PICKUP LOCATION</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {order.pickup?.address || 'Pickup Point'}
              </Text>
            </View>
          </View>

          {/* Delivery Step */}
          <View style={styles.timelineRow}>
            <View style={styles.nodeColumn}>
              <View style={[styles.timelineNode, isPickedUp && styles.activeNode]}>
                <Text style={styles.nodeIcon}>📍</Text>
              </View>
            </View>
            <View style={styles.addressColumn}>
              <Text style={styles.addressLabel}>DELIVERY LOCATION</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {order.dropoff?.address || 'Delivery Point'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Primary Action Button based on Order Status */}
      {isHeadingToPickup ? (
        <TouchableOpacity
          style={styles.actionBtnPickup}
          onPress={onReachedPickup || onConfirmPickup}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {loading ? 'Updating...' : "I've Reached Pickup"}
          </Text>
        </TouchableOpacity>
      ) : isAtPickup ? (
        <TouchableOpacity
          style={styles.actionBtnPickup}
          onPress={onConfirmPickup}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {loading ? 'Updating...' : 'Confirm Pickup'}
          </Text>
        </TouchableOpacity>
      ) : isDelivering ? (
        <TouchableOpacity
          style={styles.actionBtnDelivery}
          onPress={onReachedDestination || onCompleteDelivery}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {loading ? 'Updating...' : "I'm Near Destination"}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.actionBtnDelivery}
            onPress={onCompleteDelivery}
            disabled={loading || submittingCancel}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>
              {loading ? 'Updating...' : 'Complete Delivery'}
            </Text>
          </TouchableOpacity>

          {/* Secondary Danger Action: Cancel Order (Only at Delivery Location stage) */}
          {isNearDestination && (
            <TouchableOpacity
              style={styles.cancelOrderDangerBtn}
              onPress={handleOpenConfirmModal}
              disabled={loading || submittingCancel}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelOrderDangerBtnText}>
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Interactive Customer Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.chatModalContainer}>
            {/* Modal Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Text style={styles.chatHeaderTitle}>Chat with {contactName}</Text>
                {customerPhone ? <Text style={styles.chatHeaderSubtitle}>{customerPhone}</Text> : null}
              </View>

              <TouchableOpacity style={styles.closeChatBtn} onPress={() => setChatVisible(false)}>
                <Text style={styles.closeChatText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Preset Messages */}
            <View style={styles.quickMsgContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickMsgContent}>
                {quickMessages.map((msg, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickMsgChip}
                    onPress={() => handleSendMessage(msg)}
                  >
                    <Text style={styles.quickMsgText}>{msg}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Message Thread */}
            <ScrollView style={styles.messageList} contentContainerStyle={styles.messageListContent}>
              {messages.map((m) => {
                const isDriver = m.sender === 'driver';
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.msgBubble,
                      isDriver ? styles.driverBubble : styles.customerBubble,
                    ]}
                  >
                    <Text style={[styles.msgText, isDriver ? styles.driverMsgText : styles.customerMsgText]}>
                      {m.text}
                    </Text>
                    <Text style={[styles.msgTime, isDriver ? styles.driverTimeText : styles.customerTimeText]}>
                      {m.time}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
              />

              <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendMessage()}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 1. Cancellation Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.confirmDialogBox}>
            <Text style={styles.confirmDialogTitle}>Cancel Order?</Text>
            <Text style={styles.confirmDialogMessage}>
              Are you sure you want to cancel this order?
            </Text>

            <View style={styles.confirmDialogButtonsRow}>
              <TouchableOpacity
                style={styles.confirmGoBackBtn}
                onPress={() => setConfirmModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmGoBackBtnText}>No, Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmProceedCancelBtn}
                onPress={handleProceedToReasons}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmProceedCancelBtnText}>Yes, Cancel Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Failure Reason Selection Modal */}
      <Modal
        visible={reasonModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submittingCancel) setReasonModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.reasonModalContainer}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Text style={styles.chatHeaderTitle}>Delivery Failed Reasons</Text>
                <Text style={styles.chatHeaderSubtitle}>
                  Please choose a reason for cancelling Order #{order.code || order.id}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeChatBtn}
                onPress={() => {
                  if (!submittingCancel) setReasonModalVisible(false);
                }}
                disabled={submittingCancel}
              >
                <Text style={styles.closeChatText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reasonListScroll} contentContainerStyle={styles.reasonListContent}>
              {reasonsLoading ? (
                <View style={styles.reasonsLoadingBox}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={styles.reasonsLoadingText}>Loading failure reasons...</Text>
                </View>
              ) : (
                <>
                  {adminReasons.map((item) => {
                    const isSelected = selectedReason === item.id.toString();
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.reasonOptionCard, isSelected && styles.reasonOptionCardSelected]}
                        onPress={() => {
                          setSelectedReason(item.id.toString());
                          setSelectedReasonName(item.name);
                          setReasonValidationError('');
                        }}
                        activeOpacity={0.8}
                        disabled={submittingCancel}
                      >
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <View style={styles.reasonTextWrap}>
                          <Text style={styles.reasonNameText}>{item.name}</Text>
                          {item.description ? (
                            <Text style={styles.reasonDescText}>{item.description}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* "Other" Option */}
                  <TouchableOpacity
                    style={[styles.reasonOptionCard, selectedReason === 'other' && styles.reasonOptionCardSelected]}
                    onPress={() => {
                      setSelectedReason('other');
                      setSelectedReasonName('Other');
                      setReasonValidationError('');
                    }}
                    activeOpacity={0.8}
                    disabled={submittingCancel}
                  >
                    <View style={[styles.radioCircle, selectedReason === 'other' && styles.radioCircleSelected]}>
                      {selectedReason === 'other' && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.reasonTextWrap}>
                      <Text style={styles.reasonNameText}>Other</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Custom Reason Text Input Area when "Other" is selected */}
                  {selectedReason === 'other' && (
                    <View style={styles.customReasonInputBox}>
                      <Text style={styles.customReasonLabel}>Reason</Text>
                      <TextInput
                        style={styles.customReasonTextInput}
                        placeholder="Please enter the reason..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                        value={customReasonText}
                        onChangeText={(text) => {
                          setCustomReasonText(text);
                          setReasonValidationError('');
                        }}
                        editable={!submittingCancel}
                      />
                    </View>
                  )}

                  {reasonValidationError ? (
                    <Text style={styles.validationErrorText}>{reasonValidationError}</Text>
                  ) : null}
                </>
              )}
            </ScrollView>

            <View style={styles.reasonModalFooter}>
              <TouchableOpacity
                style={styles.reasonCancelBtn}
                onPress={() => setReasonModalVisible(false)}
                disabled={submittingCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.reasonCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reasonSubmitBtn, submittingCancel && styles.reasonSubmitBtnDisabled]}
                onPress={handleSubmitCancellation}
                disabled={submittingCancel || reasonsLoading}
                activeOpacity={0.85}
              >
                {submittingCancel ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.reasonSubmitBtnText}>Submit Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomDriverModal
        visible={alertModalConfig.visible}
        type="info"
        title={alertModalConfig.title}
        message={alertModalConfig.message}
        primaryButtonText="OK"
        onPrimaryAction={() => setAlertModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 30,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pickupDot: {
    backgroundColor: '#0066FF',
  },
  deliveryDot: {
    backgroundColor: '#22C55E',
  },
  pickupBadge: {
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  deliveryBadge: {
    backgroundColor: '#052E16',
    borderWidth: 1,
    borderColor: '#15803D',
  },
  stageText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  pickupText: {
    color: '#0066FF',
  },
  deliveryText: {
    color: '#4ADE80',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningsChip: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  earningsChipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  communicationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D2A54',
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D2A54',
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  actionBtnIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#0D2A54',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  customerInfoLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginTop: 2,
  },
  timelineContainer: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0B2246',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNode: {
    backgroundColor: '#0D2A54',
    borderWidth: 1.5,
    borderColor: '#0066FF',
  },
  nodeIcon: {
    fontSize: 13,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: '#1E3A8A',
    marginVertical: 2,
  },
  addressColumn: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  actionBtnPickup: {
    height: 54,
    backgroundColor: '#0066FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnDelivery: {
    height: 54,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 58, 0.8)',
    justifyContent: 'flex-end',
  },
  chatModalContainer: {
    backgroundColor: '#0B2246',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  chatHeaderLeft: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  closeChatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeChatText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#94A3B8',
  },
  quickMsgContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  quickMsgContent: {
    gap: 8,
  },
  quickMsgChip: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    minHeight: 36,
  },
  quickMsgText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#0066FF',
  },
  messageList: {
    flex: 1,
    marginVertical: 12,
  },
  messageListContent: {
    gap: 12,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 16,
  },
  driverBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  driverMsgText: {
    color: '#FFFFFF',
  },
  customerMsgText: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  driverTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  customerTimeText: {
    color: '#94A3B8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
  },
  chatInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#0D2A54',
    borderRadius: 26,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  sendBtn: {
    height: 52,
    paddingHorizontal: 22,
    backgroundColor: '#0066FF',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },

  // Cancellation Flow Styles
  cancelOrderDangerBtn: {
    height: 48,
    backgroundColor: 'transparent',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    marginTop: 10,
  },
  cancelOrderDangerBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 58, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmDialogBox: {
    width: '100%',
    backgroundColor: '#0B2246',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmDialogTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmDialogMessage: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmDialogButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmGoBackBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  confirmGoBackBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  confirmProceedCancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmProceedCancelBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reasonModalContainer: {
    backgroundColor: '#0B2246',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  reasonListScroll: {
    maxHeight: 320,
    marginVertical: 14,
  },
  reasonListContent: {
    gap: 10,
  },
  reasonsLoadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  reasonsLoadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  reasonOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  reasonOptionCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#123363',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#0066FF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0066FF',
  },
  reasonTextWrap: {
    flex: 1,
  },
  reasonNameText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  reasonDescText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  customReasonInputBox: {
    marginTop: 10,
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    padding: 12,
  },
  customReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  customReasonTextInput: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    minHeight: 64,
    textAlignVertical: 'top',
  },
  validationErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    marginLeft: 4,
  },
  reasonModalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
  },
  reasonCancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#0D2A54',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  reasonCancelBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  reasonSubmitBtn: {
    flex: 1.5,
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonSubmitBtnDisabled: {
    opacity: 0.6,
  },
  reasonSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
