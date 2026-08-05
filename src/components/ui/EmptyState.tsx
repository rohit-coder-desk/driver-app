import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { THEME } from '../../constants/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  iconEmoji?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconEmoji = '📦',
  actionTitle,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.emojiText}>{iconEmoji}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onAction ? (
        <View style={styles.actionRow}>
          <Button title={actionTitle} onPress={onAction} variant="primary" size="md" fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.sm,
  },
  emojiText: {
    fontSize: 36,
  },
  title: {
    ...THEME.typography.h3,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: THEME.spacing.xs,
  },
  description: {
    ...THEME.typography.bodyMedium,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionRow: {
    marginTop: THEME.spacing.xl,
  },
});
