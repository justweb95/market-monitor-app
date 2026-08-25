import Animated from 'react-native-reanimated';

import { rf, rs } from '@/constants/responsive';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: rf(28),
        lineHeight: rf(32),
        marginTop: rs(-6),
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}
