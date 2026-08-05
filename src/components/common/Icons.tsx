import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IconProps {
  color?: string;
  size?: number;
}

export const HomeIcon: React.FC<IconProps> = ({ color = '#2563eb', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={[styles.roofTriangle, { borderBottomColor: color, borderBottomWidth: size * 0.45, borderLeftWidth: size * 0.45, borderRightWidth: size * 0.45 }]} />
    <View style={[styles.houseBase, { backgroundColor: color, width: size * 0.65, height: size * 0.45, marginTop: -size * 0.05 }]} />
  </View>
);

export const ProfileIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={[styles.headCircle, { backgroundColor: color, width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    <View style={[styles.bodyArc, { backgroundColor: color, width: size * 0.75, height: size * 0.38, borderRadius: size * 0.38, marginTop: size * 0.08 }]} />
  </View>
);

export const EditIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={[styles.pencilBody, { backgroundColor: color, width: size * 0.3, height: size * 0.65, borderRadius: size * 0.08, transform: [{ rotate: '-45deg' }] }]} />
    <View style={[styles.pencilBaseLine, { backgroundColor: color, width: size * 0.7, height: 2, marginTop: size * 0.15 }]} />
  </View>
);

export const OrdersIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}> 
    <View style={{ width: size * 0.8, height: size * 0.16, backgroundColor: color, borderRadius: 3, marginBottom: size * 0.12 }} />
    <View style={{ width: size * 0.6, height: size * 0.16, backgroundColor: color, borderRadius: 3, marginBottom: size * 0.12 }} />
    <View style={{ width: size * 0.4, height: size * 0.16, backgroundColor: color, borderRadius: 3 }} />
  </View>
);

export const DocumentsIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}> 
    <View style={{ width: size * 0.7, height: size * 0.85, borderWidth: 2, borderColor: color, borderRadius: 4, padding: 2 }}>
      <View style={{ width: size * 0.45, height: size * 0.14, backgroundColor: color, borderRadius: 2, marginBottom: 4 }} />
      <View style={{ width: size * 0.6, height: size * 0.14, backgroundColor: color, borderRadius: 2, marginBottom: 4 }} />
      <View style={{ width: size * 0.35, height: size * 0.14, backgroundColor: color, borderRadius: 2 }} />
    </View>
  </View>
);

export const SupportIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, justifyContent: 'center', alignItems: 'center' }]}> 
    <View style={{ width: size * 0.7, height: size * 0.55, borderRadius: size * 0.15, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.45, height: size * 0.14, backgroundColor: color, borderRadius: 2 }} />
    </View>
    <View style={{ position: 'absolute', bottom: size * 0.15, width: size * 0.22, height: size * 0.1, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

export const EarningsIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }]}> 
    <Text style={{ color, fontSize: size * 0.55, fontWeight: '900', marginTop: -1 }}>₹</Text>
  </View>
);

export const LogoutIcon: React.FC<IconProps> = ({ color = '#ef4444', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}> 
    <View style={{ width: size * 0.55, height: size * 0.7, borderRadius: 3, borderWidth: 2, borderColor: color, borderRightWidth: 0 }} />
    <View style={{ width: size * 0.35, height: 2, backgroundColor: color, marginLeft: -size * 0.15 }} />
    <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color, marginLeft: -1 }} />
  </View>
);

export const LockShieldIcon: React.FC<{ size?: number; color?: string }> = ({ size = 48, color = '#3B82F6' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.75,
      height: size * 0.85,
      borderWidth: 2.5,
      borderColor: color,
      borderTopLeftRadius: size * 0.35,
      borderTopRightRadius: size * 0.35,
      borderBottomLeftRadius: size * 0.45,
      borderBottomRightRadius: size * 0.45,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: size * 0.28,
        height: size * 0.22,
        borderWidth: 2,
        borderColor: color,
        borderTopLeftRadius: size * 0.14,
        borderTopRightRadius: size * 0.14,
        borderBottomWidth: 0,
        marginBottom: -1,
      }} />
      <View style={{
        width: size * 0.36,
        height: size * 0.26,
        backgroundColor: color,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#061A3A' }} />
      </View>
    </View>
  </View>
);

export const CategoryVectorIcon: React.FC<{ type: string; color?: string; size?: number }> = ({
  type,
  color = '#60A5FA',
  size = 20,
}) => {
  switch (type) {
    case 'documents':
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.7, height: size * 0.85, borderWidth: 2, borderColor: color, borderRadius: 4, padding: 2 }}>
            <View style={{ width: '80%', height: 2, backgroundColor: color, marginBottom: 3, borderRadius: 1 }} />
            <View style={{ width: '100%', height: 2, backgroundColor: color, marginBottom: 3, borderRadius: 1 }} />
            <View style={{ width: '60%', height: 2, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );
    case 'trips':
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.85, height: size * 0.45, borderWidth: 2, borderColor: color, borderRadius: 6, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: size * 0.35, height: 2, backgroundColor: color, borderRadius: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: size * 0.7, marginTop: 2 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
          </View>
        </View>
      );
    case 'earnings':
      return (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color, fontSize: size * 0.6, fontWeight: '900', marginTop: -1 }}>₹</Text>
        </View>
      );
    case 'navigation':
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
          </View>
          <View style={{ width: 0, height: 0, borderLeftWidth: size * 0.2, borderRightWidth: size * 0.2, borderTopWidth: size * 0.3, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color, marginTop: -1 }} />
        </View>
      );
    case 'account':
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, backgroundColor: color, marginBottom: 2 }} />
          <View style={{ width: size * 0.75, height: size * 0.35, borderRadius: size * 0.2, backgroundColor: color }} />
        </View>
      );
    case 'vehicle':
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.85, height: size * 0.4, borderWidth: 2, borderColor: color, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: size * 0.65, marginTop: 1 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
          </View>
        </View>
      );
    case 'app_issues':
      return (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, borderWidth: 2, borderColor: color }} />
        </View>
      );
    case 'faqs':
    default:
      return (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color, fontSize: size * 0.55, fontWeight: '900' }}>?</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  iconBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  roofTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBase: {
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  headCircle: {},
  bodyArc: {},
  pencilBody: {},
  pencilBaseLine: {},
});
