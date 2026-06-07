import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { MantineProvider } from '@mantine/core'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '@mantine/core/styles.css'
import './assets/styles/global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <MantineProvider>
        <App />
        <Analytics />
        <SpeedInsights />
      </MantineProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
