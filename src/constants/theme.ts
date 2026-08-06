import { COLORS } from './colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SPACING, LAYOUT } from '../theme/spacing';
import { COMPONENT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme/components';

export const THEME = {
  colors: COLORS,
  typography: {
    ...TYPOGRAPHY,
    h1: TYPOGRAPHY.screenTitle,
    h2: TYPOGRAPHY.sectionTitle,
    h3: TYPOGRAPHY.cardTitle,
    body: TYPOGRAPHY.body,
    bodyMedium: TYPOGRAPHY.bodyMedium,
    caption: TYPOGRAPHY.caption,
  },
  spacing: SPACING,
  layout: LAYOUT,
  components: COMPONENT_SIZE,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

export default THEME;
