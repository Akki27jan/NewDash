import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme, PresetTheme, CustomColors } from '@/context/ThemeContext';
import TerminalButton from '@/components/TerminalButton';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { theme, setTheme, customColors, setCustomColors } = useTheme();

  const [builderColors, setBuilderColors] = useState<CustomColors>(customColors);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [modalError, setModalError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setBuilderColors(customColors);
  }, [customColors]);

  const handleColorChange = (key: keyof CustomColors, value: string) => {
    setBuilderColors(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyCustomTheme = () => {
    setCustomColors(builderColors);
    setTheme('custom');
    setSuccessMsg('[SUCCESS] Custom theme activated and saved locally.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleApplyPreset = (preset: PresetTheme) => {
    setTheme(preset);
    setSuccessMsg(`[SUCCESS] ${preset.toUpperCase()} theme activated.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const exportPayload = JSON.stringify(builderColors, null, 2);

  const handleCopyToClipboard = () => {
    Clipboard.setString(exportPayload);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleValidateAndImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.bg || !parsed.primary) {
        throw new Error('Invalid theme payload format.');
      }

      const mergedColors = { ...builderColors, ...parsed };
      setBuilderColors(mergedColors);
      setCustomColors(mergedColors);
      setTheme('custom');

      setShowImportModal(false);
      setImportText('');
      setModalError('');
      setSuccessMsg('[SUCCESS] Theme imported and applied.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setModalError('[ERROR] ' + (err.message || 'Invalid JSON payload.'));
    }
  };

  const colorFields: { key: keyof CustomColors, label: string }[] = [
    { key: 'bg', label: 'Background' },
    { key: 'primary', label: 'Primary Text' },
    { key: 'secondary', label: 'Secondary Text' },
    { key: 'muted', label: 'Muted Text' },
    { key: 'border', label: 'Borders' },
    { key: 'borderBg', label: 'Border Background (rgba/hex)' },
    { key: 'accent', label: 'Accent / Danger' },
    { key: 'accentBg', label: 'Accent Background (rgba/hex)' },
    { key: 'success', label: 'Success' },
    { key: 'successBg', label: 'Success Background (rgba/hex)' },
    { key: 'warning', label: 'Warning / Yellow' },
  ];

  const presets: PresetTheme[] = ['default', 'matrix', 'cyberpink', 'catppuccin', 'tokyo-night', 'osaka-jade', 'nord', 'matte-black'];

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        {/* Page Title */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text className="text-theme-primary font-bold text-lg font-mono whitespace-nowrap">
                <Text className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</Text>
                :~/settings# _
              </Text>
            </ScrollView>
          </View>
          <Text className="text-theme-secondary font-mono text-sm">
            Configure system preferences and custom terminal themes.
          </Text>
        </View>

        {successMsg ? (
          <Text className="text-theme-success bg-theme-success-bg p-2 font-mono text-sm border border-theme-success mb-6">
            {successMsg}
          </Text>
        ) : null}

        {/* Preset Themes */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-6">
          <View className="border-b border-theme-border pb-2 mb-4 flex-row justify-between items-center">
            <Text className="text-theme-primary font-bold font-mono text-lg">
              <Text className="text-theme-accent">&gt;</Text> [PRESET_THEMES]
            </Text>
            {theme !== 'custom' && <Text className="text-theme-success font-mono text-xs">[{theme.toUpperCase()}_ACTIVE]</Text>}
          </View>

          <View className="flex-row flex-wrap gap-3">
            {presets.map(p => (
              <Pressable
                key={p}
                onPress={() => handleApplyPreset(p)}
                className={`px-3 py-2 border ${theme === p ? 'border-theme-primary bg-theme-border-bg' : 'border-theme-border'}`}
              >
                <Text className={`font-mono text-sm ${theme === p ? 'text-theme-primary font-bold' : 'text-theme-secondary'}`}>
                  [ {p.toUpperCase()} ]
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Theme Builder */}
        <View className="border border-theme-border p-4 bg-theme-bg mb-8">
          <View className="border-b border-theme-border pb-2 mb-4 flex-row justify-between items-center">
            <Text className="text-theme-primary font-bold font-mono text-lg">
              <Text className="text-theme-accent">&gt;</Text> [THEME_BUILDER]
            </Text>
            {theme === 'custom' && <Text className="text-theme-success font-mono text-xs">[ACTIVE]</Text>}
          </View>

          <View className="flex-col gap-4">
            {colorFields.map(field => (
              <View key={field.key} className="flex-col gap-1">
                <Text className="text-theme-secondary font-mono text-xs">&gt; {field.label}:</Text>
                <View className="flex-row items-center gap-2">
                  <View style={{ width: 20, height: 20, backgroundColor: builderColors[field.key] || '#000', borderWidth: 1, borderColor: '#fff' }} />
                  <TextInput
                    value={builderColors[field.key]}
                    onChangeText={(val) => handleColorChange(field.key, val)}
                    className="flex-1 bg-transparent border-b border-theme-border text-theme-primary py-1 font-mono focus:border-theme-accent text-sm"
                    placeholder="#000000" placeholderTextColor="#1e3a8a80"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-3 justify-center mt-6">
            <TerminalButton title="IMPORT" variant="default" onPress={() => { setShowImportModal(true); setModalError(''); setImportText(''); }} />
            <TerminalButton title="EXPORT" variant="default" onPress={() => { setShowExportModal(true); setModalError(''); setCopySuccess(false); }} />
            <TerminalButton title="APPLY_CUSTOM" variant="danger" onPress={handleApplyCustomTheme} />
          </View>
        </View>
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent={true} animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg shadow-theme-primary/20">
            <View className="bg-theme-border px-2 py-1 flex-row justify-between items-center">
              <Text className="text-black font-mono text-xs font-bold">UW PICO 5.09</Text>
              <Text className="text-black font-mono text-xs font-bold">File: theme_export.json</Text>
            </View>
            <View className="p-2 border-b border-theme-border/50">
              <Text className="text-theme-secondary font-mono text-xs">&gt; Payload: Read-Only</Text>
            </View>
            <ScrollView className="max-h-64 p-2">
              <TextInput
                editable={false}
                value={exportPayload}
                multiline
                className="text-theme-primary font-mono text-sm leading-relaxed"
              />
            </ScrollView>
            <View className="bg-theme-border/20 p-2 border-t border-theme-border flex-row flex-wrap gap-4 items-center">
              <Pressable onPress={handleCopyToClipboard} className="flex-row items-center">
                <Text className="bg-theme-border text-black px-1 mr-1 font-bold font-mono text-xs">^O</Text>
                <Text className="text-theme-secondary font-mono text-xs">Copy [COPY]</Text>
              </Pressable>
              <Pressable onPress={() => setShowExportModal(false)} className="flex-row items-center">
                <Text className="bg-theme-border text-black px-1 mr-1 font-bold font-mono text-xs">ESC</Text>
                <Text className="text-theme-secondary font-mono text-xs">Exit [CLOSE]</Text>
              </Pressable>
            </View>
            {copySuccess && <Text className="text-theme-success font-mono text-xs text-center pb-2 bg-theme-border/20">Copied to clipboard!</Text>}
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent={true} animationType="fade" onRequestClose={() => setShowImportModal(false)}>
        <View className="flex-1 justify-center items-center bg-[#000000cc] p-4">
          <View className="w-full max-w-sm border border-theme-border bg-theme-bg shadow-lg shadow-theme-primary/20">
            <View className="bg-theme-border px-2 py-1 flex-row justify-between items-center">
              <Text className="text-black font-mono text-xs font-bold">UW PICO 5.09</Text>
              <Text className="text-black font-mono text-xs font-bold">File: theme_import.json</Text>
            </View>
            <View className="p-2 border-b border-theme-border/50">
              <Text className="text-theme-secondary font-mono text-xs">&gt; Action: Paste Theme Payload</Text>
            </View>
            <ScrollView className="max-h-64 p-2">
              <TextInput
                value={importText}
                onChangeText={setImportText}
                multiline
                placeholder="[ Enter payload here... ]"
                placeholderTextColor="#1e3a8a80"
                className="text-theme-primary font-mono text-sm leading-relaxed min-h-[200px]"
                autoCapitalize="none"
              />
            </ScrollView>
            <View className="bg-theme-border/20 p-2 border-t border-theme-border flex-row flex-wrap gap-4 items-center">
              <Pressable onPress={handleValidateAndImport} className="flex-row items-center">
                <Text className="bg-theme-border text-black px-1 mr-1 font-bold font-mono text-xs">^O</Text>
                <Text className="text-theme-secondary font-mono text-xs">Write [APPLY]</Text>
              </Pressable>
              <Pressable onPress={() => setShowImportModal(false)} className="flex-row items-center">
                <Text className="bg-theme-border text-black px-1 mr-1 font-bold font-mono text-xs">ESC</Text>
                <Text className="text-theme-secondary font-mono text-xs">Exit [CANCEL]</Text>
              </Pressable>
            </View>
            {modalError ? <Text className="text-theme-accent font-mono text-xs text-center pb-2 bg-theme-border/20">{modalError}</Text> : null}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
