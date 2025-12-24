import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { soundService } from './services/sound'
import './fonts.css'
import './index.css'

// Pre-cargar sonidos al iniciar la aplicación
soundService.preloadAll()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

