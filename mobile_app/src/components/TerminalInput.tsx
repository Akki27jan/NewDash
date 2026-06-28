import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useController, Control } from 'react-hook-form';

interface TerminalInputProps extends TextInputProps {
  name: string;
  label?: string;
  control: Control<any>;
  rules?: object;
}

export default function TerminalInput({ name, label, control, rules, ...props }: TerminalInputProps) {
  const { field, fieldState } = useController({
    name,
    control,
    rules,
  });

  const [isFocused, setIsFocused] = useState(false);
  const displayName = label || name;

  return (
    <View className="flex-col mb-4">
      {/* Label section */}
      <View className="flex-row flex-wrap mb-1">
        <Text className="text-theme-accent font-mono text-sm">guest@newdash</Text>
        <Text className="text-theme-primary font-mono text-sm">:~$ </Text>
        <Text className="text-theme-primary font-mono text-sm">enter_{displayName}:</Text>
      </View>
      
      {/* Input section */}
      <View className="flex-row items-center">
        <Text className="text-theme-muted font-mono text-base mr-2">[</Text>
        <TextInput
          className={`flex-1 font-mono text-white text-base py-1 border-b ${isFocused ? 'border-theme-accent' : 'border-theme-border'}`}
          onChangeText={field.onChange}
          onBlur={() => {
            field.onBlur();
            setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          value={field.value}
          autoCapitalize="none"
          placeholderTextColor="#60a5fa80"
          {...props}
        />
        <Text className="text-theme-muted font-mono text-base ml-2">]</Text>
      </View>

      {/* Error message */}
      {fieldState.error && (
        <Text className="text-theme-accent font-mono text-xs mt-1">
          * {fieldState.error.message || 'This field is required'}
        </Text>
      )}
    </View>
  );
}
