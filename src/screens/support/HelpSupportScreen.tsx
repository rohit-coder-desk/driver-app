import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';

import { SUPPORT_CATEGORIES, SupportCategory } from '../../data/supportCategories';
import { CategoryVectorIcon } from '../../components/common/Icons';

export const HelpSupportScreen = () => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.HOME);
    }
  };

  const openSupportEmail = () => {
    Linking.openURL('mailto:support@driverapp.example.com?subject=Driver%20Support%20Request');
  };

  const callDispatch = () => {
    Linking.openURL('').catch(() => {
      openSupportEmail();
    });
  };

  const handleCategoryPress = (categoryId: string) => {
    navigation.navigate(ROUTES.SUPPORT_CATEGORY_DETAIL, { categoryId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.surface} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.eyebrow}>Driver support center</Text>
            <Text style={styles.title}>Need help right now?</Text>
            <Text style={styles.description}>
              Select a category below for quick solutions or reach out to support 24/7.
            </Text>
          </View>
        </View>

        {/* Categorized Support Options Header */}
        <Text style={styles.categorySectionHeading}>Support Categories</Text>

        {/* Categories List */}
        <View style={styles.categoryListContainer}>
          {SUPPORT_CATEGORIES.map((cat: SupportCategory) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(cat.id)}
              activeOpacity={0.85}
            >
              <View style={styles.catIconBox}>
                <CategoryVectorIcon type={cat.id} color="#60A5FA" size={22} />
              </View>
              <View style={styles.catInfoWrap}>
                <Text style={styles.catTitle}>{cat.title}</Text>
                <Text style={styles.catDescription} numberOfLines={1}>
                  {cat.description}
                </Text>
              </View>
              <Text style={styles.catChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Support Direct Section Header */}
        <Text style={[styles.categorySectionHeading, { marginTop: 12 }]}>Direct Assistance</Text>

        {/* Existing Grid Options: Email Support & Call Dispatch */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridCard} onPress={openSupportEmail} activeOpacity={0.85}>
            <View style={styles.gridBadge}>
              <Text style={styles.gridBadgeText}>Email</Text>
            </View>
            <Text style={styles.gridCardTitle}>Email Support</Text>
            <Text style={styles.gridCardSub}>Send a detailed message with your issue.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={callDispatch} activeOpacity={0.85}>
            <View style={styles.gridBadgeSecondary}>
              <Text style={styles.gridBadgeText}>Call</Text>
            </View>
            <Text style={styles.gridCardTitle}>Call Dispatch</Text>
            <Text style={styles.gridCardSub}>Get urgent help from the operations team.</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Contact Support Team Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>24/7</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Direct Driver Helpdesk</Text>
              <Text style={styles.cardText}>
                Connect with support for document verification, payouts, and trip-related questions.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={openSupportEmail} activeOpacity={0.85}>
            <Text style={styles.actionBtnText}>Contact Support Team</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : Math.max(StatusBar.currentHeight || 0, 24) + 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  heroAccent: {
    width: 4,
    height: 80,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginRight: 14,
  },
  heroTextWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  gridBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 102, 255, 0.15)',
    marginBottom: 12,
  },
  gridBadgeSecondary: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    marginBottom: 12,
  },
  gridBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  gridCardSub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 14,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  categorySectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  categoryListContainer: {
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  catIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catIconText: {
    fontSize: 24,
  },
  catInfoWrap: {
    flex: 1,
    marginRight: 8,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  catDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  catChevron: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
  },
});

export default HelpSupportScreen;
