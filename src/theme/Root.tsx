import React from "react";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      defaultColorScheme="light"
      theme={{
        primaryColor: "dark",
        fontFamily:
          'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      {children}
    </MantineProvider>
  );
}
