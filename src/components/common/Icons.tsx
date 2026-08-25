import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface IconProps {
  color?: string;
  size?: number;
  secondaryColor?: string;
}

// 1. Home Icon (Clean Modern House with Roof & Door)
export const HomeIcon: React.FC<IconProps> = ({ color = '#FFFFFF', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    {/* Roof Outline */}
    <View
      style={{
        width: size * 0.72,
        height: size * 0.72,
        borderTopWidth: 2.2,
        borderLeftWidth: 2.2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        position: 'absolute',
        top: size * 0.1,
        borderRadius: 2,
      }}
    />
    {/* Main House Box with bottom door cutout */}
    <View
      style={{
        width: size * 0.58,
        height: size * 0.44,
        borderWidth: 2.2,
        borderColor: color,
        borderTopWidth: 0,
        position: 'absolute',
        bottom: size * 0.08,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* Door cutout */}
      <View
        style={{
          width: size * 0.22,
          height: size * 0.24,
          backgroundColor: color,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        }}
      />
    </View>
  </View>
);

// 2. Profile Icon (User Head & Shoulder Arc)
export const ProfileIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    {/* Head Circle */}
    <View
      style={{
        width: size * 0.42,
        height: size * 0.42,
        borderRadius: (size * 0.42) / 2,
        borderWidth: 2.2,
        borderColor: color,
        position: 'absolute',
        top: size * 0.08,
      }}
    />
    {/* Shoulder Arc */}
    <View
      style={{
        width: size * 0.78,
        height: size * 0.38,
        borderTopLeftRadius: size * 0.39,
        borderTopRightRadius: size * 0.39,
        borderWidth: 2.2,
        borderColor: color,
        borderBottomWidth: 0,
        position: 'absolute',
        bottom: size * 0.08,
      }}
    />
  </View>
);

// 3. Edit Icon (Slanted Pencil Outline)
export const EditIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.24,
        height: size * 0.72,
        borderWidth: 2.2,
        borderColor: color,
        borderRadius: 2,
        transform: [{ rotate: '-45deg' }],
        position: 'absolute',
      }}
    >
      <View style={{ width: '100%', height: size * 0.16, backgroundColor: color }} />
    </View>
  </View>
);

// 4. Orders Icon (Parcel Box Package Outline)
export const OrdersIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
    {/* Outer Box Outline */}
    <View
      style={{
        width: size * 0.76,
        height: size * 0.65,
        borderWidth: 2.2,
        borderColor: color,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {/* Top Seam Flap */}
      <View
        style={{
          width: '100%',
          height: size * 0.22,
          borderBottomWidth: 1.8,
          borderColor: color,
        }}
      />
      {/* Center Tape Line */}
      <View
        style={{
          width: 2,
          height: '100%',
          backgroundColor: color,
          position: 'absolute',
        }}
      />
    </View>
  </View>
);

// 5. Documents Icon (Folded Paper Sheet with Lines)
export const DocumentsIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    {/* Paper Sheet Outline */}
    <View
      style={{
        width: size * 0.68,
        height: size * 0.84,
        borderWidth: 2.2,
        borderColor: color,
        borderRadius: 3,
        paddingHorizontal: size * 0.12,
        paddingTop: size * 0.22,
        justifyContent: 'space-around',
      }}
    >
      <View style={{ width: '85%', height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: '100%', height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: '60%', height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
    {/* Folded Top-Right Dog-Ear Corner */}
    <View
      style={{
        position: 'absolute',
        top: size * 0.08,
        right: size * 0.16,
        width: size * 0.2,
        height: size * 0.2,
        borderBottomWidth: 2.2,
        borderLeftWidth: 2.2,
        borderColor: color,
      }}
    />
  </View>
);

// 6. Support Icon (Circle Outline with ? Question Mark)
export const SupportIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      {
        width: size * 0.88,
        height: size * 0.88,
        borderRadius: (size * 0.88) / 2,
        borderWidth: 2.2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      },
    ]}
  >
    <Text style={{ color, fontSize: size * 0.54, fontWeight: '800', marginTop: -1 }}>?</Text>
  </View>
);

// 7. Earnings Icon (Clean Rupee Coin Badge Outline)
export const EarningsIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      {
        width: size * 0.88,
        height: size * 0.88,
        borderRadius: (size * 0.88) / 2,
        borderWidth: 2.2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      },
    ]}
  >
    <Text style={{ color, fontSize: size * 0.52, fontWeight: '800', marginTop: -1 }}>₹</Text>
  </View>
);

