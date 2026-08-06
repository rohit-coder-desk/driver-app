import React, { useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';

interface ZoomableImageViewerProps {
  uri: string;
}

export const ZoomableImageViewer: React.FC<ZoomableImageViewerProps> = ({ uri }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Gesture state tracking refs
  const currentScale = useRef(1);
  const pinchStartScale = useRef(1);
  const pinchStartDist = useRef(0);
  const currentPan = useRef({ x: 0, y: 0 });

  const getTouchDistance = (touches: any[]) => {
    if (!touches || touches.length < 2) return 0;
    const t1 = touches[0];
    const t2 = touches[1];
    const x1 = t1.pageX !== undefined ? t1.pageX : t1.locationX || 0;
    const y1 = t1.pageY !== undefined ? t1.pageY : t1.locationY || 0;
    const x2 = t2.pageX !== undefined ? t2.pageX : t2.locationX || 0;
    const y2 = t2.pageY !== undefined ? t2.pageY : t2.locationY || 0;
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const resetZoom = () => {
    currentScale.current = 1;
    pinchStartScale.current = 1;
    pinchStartDist.current = 0;
    currentPan.current = { x: 0, y: 0 };

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 40 }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 8, tension: 40 }),
    ]).start();
  };

  useEffect(() => {
    resetZoom();
  }, [uri]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const touches = evt.nativeEvent.touches;
        return (touches && touches.length >= 2) || currentScale.current > 1.05;
      },
      onStartShouldSetPanResponderCapture: (evt) => {
        const touches = evt.nativeEvent.touches;
        return (touches && touches.length >= 2);
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        return (touches && touches.length >= 2) ||
          (currentScale.current > 1.05 && (Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1));
      },
      onMoveShouldSetPanResponderCapture: (evt) => {
        const touches = evt.nativeEvent.touches;
        return (touches && touches.length >= 2);
      },

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          pinchStartDist.current = getTouchDistance(touches);
          pinchStartScale.current = currentScale.current;
        } else if (touches && touches.length === 1 && currentScale.current > 1.05) {
          pan.setOffset({ x: currentPan.current.x, y: currentPan.current.y });
          pan.setValue({ x: 0, y: 0 });
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        // 2-Finger Pinch Zoom (Works on Android Emulator Ctrl+Drag & Physical Devices)
        if (touches && touches.length >= 2) {
          const dist = getTouchDistance(touches);
          if (dist > 0) {
            if (pinchStartDist.current <= 0) {
              pinchStartDist.current = dist;
              pinchStartScale.current = currentScale.current;
            } else {
              const ratio = dist / pinchStartDist.current;
              const targetScale = Math.max(1, Math.min(pinchStartScale.current * ratio, 5));
              scale.setValue(targetScale);
              currentScale.current = targetScale;
            }
          }
        }
        // 1-Finger Pan/Drag (only when zoomed in)
        else if (touches && touches.length === 1 && currentScale.current > 1.05) {
          pan.x.setValue(gestureState.dx);
          pan.y.setValue(gestureState.dy);
        }
      },

      onPanResponderRelease: () => {
        pan.flattenOffset();
        pinchStartDist.current = 0;

        if (currentScale.current < 1.08) {
          resetZoom();
        } else {
          currentPan.current = {
            x: (pan.x as any)._value || 0,
            y: (pan.y as any)._value || 0,
          };
        }
      },

      onPanResponderTerminate: () => {
        pinchStartDist.current = 0;
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [
                { scale: scale },
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
        >
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  animatedContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
