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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHeaderPaddingTop } from '../../utils/layout';
import { PhoneIcon, ChatBubbleIcon } from '../../components/common/Icons';
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
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: getHeaderPaddingTop(insets.top) }]}>
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
              <PhoneIcon size={18} color="#FFFFFF" />
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
            <ChatBubbleIcon size={44} color="#64748B" />
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
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom + 8, 12) }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061A3A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0B2246',
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
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D2A54',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  callBtnIcon: {
    fontSize: 20,
  },
  quickMsgContainer: {
    backgroundColor: '#0B2246',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  quickMsgContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  quickMsgChip: {
    backgroundColor: '#0D2A54',
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  quickMsgText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: '#0066FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  messageListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  driverBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066FF',
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#0B2246',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  driverMsgText: {
    color: '#FFFFFF',
  },
  customerMsgText: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  driverTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  customerTimeText: {
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0B2246',
    borderTopWidth: 1,
    borderTopColor: '#1E3A8A',
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#0D2A54',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  sendBtn: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#64748B',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
