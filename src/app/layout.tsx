import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'AcademyCraft - Příprava na přijímačky',
  description: 'Gamifikovaná aplikace pro přípravu na přijímací zkoušky na gymnázium',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AcademyCraft',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2D2D2D',
}

// Blocking script to apply theme immediately (prevents FOUC)
// This runs before React hydrates
const themeScript = `
(function() {
  var THEMES = {
    minecraft: {
      primary: '#17DD62',
      secondary: '#5D8C3E',
      accent: '#FCEE4B',
      xp: '#7EFC20',
      currency: '#17DD62',
      background: '#2D2D2D',
      backgroundLight: '#3D3D3D',
      card: '#1A1A1A',
      text: '#FFFFFF',
      textMuted: '#AAAAAA',
      fontHeading: "'Pixelify Sans', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      isLight: false
    },
    unicorn: {
      primary: '#D946A0',
      secondary: '#9333EA',
      accent: '#F59E0B',
      xp: '#C026D3',
      currency: '#7C3AED',
      background: '#FDF2F8',
      backgroundLight: '#FCE7F3',
      card: '#FFFFFF',
      text: '#1F0A1C',
      textMuted: '#6B3A60',
      fontHeading: "'Inter', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      isLight: true
    },
    kpop: {
      primary: '#FF4D8D',
      secondary: '#8B5CF6',
      accent: '#FFD700',
      xp: '#FF69B4',
      currency: '#8B5CF6',
      background: '#0D0D0D',
      backgroundLight: '#1A1A2E',
      card: '#0F0F1A',
      text: '#FFFFFF',
      textMuted: '#A0A0B0',
      fontHeading: "'Montserrat', 'Arial Black', sans-serif",
      fontBody: "'Montserrat', system-ui, sans-serif",
      isLight: false
    }
  };

  try {
    var savedTheme = localStorage.getItem('academycraft-theme') || 'minecraft';
    var theme = THEMES[savedTheme] || THEMES.minecraft;
    var root = document.documentElement;
    var style = document.body.style;

    // Apply CSS variables
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-xp', theme.xp);
    root.style.setProperty('--theme-currency', theme.currency);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-background-light', theme.backgroundLight);
    root.style.setProperty('--theme-card', theme.card);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-text-muted', theme.textMuted);
    root.style.setProperty('--theme-font-heading', theme.fontHeading);
    root.style.setProperty('--theme-font-body', theme.fontBody);

    // Apply body styles
    style.fontFamily = theme.fontBody;
    style.color = theme.text;
    style.backgroundColor = theme.background;

    // Background pattern (not for light theme)
    if (theme.isLight) {
      style.backgroundImage = 'none';
    } else {
      style.backgroundImage = "linear-gradient(rgba(45, 45, 45, 0.95), rgba(45, 45, 45, 0.95)), url(\\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23555555' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V36h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\\")";
    }

    // Mark that theme was applied to prevent flicker
    document.documentElement.dataset.themeApplied = 'true';
  } catch (e) {
    // Fallback to defaults if localStorage fails
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ServiceWorkerRegistration />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
