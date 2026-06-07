import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import './layouts.css'
import { AuthProvider } from './auth/AuthContext'
import { SettingsProvider } from './SettingsContext'
import Root from './Root'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>,
)
