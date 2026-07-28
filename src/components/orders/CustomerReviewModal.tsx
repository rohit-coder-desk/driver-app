import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';

interface CustomerReviewModalProps {
  visible: boolean;
  customerName?: string;
  onSubmit: (rating: number, review: string) => void;
  onSkip: () => void;
  loading?: boolean;
}

export const CustomerReviewModal: React.FC<CustomerReviewModalProps> = ({
  visible,
  customerName,
  onSubmit,
  onSkip,
  loading = false,
}) => {
  const [rating, setRating] = useState<number>(5); // default to 5 stars
  const [review, setReview] = useState<string>('');

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '⭐⭐⭐⭐⭐ (5/5) - Excellent';
      case 4:
        return '⭐⭐⭐⭐ (4/5) - Very Good';
      case 3:
        return '⭐⭐⭐ (3/5) - Average';
      case 2:
        return '⭐⭐ (2/5) - Poor';
      case 1:
        return '⭐ (1/5) - Very Bad';
      case 0:
      default:
        return '☆ (0/5) - No Rating';
    }
  };

  const handleStarPress = (starIndex: number) => {
    // If pressing the current rating, toggle down or set to starIndex
    if (rating === starIndex) {
      // If clicking 1 star when already 1 star, allow setting to 0
      if (starIndex === 1) {
        setRating(0);
      } else {
        setRating(starIndex);
      }
    } else {
      setRating(starIndex);
    }
  };

  const handleSubmit = () => {
    onSubmit(rating, review.trim());
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.headerIcon}>🎉</Text>
          <Text style={styles.title}>Ride Completed!</Text>
          <Text style={styles.subtitle}>
            Rate your experience with {customerName || 'the customer'}
          </Text>

          {/* Star Rating Section */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                style={styles.starTouchable}
              >
                <Text style={styles.starIcon}>
                  {star <= rating ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.ratingLabelBadge}>
            <Text style={styles.ratingLabelText}>{getRatingLabel(rating)}</Text>
          </View>

          {/* Zero Rating Option */}
          {rating !== 0 && (
            <TouchableOpacity
              onPress={() => setRating(0)}
              style={styles.zeroRatingBtn}
            >
              {/* <Text style={styles.zeroRatingText}>Set to 0 Starsss</Text> */}
            </TouchableOpacity>
          )}

          {/* Optional Feedback Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Write feedback for customer (optional)..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={review}
              onChangeText={setReview}
              maxLength={250}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={onSkip}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  starTouchable: {
    padding: 6,
  },
  starIcon: {
    fontSize: 38,
    color: '#f59e0b',
  },
  ratingLabelBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  ratingLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b45309',
  },
  zeroRatingBtn: {
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  zeroRatingText: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    minHeight: 80,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  skipBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary || '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
