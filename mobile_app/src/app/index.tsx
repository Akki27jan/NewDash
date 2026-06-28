import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TerminalButton from '@/components/TerminalButton';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  
  const asciiArt = `
███    ██ ███████ ██     ██ ██████  █████  ██████  ██   ██ 
████   ██ ██      ██     ██ ██   ██ ██  ██ ██      ██   ██ 
██ ██  ██ █████   ██  █  ██ ██   ██ ██████ ██████  ███████ 
██  ██ ██ ██      ██ ███ ██ ██   ██ ██  ██     ██  ██   ██ 
██   ████ ███████  ███ ███  ██████  ██  ██ ██████  ██   ██ 
  `;

  const [bootLog, setBootLog] = useState<string[]>([]);
  const [booting, setBooting] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const targetText = "./start_dashboard.sh";

  // Global blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const logs = [
      "Initializing kernel...",
      "Mounting /dev/nvme0n1p2...",
      "Loading drivers... OK",
      "Checking filesystem... CLEAN",
      "Starting student services...",
      "Bypassing firewall... [DONE]",
      "Sequence initiated."
    ];
    let step = 0;
    const bootInterval = setInterval(() => {
      setBootLog(prev => [...prev, logs[step]]);
      step++;
      if (step >= logs.length) {
        clearInterval(bootInterval);
        setTimeout(() => setBooting(false), 500);
      }
    }, 150);

    return () => clearInterval(bootInterval);
  }, []);

  useEffect(() => {
    if (!booting) {
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        setTypedText(targetText.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex >= targetText.length) {
          clearInterval(typeInterval);
        }
      }, 70);

      return () => {
        clearInterval(typeInterval);
      };
    }
  }, [booting]);

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center p-4">
        {booting ? (
          <View className="w-full flex-col justify-center h-full px-4 pt-32">
            {bootLog.map((log, i) => (
              <Text key={i} className="text-xs text-theme-secondary font-mono mb-1" style={{ opacity: 0.7 }}>
                {log}
              </Text>
            ))}
            <View className={`w-2 h-4 bg-theme-secondary mt-1 ${showCursor ? 'opacity-70' : 'opacity-0'}`} />
          </View>
        ) : (
          <View className="flex-1 flex-col items-center justify-between w-full h-full pt-16">
            <View className="flex-1 items-center justify-center w-full">
              {/* ASCII Art - Scaled down for mobile */}
              <Text 
                className="font-mono text-[7.5px] leading-tight font-bold text-theme-primary text-center"
                style={{ 
                  textShadowColor: 'rgba(59, 130, 246, 0.5)', 
                  textShadowOffset: { width: 0, height: 0 }, 
                  textShadowRadius: 10,
                  opacity: 0.9 
                }}
                numberOfLines={6}
                adjustsFontSizeToFit
              >
                {asciiArt}
              </Text>

              <View className="mt-8 flex-row items-center flex-wrap justify-center" style={{ opacity: 0.8 }}>
                <Text className="text-theme-accent text-sm font-mono">guest@newdash</Text>
                <Text className="text-theme-primary mx-1 text-sm font-mono">:~$</Text>
                <Text className="text-theme-primary text-sm font-mono">{typedText}</Text>
                <View className={`ml-1 w-2 h-4 bg-theme-primary ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="w-full pb-8 flex-col gap-4">
              <TerminalButton 
                title="Login" 
                onPress={() => router.push('/login')} 
              />
              <TerminalButton 
                title="Sign Up" 
                onPress={() => router.push('/signup')} 
                variant="secondary"
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
