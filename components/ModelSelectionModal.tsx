import React, {useState} from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, SectionList } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { LLMModel } from '@/types/chat';
import { useThemeColors } from '@/hooks/useColorScheme';
import tw from 'twrnc';
import Sidebar from './SideBarAnim';

/**
 * Props for the ModelSelectionModal component
 */
interface ModelSelectionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Function to call when closing the modal */
  onClose: () => void;
  /** Object mapping model IDs to their details */
  availableModels: { [key: string]: LLMModel };
  /** Function to call when a model is selected */
  onSelectModel: (model: LLMModel) => void;
}

/**
 * Modal component for selecting a language model
 * Displays a list of available models with their details and allows selection
 */
export default function ModelSelectionModal({
  visible,
  onClose,
  availableModels,
  onSelectModel,
}: ModelSelectionModalProps) {
  const [selectedItem, setSelectedItem] = React.useState<LLMModel | null>(null);
  const { colors } = useThemeColors();

  // Add this parent-level state to track which sections are expanded
  const [expandedSections, setExpandedSections] = React.useState<{ [title: string]: boolean }>({});

  function toggleSection(title: string) {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }

  const groupModelsByProvider = (models: LLMModel[]) => {
    const sections: { title: string; data: LLMModel[] }[] = [];
    const providerMap: Record<string, LLMModel[]> = {};
  
    models.forEach(model => {
      const provider = model.id.split("/")[0];
      if (!providerMap[provider]) providerMap[provider] = [];
      providerMap[provider].push(model);
    });
  
    // Sort providers by number of models (descending)
    const sortedProviders = Object.keys(providerMap).sort(
      (a, b) => providerMap[b].length - providerMap[a].length
    );
  
    // Create sections in the sorted order
    for (const provider of sortedProviders) {
      sections.push({ title: provider, data: providerMap[provider] });
    }
  
    return sections;
  };

  return (
    <Sidebar sidebarExpanded={visible} closeSidebar={onClose} slideFrom="right">
      <View style={tw`flex-1 p-4`}>
        {selectedItem ? (
          // Full-screen description view
          <View style={tw`flex-1 p-4`}>
            <TouchableOpacity onPress={() => setSelectedItem(null)} style={tw`mb-4`} testID="details-back-button">
              <Ionicons name="arrow-back" size={28} color={colors.icon} />
            </TouchableOpacity>
            <TextInput
              style={tw`text-xl font-bold mb-2 p-2 rounded-lg text-[${colors.text}]`}
              value={selectedItem.name}
              editable={false}
              multiline
              testID="model-name"
            />
            <TextInput
              style={tw`text-sm text-gray-400 mb-2 p-2 rounded-lg`}
              value={`ID: ${selectedItem.id}`}
              editable={false}
              multiline
              testID="model-id"
            />
            <TextInput
              style={tw`text-gray-400 p-2 rounded-lg`}
              value={selectedItem.description}
              editable={false}
              multiline
              testID="model-description"
            />
          </View>
        ) : (
          // Model List with Info Icon
          <>
            <View style={tw`flex flex-row justify-start pt-10 pb-1 px-1.5`}>
              <TouchableOpacity onPress={onClose} testID="back-button">
                <Feather name="arrow-left" size={28} color={colors.icon} />
              </TouchableOpacity>
            </View>
            <SectionList
              sections={groupModelsByProvider(Object.values(availableModels))}
              keyExtractor={(item) => item.id}
              renderSectionHeader={({ section: { title } }) => {
                // Remove the inline useState call and use expandedSections instead
                const isExpanded = expandedSections[title] ?? true;
                return (
                  <TouchableOpacity 
                    onPress={() => toggleSection(title)}
                    style={tw`flex-row items-center justify-between px-4 py-2`}
                  >
                    <Text style={tw`text-xl font-bold text-[${colors.text}]`}>
                      {title}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={colors.icon}
                    />
                  </TouchableOpacity>
                );
              }}
              renderItem={({ item, section }) => {
                // Remove the inline useState call; only render items for expanded sections
                if (!expandedSections[section.title]) return null;

                return (
                  <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
                    <TouchableOpacity 
                      onPress={() => onSelectModel(item)} 
                      style={tw`flex-1`}
                      testID={`model-item-${item.id}`}
                    >
                      <Text style={tw`text-lg text-[${colors.text}]`}>{item.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedItem(item)} testID={`info-icon-${item.id}`}>
                      <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color={colors.icon}
                      />
                    </TouchableOpacity>
                  </View>
                );
              }}
              extraData={availableModels}
            />
          </>
        )}
      </View>
    </Sidebar>
  );
} 