import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TerminalButton from '@/components/TerminalButton';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
// Calculate a safe font size so that ~58 monospace characters fit on the screen.
// A typical monospace character has an aspect ratio of ~0.6, so 58 * 0.6 = 34.8.
// We add a little padding factor to be safe.
const safeFontSize = Math.min(width / 42, 9);

export default function HomeScreen() {
  const router = useRouter();

  const TARGET_LOGO = "[ N E W D A S H ]";
  const GLITCH_CHARS = "!<>-_\\\\/[]{}—=+*^?#________";

  const [bootLog, setBootLog] = useState<string[]>([]);
  const [booting, setBooting] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [glitchText, setGlitchText] = useState(TARGET_LOGO);
  const [isGlitching, setIsGlitching] = useState(false);

  const targetText = "./start_dashboard.sh";

  // Global blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Boot sequence effect
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

  // Typing and Glitch effect after booting
  useEffect(() => {
    if (!booting) {
      // Start Glitch Effect
      setIsGlitching(true);
      let iterations = 0;
      const glitchInterval = setInterval(() => {
        setGlitchText(prev => prev.split('').map((char, index) => {
          if (char === ' ') return ' '; // Preserve spaces
          if (index < iterations / 3) return TARGET_LOGO[index];
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }).join(''));

        if (iterations >= TARGET_LOGO.length * 3) {
          clearInterval(glitchInterval);
          setIsGlitching(false);
          setGlitchText(TARGET_LOGO);
        }
        iterations += 1;
      }, 50);

      // Start Typing Effect
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        setTypedText(targetText.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex >= targetText.length) {
          clearInterval(typeInterval);
        }
      }, 70);

      return () => {
        clearInterval(glitchInterval);
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

              {/* Glitch Logo */}
              <View className="items-center justify-center w-full px-4 h-32">
                <Text
                  className="font-mono font-bold text-theme-primary text-center"
                  style={{
                    fontSize: 40,
                    letterSpacing: 2,
                    textShadowColor: isGlitching ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: isGlitching ? 20 : 12,
                    opacity: 0.95
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {glitchText}
                </Text>
              </View>

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
