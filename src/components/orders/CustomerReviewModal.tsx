import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../constants/colors';
import { CustomDriverModal } from '../common/CustomDriverModal';

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
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setRating(0);
      setReview('');
    }
  }, [visible]);

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
        return '☆ (0/5) - Select Rating';
    }
  };

  const handleStarPress = (starIndex: number) => {
    if (rating === starIndex) {
      setRating(0);
    } else {
      setRating(starIndex);
    }
  };

  const handleSubmit = () => {
    onSubmit(rating, review.trim());
  };

  return (
    <CustomDriverModal
      visible={visible}
      type="delivered"
      title="Delivery Completed! 🎉"
      message={`Rate your experience with ${customerName || 'the customer'}`}
      primaryButtonText="Submit Review"
      onPrimaryAction={handleSubmit}
      secondaryButtonText="Skip"
      onSecondaryAction={onSkip}
      loading={loading}
    >
      <View style={styles.contentContainer}>
        {/* Star Rating Row */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= rating;
            return (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                style={styles.starTouchable}
              >
                <Text style={[styles.starIcon, isFilled ? styles.starFilled : styles.starHollow]}>
                  {isFilled ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.ratingLabelBadge, rating === 0 && styles.zeroRatingBadge]}>
          <Text style={[styles.ratingLabelText, rating === 0 && styles.zeroRatingText]}>
            {getRatingLabel(rating)}
          </Text>
        </View>

        {/* Feedback Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Write feedback for customer (optional)..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={review}
            onChangeText={setReview}
            maxLength={250}
          />
        </View>
      </View>
    </CustomDriverModal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  starTouchable: {
    padding: 6,
  },
  starIcon: {
    fontSize: 38,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starHollow: {
    color: '#CBD5E1',
  },
  ratingLabelBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  zeroRatingBadge: {
    backgroundColor: '#F1F5F9',
  },
  ratingLabelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
  },
  zeroRatingText: {
    color: '#64748B',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    minHeight: 70,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
});
