import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Linking,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import apiClient from '../../api/axios';

export interface ChatMessage {
  id: string;
  orderId: number;
  senderType: 'driver' | 'customer' | 'system';
  senderId?: number;
  text: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatScreenProps {
  orderId: number;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  orderId,
  orderCode,
  customerName = 'Customer',
  customerPhone,
  onBack,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();

    // Auto-refresh chat polling (3s interval) for real-time fallback
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get(`/api/chat/orders/${orderId}/messages`);
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    try {
      setSending(true);
      const response = await apiClient.post(`/api/chat/orders/${orderId}/messages`, {
        text,
        senderType: 'driver',
      });

      if (response.data) {
        setMessages((prev) => [...prev, response.data]);
        if (!textToSend) setInputText('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleCallCustomer = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    }
  };

  const quickMessages = [
    'I am on my way to pickup location.',
    'I have reached the pickup location.',
    'Picked up order, heading to destination.',
    'I am near your delivery location.',
  ];

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{customerName}</Text>
            {orderCode ? <Text style={styles.headerSubtitle}>Order #{orderCode}</Text> : null}
          </View>

          {customerPhone ? (
            <TouchableOpacity style={styles.callBtn} onPress={handleCallCustomer} activeOpacity={0.8}>
              <Text style={styles.callBtnIcon}>📞</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.quickMsgContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickMessages}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.quickMsgContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickMsgChip}
                onPress={() => handleSendMessage(item)}
                disabled={sending}
              >
                <Text style={styles.quickMsgText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Message Thread */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>In-App Customer Chat</Text>
            <Text style={styles.emptySubtitle}>
              No messages yet. Send a message to communicate with the customer directly inside the app.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isDriver = item.senderType === 'driver';
              return (
                <View
                  style={[
                    styles.msgBubble,
                    isDriver ? styles.driverBubble : styles.customerBubble,
                  ]}
                >
                  <Text style={[styles.msgText, isDriver ? styles.driverMsgText : styles.customerMsgText]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.msgTime, isDriver ? styles.driverTimeText : styles.customerTimeText]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              );
            }}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() || sending ? styles.sendBtnDisabled : null]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendBtnText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBtnIcon: {
    fontSize: 16,
  },
  quickMsgContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickMsgContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickMsgChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickMsgText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  msgBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  driverBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  driverMsgText: {
    color: '#FFFFFF',
  },
  customerMsgText: {
    color: '#0F172A',
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
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
