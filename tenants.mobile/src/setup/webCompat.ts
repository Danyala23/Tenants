import { Animated, Platform, type Animated as AnimatedNamespace } from 'react-native';

type TimingConfig = AnimatedNamespace.TimingAnimationConfig;
type SpringConfig = AnimatedNamespace.SpringAnimationConfig;
type DecayConfig = AnimatedNamespace.DecayAnimationConfig;

/**
 * react-native-web has no native animated module; Paper and other libs pass
 * useNativeDriver: true. Force false on web to avoid console warnings.
 */
if (Platform.OS === 'web') {
  const withoutNativeDriver = <T extends { useNativeDriver?: boolean }>(config: T): T =>
    config.useNativeDriver ? { ...config, useNativeDriver: false } : config;

  const animated = Animated as typeof Animated & {
    timing: typeof Animated.timing;
    spring: typeof Animated.spring;
    decay: typeof Animated.decay;
  };

  const originalTiming = animated.timing;
  animated.timing = (
    value: AnimatedNamespace.Value | AnimatedNamespace.ValueXY,
    config: TimingConfig
  ) => originalTiming(value, withoutNativeDriver(config));

  const originalSpring = animated.spring;
  animated.spring = (
    value: AnimatedNamespace.Value | AnimatedNamespace.ValueXY,
    config: SpringConfig
  ) => originalSpring(value, withoutNativeDriver(config));

  const originalDecay = animated.decay;
  animated.decay = (
    value: AnimatedNamespace.Value | AnimatedNamespace.ValueXY,
    config: DecayConfig
  ) => originalDecay(value, withoutNativeDriver(config));
}
