import React from 'react';
import renderer from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

// Mock the useColorScheme hook
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => ({ colorScheme: 'light' }),
  useThemeColors: () => ({
    colors: {
      text: '#000000',
      text2: '#666666',
      icon: '#999999'
    }
  }),
  useThemeColor: (color: 'text' | 'text2' | 'icon') => {
    const colors = {
      text: '#000000',
      text2: '#666666',
      icon: '#999999'
    };
    return colors[color] || '#000000';
  }
}));

it(`renders correctly`, () => {
  const tree = renderer.create(<ThemedText>Snapshot test!</ThemedText>).toJSON();

  expect(tree).toMatchSnapshot();
});
