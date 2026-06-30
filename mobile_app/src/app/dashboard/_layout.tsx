import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import TerminalButton from '@/components/TerminalButton';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TimerProvider } from '@/context/TimerContext';

export default function DashboardLayout() {
  const { checkAuth, user, isLoading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(73);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.log('Logout error', e);
    }
    await checkAuth();
    router.replace('/login');
  };

  const navItems = [
    { label: 'DASHBOARD', route: '/dashboard' },
    { label: 'SUBJECTS', route: '/dashboard/subjects' },
    { label: 'GPA_CALC', route: '/dashboard/gpa' },
    { label: 'TODO_LIST', route: '/dashboard/todos' },
    { label: 'NOTES', route: '/dashboard/notes' },
    { label: 'CALENDAR', route: '/dashboard/calendar' },
    { label: 'TIMERS', route: '/dashboard/timers' },
    { label: 'ATTENDANCE', route: '/dashboard/attendance' },
    { label: 'SETTINGS', route: '/dashboard/settings' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-theme-bg" edges={['top', 'left', 'right']}>
      {/* Top Header and Dropdown Container */}
      <View className="z-50">
        <View 
          className="flex-row items-center justify-between p-4 border-b border-theme-border bg-theme-bg"
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <Text className="text-theme-primary font-bold text-xl font-mono tracking-widest">
            NewDash_
          </Text>
          <View className="flex-row gap-2">
            <TerminalButton 
              title={isMenuOpen ? "CLOSE" : "MENU"} 
              onPress={() => setIsMenuOpen(!isMenuOpen)} 
            />
            <TerminalButton 
              title="LOGOUT" 
              variant="danger" 
              onPress={handleLogout} 
            />
          </View>
        </View>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <View 
            className="absolute left-0 right-0 bg-theme-bg border-b border-theme-border p-4 shadow-lg" 
            style={{ top: headerHeight }}
          >
          <ScrollView className="max-h-64">
            <View className="flex-col gap-2">
              {navItems.map((item) => (
                <Pressable
                  key={item.route}
                  className="py-3 px-4 border border-theme-border/50 active:bg-theme-border-bg"
                  onPress={() => {
                    setIsMenuOpen(false);
                    router.push(item.route as any);
                  }}
                >
                  <Text className="text-theme-primary font-mono text-base">
                    [ {item.label} ]
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      </View>

      <TimerProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </TimerProvider>
    </SafeAreaView>
  );
}
