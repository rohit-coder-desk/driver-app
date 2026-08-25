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
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setRating(0);
      setReview('');
      setErrorMsg('');
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
        return '☆ (0/5) - Select Rating (Min 1 Star)';
    }
  };

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex);
    if (errorMsg) {
      setErrorMsg('');
    }
  };

  const handleSubmit = () => {
    if (rating < 1) {
      setErrorMsg('Please select at least 1 star rating to submit');
      return;
    }
    onSubmit(rating, review.trim());
  };

  return (
    <CustomDriverModal
      visible={visible}
      type="delivered"
      title="Delivery Completed!"
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

        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* Feedback Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Write feedback for customer ..."
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
    marginBottom: 12,
  },
  starTouchable: {
    padding: 8,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: 40,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starHollow: {
    color: '#64748B',
  },
  ratingLabelBadge: {
    backgroundColor: '#0D2A54',
    borderColor: '#1E3A8A',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  zeroRatingBadge: {
    backgroundColor: '#0D2A54',
    borderColor: '#1E3A8A',
  },
  ratingLabelText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  zeroRatingText: {
    color: '#94A3B8',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    minHeight: 90,
    backgroundColor: '#0D2A54',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlignVertical: 'top',
  },
});
