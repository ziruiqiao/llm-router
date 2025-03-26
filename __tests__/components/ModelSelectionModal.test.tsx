import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ModelSelectionModal from '@/components/ModelSelectionModal';
import { LLMModel } from '@/types/chat';

// Mock the theme colors hook
jest.mock('@/hooks/useColorScheme', () => ({
  useThemeColors: () => ({
    colors: {
      text: '#000000',
      icon: '#000000',
      background: '#ffffff'
    }
  })
}));

describe('ModelSelectionModal', () => {
  const mockModels: { [key: string]: LLMModel } = {
    'model1': {
      id: 'model1',
      name: 'Test Model 1',
      description: 'Test Description 1',
      pricing: { prompt: 0, completion: 0 }
    },
    'model2': {
      id: 'model2',
      name: 'Test Model 2',
      description: 'Test Description 2',
      pricing: { prompt: 0, completion: 0 }
    }
  };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    availableModels: mockModels,
    onSelectModel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders model list when no model is selected', () => {
    const { getByTestId, getAllByTestId } = render(
      <ModelSelectionModal {...defaultProps} />
    );

    // Check if model names are rendered
    const modelItems = getAllByTestId(/^model-item-/);
    expect(modelItems).toHaveLength(2);

    // Check if info icons are rendered
    const infoIcons = getAllByTestId(/^info-icon-/);
    expect(infoIcons).toHaveLength(2);
  });

  it('shows model details when info icon is clicked', () => {
    const { getByTestId, getByText } = render(
      <ModelSelectionModal {...defaultProps} />
    );

    // Click info icon for first model
    const infoIcon = getByTestId('info-icon-model1');
    fireEvent.press(infoIcon);

    // Check if model details are shown
    const modelName = getByTestId('model-name');
    const modelId = getByTestId('model-id');
    const modelDescription = getByTestId('model-description');

    expect(modelName.props.value).toBe('Test Model 1');
    expect(modelId.props.value).toBe('ID: model1');
    expect(modelDescription.props.value).toBe('Test Description 1');
  });

  it('calls onSelectModel when a model is selected', () => {
    const onSelectModel = jest.fn();
    const { getByTestId } = render(
      <ModelSelectionModal {...defaultProps} onSelectModel={onSelectModel} />
    );

    const modelItem = getByTestId('model-item-model1');
    fireEvent.press(modelItem);

    expect(onSelectModel).toHaveBeenCalledWith(mockModels['model1']);
  });

  it('calls onClose when back button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ModelSelectionModal {...defaultProps} onClose={onClose} />
    );

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('returns to model list when back button is pressed in details view', () => {
    const { getByTestId, getAllByTestId } = render(<ModelSelectionModal {...defaultProps} />);

    // First enter details view
    const infoIcon = getByTestId('info-icon-model1');
    fireEvent.press(infoIcon);

    // Press back button
    const backButton = getByTestId('details-back-button');
    fireEvent.press(backButton);

    // Check if we're back to model list
    const modelItems = getAllByTestId(/^model-item-/);
    expect(modelItems).toHaveLength(2);
  });

  it('handles empty models list', () => {
    const { queryByTestId } = render(
      <ModelSelectionModal {...defaultProps} availableModels={{}} />
    );

    // Check if no models are rendered
    const modelItems = queryByTestId(/^model-item-/);
    expect(modelItems).toBeNull();
  });
}); 