import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { ROUTES } from '../../constants/routes';
import { SUPPORT_CATEGORIES, SupportCategory, SupportIssue } from '../../data/supportCategories';
import { CategoryVectorIcon } from '../../components/common/Icons';

export const SupportCategoryDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const categoryId = route.params?.categoryId || 'documents';

  const category: SupportCategory =
    SUPPORT_CATEGORIES.find((c) => c.id === categoryId) || SUPPORT_CATEGORIES[0];

  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(
    category.issues[0]?.id || null
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.HELP_SUPPORT);
    }
  };

  const toggleExpand = (issueId: string) => {
    setExpandedIssueId((prev) => (prev === issueId ? null : issueId));
  };

  const openSupportEmail = () => {
    Linking.openURL(
      `mailto:support@driverapp.example.com?subject=Help%20Request:%20${encodeURIComponent(
        category.title
      )}`
    );
  };

  const callDispatch = () => {
    openSupportEmail();
  };

  const handleActionClick = (actionRoute?: string) => {
    if (actionRoute) {
      try {
        navigation.navigate(actionRoute);
      } catch (err) {
        console.warn('Navigation error:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2246" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, Platform.OS === 'ios' ? 44 : 16) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {category.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 36) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.eyebrow}>Support Category</Text>
            <Text style={styles.title}>{category.title}</Text>
            <Text style={styles.description}>{category.description}</Text>
          </View>
        </View>

        {/* List Header */}
        <Text style={styles.sectionHeading}>Select your specific issue:</Text>

        {/* Issues List Accordion */}
        <View style={styles.issuesContainer}>
          {category.issues.map((issue: SupportIssue) => {
            const isExpanded = expandedIssueId === issue.id;

            return (
              <View key={issue.id} style={styles.issueCard}>
                <TouchableOpacity
                  style={styles.issueHeader}
                  onPress={() => toggleExpand(issue.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.issueTitleRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.issueTitle}>{issue.title}</Text>
                  </View>
                  <Text style={[styles.chevronText, isExpanded && styles.chevronRotated]}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.issueBody}>
                    <Text style={styles.solutionText}>{issue.solution}</Text>

                    {issue.actionRoute && issue.actionText && (
                      <TouchableOpacity
                        style={styles.actionRouteBtn}
                        onPress={() => handleActionClick(issue.actionRoute)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.actionRouteBtnText}>{issue.actionText}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Still Need Assistance Section */}
        <View style={styles.assistanceCard}>
          <Text style={styles.assistanceTitle}>Still need assistance?</Text>
          <Text style={styles.assistanceSub}>
            If your issue wasn't resolved, our operations team is available 24/7.
          </Text>

          <View style={styles.assistanceButtonsRow}>
            <TouchableOpacity style={styles.emailBtn} onPress={openSupportEmail} activeOpacity={0.85}>
              <View style={styles.btnBadge}>
                <Text style={styles.btnBadgeText}>Email</Text>
              </View>
              <Text style={styles.emailBtnText}>Email Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callBtn} onPress={callDispatch} activeOpacity={0.85}>
              <View style={styles.callBadge}>
                <Text style={styles.btnBadgeText}>Call</Text>
              </View>
              <Text style={styles.callBtnText}>Call Dispatch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIcon: {
    fontSize: 26,
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
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  issuesContainer: {
    gap: 14,
    marginBottom: 24,
  },
  issueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: 'hidden',
  },
  issueHeader: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  issueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },
  chevronText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  chevronRotated: {
    color: COLORS.textSecondary,
  },
  issueBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  solutionText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    marginBottom: 16,
    marginTop: 8,
  },
  actionRouteBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  actionRouteBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  assistanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assistanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  assistanceSub: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    marginBottom: 18,
  },
  assistanceButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emailBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emailBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  callBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceSoft,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  callBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  btnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 102, 255, 0.15)',
    marginBottom: 4,
  },
  callBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    marginBottom: 4,
  },
  btnBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
});

export default SupportCategoryDetailScreen;