// 8. Logout Icon (Door Frame with Exit Arrow)
export const LogoutIcon: React.FC<IconProps> = ({ color = '#EF4444', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size, flexDirection: 'row', alignItems: 'center' }]}>
    {/* Door Frame */}
    <View
      style={{
        width: size * 0.42,
        height: size * 0.72,
        borderWidth: 2,
        borderColor: color,
        borderRightWidth: 0,
        borderTopLeftRadius: 3,
        borderBottomLeftRadius: 3,
      }}
    />
    {/* Arrow Shaft & Tip */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -size * 0.1 }}>
      <View style={{ width: size * 0.38, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View
        style={{
          width: size * 0.18,
          height: size * 0.18,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          marginLeft: -size * 0.12,
        }}
      />
    </View>
  </View>
);

// 9. Lock Shield Icon (Natural Security Badge)
export const LockShieldIcon: React.FC<IconProps> = ({ color = '#3B82F6', size = 48 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    {/* Shield Outer */}
    <View
      style={{
        width: size * 0.76,
        height: size * 0.86,
        borderWidth: 2.5,
        borderColor: color,
        borderTopLeftRadius: size * 0.38,
        borderTopRightRadius: size * 0.38,
        borderBottomLeftRadius: size * 0.42,
        borderBottomRightRadius: size * 0.42,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
      }}
    >
      {/* Shackle */}
      <View
        style={{
          width: size * 0.26,
          height: size * 0.22,
          borderWidth: 2,
          borderColor: color,
          borderTopLeftRadius: size * 0.13,
          borderTopRightRadius: size * 0.13,
          borderBottomWidth: 0,
          marginBottom: -1,
        }}
      />
      {/* Lock Body */}
      <View
        style={{
          width: size * 0.34,
          height: size * 0.25,
          backgroundColor: color,
          borderRadius: 3,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: 3, height: 5, backgroundColor: '#0B2246', borderRadius: 1.5 }} />
      </View>
    </View>
  </View>
);

// 10. Offline Signal Icon (Signal Ring with Strikethrough)
export const OfflineSignalIcon: React.FC<IconProps> = ({ color = '#64748B', size = 56 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    {/* Outer Ring */}
    <View
      style={{
        width: size * 0.78,
        height: size * 0.78,
        borderRadius: (size * 0.78) / 2,
        borderWidth: 2.5,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Inner Dot */}
      <View
        style={{
          width: size * 0.24,
          height: size * 0.24,
          borderRadius: (size * 0.24) / 2,
          backgroundColor: color,
        }}
      />
    </View>
    {/* Strikethrough Line */}
    <View
      style={{
        position: 'absolute',
        width: size * 0.88,
        height: 3,
        backgroundColor: '#EF4444',
        borderRadius: 1.5,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

// 11. Category Vector Icon Router for Support Screen
export const CategoryVectorIcon: React.FC<{ type: string; color?: string; size?: number }> = ({
  type,
  color = '#60A5FA',
  size = 20,
}) => {
  switch (type) {
    case 'documents':
      return <DocumentsIcon color={color} size={size} />;
    case 'trips':
    case 'vehicle':
      return <TruckIcon color={color} size={size} />;
    case 'earnings':
      return <EarningsIcon color={color} size={size} />;
    case 'navigation':
      return <NavigationArrowIcon color={color} size={size} />;
    case 'account':
      return <ProfileIcon color={color} size={size} />;
    case 'app_issues':
      return <WarningIcon color={color} size={size} />;
    case 'faqs':
    default:
      return <SupportIcon color={color} size={size} />;
  }
};

// 12. Calendar Icon (Clean Grid Calendar)
export const CalendarIcon: React.FC<IconProps> = ({ color = '#94A3B8', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.8,
        height: size * 0.8,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: color,
        paddingTop: size * 0.2,
      }}
    >
      <View style={{ width: '100%', height: 1.5, backgroundColor: color }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 3 }}>
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
      </View>
    </View>
    {/* Pins */}
    <View style={{ position: 'absolute', top: 0, left: size * 0.25, width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ position: 'absolute', top: 0, right: size * 0.25, width: 2, height: 4, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

// 13. Menu Icon (3 Smooth Lines for Drawer Header)
export const MenuIcon: React.FC<IconProps> = ({ color = '#FFFFFF', size = 22 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'space-around', paddingVertical: size * 0.15 }]}>
    <View style={{ width: size * 0.85, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ width: size * 0.65, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ width: size * 0.85, height: 2.5, backgroundColor: color, borderRadius: 1.5 }} />
  </View>
);

// 14. GPS Target / Location Recenter Icon
export const GpsTargetIcon: React.FC<IconProps> = ({ color = '#2563EB', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.68,
        height: size * 0.68,
        borderRadius: (size * 0.68) / 2,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ width: size * 0.24, height: size * 0.24, borderRadius: (size * 0.24) / 2, backgroundColor: color }} />
    </View>
    {/* Crosshair ticks */}
    <View style={{ position: 'absolute', top: 1, width: 2, height: size * 0.18, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: 1, width: 2, height: size * 0.18, backgroundColor: color }} />
    <View style={{ position: 'absolute', left: 1, width: size * 0.18, height: 2, backgroundColor: color }} />
    <View style={{ position: 'absolute', right: 1, width: size * 0.18, height: 2, backgroundColor: color }} />
  </View>
);

// 15. Search Magnifying Glass Icon
export const SearchIcon: React.FC<IconProps> = ({ color = '#64748B', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.58,
        height: size * 0.58,
        borderRadius: (size * 0.58) / 2,
        borderWidth: 2,
        borderColor: color,
        position: 'absolute',
        top: size * 0.08,
        left: size * 0.08,
      }}
    />
    <View
      style={{
        width: size * 0.35,
        height: 2.5,
        backgroundColor: color,
        borderRadius: 1.5,
        transform: [{ rotate: '45deg' }],
        position: 'absolute',
        bottom: size * 0.16,
        right: size * 0.08,
      }}
    />
  </View>
);

// 16. Phone Call Icon (Solid Realistic Telephone Receiver Handset 📞)
export const PhoneIcon: React.FC<IconProps> = ({ color = '#34D399', size = 22 }) => {
  const scale = size / 20;
  return (
    <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
      <View
        style={{
          width: 18 * scale,
          height: 18 * scale,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          transform: [{ rotate: '-45deg' }],
        }}
      >
        {/* Top Earpiece Cup (Solid) */}
        <View
          style={{
            width: 9.5 * scale,
            height: 5.2 * scale,
            backgroundColor: color,
            borderTopLeftRadius: 3.5 * scale,
            borderTopRightRadius: 3.5 * scale,
            borderBottomLeftRadius: 1.5 * scale,
            borderBottomRightRadius: 1.5 * scale,
          }}
        />
        {/* Connecting Handle Tube (Solid) */}
        <View
          style={{
            width: 4.5 * scale,
            height: 8.8 * scale,
            backgroundColor: color,
            borderRadius: 2.2 * scale,
            marginLeft: 0.5 * scale,
            marginVertical: -1.5 * scale,
          }}
        />
        {/* Bottom Mouthpiece Cup (Solid) */}
        <View
          style={{
            width: 9.5 * scale,
            height: 5.2 * scale,
            backgroundColor: color,
            borderBottomLeftRadius: 3.5 * scale,
            borderBottomRightRadius: 3.5 * scale,
            borderTopLeftRadius: 1.5 * scale,
            borderTopRightRadius: 1.5 * scale,
          }}
        />
      </View>
    </View>
  );
};

// 17. Chat / Message Bubble Icon
export const ChatBubbleIcon: React.FC<IconProps> = ({ color = '#60A5FA', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
    {/* Main Speech Bubble Body */}
    <View
      style={{
        width: size * 0.86,
        height: size * 0.64,
        borderRadius: size * 0.18,
        borderWidth: 2,
        borderColor: color,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: size * 0.08,
      }}
    >
      {/* Message Chat Dots */}
      <View style={{ flexDirection: 'row', gap: size * 0.08, alignItems: 'center' }}>
        <View style={{ width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
        <View style={{ width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
        <View style={{ width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
      </View>
    </View>
    {/* Speech Bubble Pointer Tail */}
    <View
      style={{
        position: 'absolute',
        bottom: size * 0.06,
        left: size * 0.18,
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.1,
        borderRightWidth: size * 0.1,
        borderTopWidth: size * 0.14,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
      }}
    />
  </View>
);

// 18. Camera Icon
export const CameraIcon: React.FC<IconProps> = ({ color = '#FFFFFF', size = 18 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    {/* Body */}
    <View
      style={{
        width: size * 0.8,
        height: size * 0.55,
        borderWidth: 1.8,
        borderColor: color,
        borderRadius: 3,
        position: 'absolute',
        bottom: size * 0.1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ width: size * 0.26, height: size * 0.26, borderRadius: (size * 0.26) / 2, borderWidth: 1.5, borderColor: color }} />
    </View>
    {/* Top Flash bump */}
    <View style={{ width: size * 0.28, height: size * 0.12, backgroundColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2, position: 'absolute', top: size * 0.12 }} />
  </View>
);

// 19. Image / Gallery Icon
export const ImageIcon: React.FC<IconProps> = ({ color = '#3B82F6', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.8,
        height: size * 0.7,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* Sun circle */}
      <View style={{ width: size * 0.18, height: size * 0.18, borderRadius: (size * 0.18) / 2, backgroundColor: color, position: 'absolute', top: size * 0.1, right: size * 0.1 }} />
      {/* Mountain */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.25,
          borderRightWidth: size * 0.25,
          borderBottomWidth: size * 0.35,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
    </View>
  </View>
);

// 20. Checkmark Icon
export const CheckIcon: React.FC<IconProps> = ({ color = '#10B981', size = 18 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.3,
        height: size * 0.55,
        borderColor: color,
        borderBottomWidth: 2.5,
        borderRightWidth: 2.5,
        transform: [{ rotate: '45deg' }],
        marginTop: -size * 0.1,
      }}
    />
  </View>
);

// 21. Close / Cross Icon
export const CloseIcon: React.FC<IconProps> = ({ color = '#64748B', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={{ width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }], position: 'absolute' }} />
    <View style={{ width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
  </View>
);

// 22. Warning / Alert Icon
export const WarningIcon: React.FC<IconProps> = ({ color = '#F59E0B', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.4,
        borderRightWidth: size * 0.4,
        borderBottomWidth: size * 0.72,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.36, fontWeight: '900', marginTop: size * 0.2 }}>!</Text>
    </View>
  </View>
);

// 23. Truck Delivery Icon
export const TruckIcon: React.FC<IconProps> = ({ color = '#2563EB', size = 28 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
      <View
        style={{
          width: size * 0.46,
          height: size * 0.36,
          backgroundColor: color,
          borderRadius: 3,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ width: size * 0.22, height: 2, backgroundColor: '#FFFFFF', borderRadius: 1 }} />
      </View>
      <View
        style={{
          width: size * 0.24,
          height: size * 0.26,
          backgroundColor: color,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 2,
          marginLeft: 2,
        }}
      />
    </View>
    <View style={{ flexDirection: 'row', width: size * 0.68, justifyContent: 'space-between' }}>
      <View style={{ width: size * 0.15, height: size * 0.15, borderRadius: (size * 0.15) / 2, backgroundColor: color, borderWidth: 2, borderColor: '#FFFFFF' }} />
      <View style={{ width: size * 0.15, height: size * 0.15, borderRadius: (size * 0.15) / 2, backgroundColor: color, borderWidth: 2, borderColor: '#FFFFFF' }} />
    </View>
  </View>
);

// 24. Navigation Arrow Head Icon
export const NavigationArrowIcon: React.FC<IconProps> = ({ color = '#2563EB', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.28,
        borderRightWidth: size * 0.28,
        borderBottomWidth: size * 0.65,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        transform: [{ rotate: '30deg' }],
        marginTop: -size * 0.05,
      }}
    />
  </View>
);

// 25. Location Pin Icon
export const LocationPinIcon: React.FC<IconProps> = ({ color = '#EF4444', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View
      style={{
        width: size * 0.52,
        height: size * 0.52,
        borderRadius: (size * 0.52) / 2,
        backgroundColor: color,
        borderBottomRightRadius: 0,
        transform: [{ rotate: '-45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -size * 0.08,
      }}
    >
      <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: (size * 0.2) / 2, backgroundColor: '#FFFFFF' }} />
    </View>
  </View>
);

// 26. Star Rating Icon
export const StarIcon: React.FC<IconProps> = ({ color = '#F59E0B', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <Text style={{ color, fontSize: size * 0.9, fontWeight: '900', marginTop: -2 }}>★</Text>
  </View>
);

// 27. Car Vehicle Icon (Clean Car Sedan Badge)
export const CarIcon: React.FC<IconProps> = ({ color = '#0066FF', size = 24 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}>
    {/* Cabin Roof */}
    <View
      style={{
        width: size * 0.46,
        height: size * 0.22,
        backgroundColor: color,
        borderTopLeftRadius: size * 0.1,
        borderTopRightRadius: size * 0.1,
        marginBottom: -1,
      }}
    />
    {/* Car Body */}
    <View
      style={{
        width: size * 0.78,
        height: size * 0.32,
        backgroundColor: color,
        borderRadius: size * 0.08,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
    {/* Wheels */}
    <View style={{ flexDirection: 'row', width: size * 0.6, justifyContent: 'space-between', marginTop: -size * 0.08 }}>
      <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: (size * 0.16) / 2, backgroundColor: '#000000', borderWidth: 1.8, borderColor: color }} />
      <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: (size * 0.16) / 2, backgroundColor: '#000000', borderWidth: 1.8, borderColor: color }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  iconBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
