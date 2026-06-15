import TranslationPopup from './components/TranslationPopup'
import MiniMode from './components/MiniMode'
import SettingsPage from './components/SettingsPage'
import './styles/globals.css'

function App() {
  // Determine which view to show based on URL hash
  const hash = window.location.hash

  if (hash === '#/mini') {
    return <MiniMode />
  }

  if (hash === '#/settings') {
    return <SettingsPage />
  }

  // Default: translation popup
  return <TranslationPopup />
}

export default App
