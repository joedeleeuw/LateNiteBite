import "@/global.css";

import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export { ErrorBoundary } from "expo-router";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (!sentryDsn) {
  throw new Error("EXPO_PUBLIC_SENTRY_DSN is required for Sentry.");
}

Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 0.2,
  beforeSend(event, hint) {
    const error = hint?.originalException ?? hint?.syntheticException;
    if (error) console.error("[sentry]", error);
    if (__DEV__) return null;
    return event;
  },
});

function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
