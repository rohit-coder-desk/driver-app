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
import { OrderData } from '../../services/OrderService';
import { COLORS } from '../../constants/colors';
import { CustomDriverModal } from '../common/CustomDriverModal';
import apiClient from '../../api/axios';

interface ActiveOrderCardProps {
  order: OrderData;
  onReachedPickup?: () => void;
  onConfirmPickup: () => void;
  onReachedDestination?: () => void;
  onCompleteDelivery: () => void;
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
  loading = false,
}: ActiveOrderCardProps) => {
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
    <View style={styles.container}>
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
        <TouchableOpacity
          style={styles.actionBtnDelivery}
          onPress={onCompleteDelivery}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            {loading ? 'Updating...' : 'Complete Delivery'}
          </Text>
        </TouchableOpacity>
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
    bottom: Platform.OS === 'ios' ? 34 : 18,
    left: 14,
    right: 14,
    backgroundColor: '#0B2246',
    borderRadius: 22,
    padding: 16,
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
    marginBottom: 12,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    gap: 6,
  },
  earningsChip: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  earningsChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  communicationButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A54',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  actionBtnIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#0D2A54',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  customerInfoLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  orderCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  timelineContainer: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 8,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    fontSize: 11,
  },
  timelineLine: {
    width: 2,
    height: 16,
    backgroundColor: '#1E3A8A',
    marginVertical: 2,
  },
  addressColumn: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionBtnPickup: {
    height: 48,
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
    height: 48,
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
    fontSize: 15,
    fontWeight: '800',
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  chatHeaderLeft: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D2A54',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeChatText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  quickMsgContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  quickMsgContent: {
    gap: 8,
  },
  quickMsgChip: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  quickMsgText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  messageList: {
    flex: 1,
    marginVertical: 10,
  },
  messageListContent: {
    gap: 10,
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
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
    fontSize: 14,
    lineHeight: 19,
  },
  driverMsgText: {
    color: '#FFFFFF',
  },
  customerMsgText: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 10,
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
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
  },
  chatInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#0D2A54',
    borderRadius: 23,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  sendBtn: {
    height: 46,
    paddingHorizontal: 20,
    backgroundColor: '#0066FF',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
