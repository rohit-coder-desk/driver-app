import React, { useState } from 'react';
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
} from 'react-native';
import { OrderData } from '../../services/OrderService';
import { COLORS } from '../../constants/colors';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'customer',
      text: 'Hello, please call me when you reach the pickup location.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

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
      Alert.alert('Customer Phone', 'Phone number not provided for this order.');
    }
  };

  const handleOpenSMS = (textToSend?: string) => {
    const msg = textToSend || inputText;
    if (customerPhone) {
      const url = Platform.OS === 'ios' ? `sms:${customerPhone}&body=${encodeURIComponent(msg)}` : `sms:${customerPhone}?body=${encodeURIComponent(msg)}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Customer Phone', 'Phone number not provided.');
    }
  };

  const handleSendMessage = (customText?: string) => {
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

    // Also offer direct SMS send
    if (customerPhone) {
      handleOpenSMS(text);
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
      {/* Stage Badge & Communication Actions */}
      <View style={styles.topRow}>
        <View style={[styles.stageBadge, isPickedUp ? styles.deliveryBadge : styles.pickupBadge]}>
          <Text style={[styles.stageText, isPickedUp ? styles.deliveryText : styles.pickupText]}>
            {currentStageTitle}
          </Text>
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

      {/* Customer & Address Details */}
      <View style={styles.detailsCard}>
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{contactName}</Text>
          {order.code ? <Text style={styles.orderCode}>#{order.code}</Text> : null}
        </View>

        <View style={styles.addressBox}>
          <Text style={styles.addressIcon}>{isPickedUp ? '📍' : '🏪'}</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {activeTargetAddress || 'Destination Address'}
          </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pickupBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  deliveryBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  stageText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pickupText: {
    color: '#2563eb',
  },
  deliveryText: {
    color: '#16a34a',
  },
  communicationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionBtnIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 17,
  },
  actionBtnPickup: {
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  actionBtnDelivery: {
    height: 50,
    backgroundColor: '#22c55e',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  chatModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    padding: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chatHeaderLeft: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeChatBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeChatText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  quickMsgContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quickMsgContent: {
    gap: 8,
  },
  quickMsgChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  quickMsgText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
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
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 19,
  },
  driverMsgText: {
    color: '#ffffff',
  },
  customerMsgText: {
    color: '#0f172a',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  driverTimeText: {
    color: '#bfdbfe',
  },
  customerTimeText: {
    color: '#94a3b8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chatInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#f8fafc',
    borderRadius: 23,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sendBtn: {
    height: 46,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
