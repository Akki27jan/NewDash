import React from 'react';
import { Pressable, Text, View, PressableProps } from 'react-native';

interface TerminalButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function TerminalButton({ title, variant = 'primary', ...props }: TerminalButtonProps) {
  // Define variant styles if needed later. For now, use primary.
  const titleColor = variant === 'danger' ? 'text-theme-accent' : 'text-theme-primary';

  return (
    <Pressable
      className="group flex-row items-center justify-center py-2 px-4 active:bg-theme-border-bg"
      {...props}
    >
      <Text className="text-theme-border group-active:text-theme-secondary font-mono text-base">
        [
      </Text>
      <Text className={`${titleColor} mx-2 font-mono text-base tracking-widest uppercase`}>
        {title}
      </Text>
      <Text className="text-theme-border group-active:text-theme-secondary font-mono text-base">
        ]
      </Text>
    </Pressable>
  );
}
