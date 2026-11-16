import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SportProvider } from './context/SportContext'
import { CartProvider } from './context/CartContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SportProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </SportProvider>
    </AuthProvider>
  </BrowserRouter>
)