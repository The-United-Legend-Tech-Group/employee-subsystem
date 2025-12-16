import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import AppTheme from '../common/material-ui/shared-theme/AppTheme';
import ModeSwitch from '@/components/ModeSwitch';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: 'Arcana - %s',
    default: 'Arcana',
  },
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data-mui-color-scheme" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <AppTheme>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            {/* <ModeSwitch /> */}
            {props.children}
          </AppTheme>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
