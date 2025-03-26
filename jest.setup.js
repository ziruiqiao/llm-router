// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  mergeItem: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn(),
  withTiming: jest.fn(),
  withDelay: jest.fn(),
  withSequence: jest.fn(),
  withRepeat: jest.fn(),
  useAnimatedGestureHandler: jest.fn(),
  useAnimatedScrollHandler: jest.fn(),
  useAnimatedProps: jest.fn(),
  createAnimatedComponent: jest.fn(component => component),
  View: 'Animated.View',
  Text: 'Animated.Text',
  Image: 'Animated.Image',
  ScrollView: 'Animated.ScrollView',
  default: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
  },
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn(),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(),
  useFonts: jest.fn(() => [true, null]),
}));

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {
    ExpoFontLoader: {
      loadAsync: jest.fn(),
    },
  },
}));

// Mock react-native-markdown-display
jest.mock('react-native-markdown-display', () => 'Markdown');

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Paragraph: 'Paragraph',
}));

// Mock react-native-fit-image
jest.mock('react-native-fit-image', () => 'FitImage');

// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn(obj => obj.ios),
  },
  NativeModules: {
    UIManager: {
      RCTView: () => {},
    },
    RNGestureHandlerModule: {
      attachGestureHandler: jest.fn(),
      createGestureHandler: jest.fn(),
      dropGestureHandler: jest.fn(),
      updateGestureHandler: jest.fn(),
      State: {},
      Directions: {},
    },
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  FlatList: 'FlatList',
  Alert: {
    alert: jest.fn(),
  },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  RefreshControl: 'RefreshControl',
  Animated: {
    View: 'Animated.View',
    createAnimatedComponent: jest.fn(),
    timing: jest.fn(),
    spring: jest.fn(),
    Value: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({
      width: 375,
      height: 812,
    })),
  },
  Pressable: 'Pressable',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  Feather: 'Feather',
  AntDesign: 'AntDesign',
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  FontAwesome: 'FontAwesome',
  FontAwesome5: 'FontAwesome5',
  FontAwesome6: 'FontAwesome6',
  FontAwesome6_Brands: 'FontAwesome6_Brands',
  Fontisto: 'Fontisto',
  Foundation: 'Foundation',
  Octicons: 'Octicons',
  Zocial: 'Zocial',
  SimpleLineIcons: 'SimpleLineIcons',
  EvilIcons: 'EvilIcons',
  Entypo: 'Entypo',
  FontAwesome5_Brands: 'FontAwesome5_Brands',
  createIconSet: () => 'Icon',
}));

// Mock the twrnc library
jest.mock('twrnc', () => ({
  __esModule: true,
  default: () => '',
}));

// Mock the SafeAreaView component
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Configure the test environment
global.window = {};
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};

// Use fake timers
jest.useFakeTimers(); 