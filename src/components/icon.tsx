import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View, type ColorValue } from 'react-native';

type Names = Extract<SymbolViewProps['name'], object>;

interface IconProps {
  /** SF Symbol name (iOS). */
  ios: NonNullable<Names['ios']>;
  /** Material Symbol name (Android + web). */
  material: NonNullable<Names['android']>;
  size?: number;
  color: ColorValue;
}

/** Decorative icon: hidden from screen readers, the surrounding control carries the label. */
export function Icon({ ios, material, size = 22, color }: IconProps) {
  return (
    <View aria-hidden accessible={false} importantForAccessibility="no-hide-descendants">
      <SymbolView name={{ ios, android: material, web: material }} size={size} tintColor={color} />
    </View>
  );
}
