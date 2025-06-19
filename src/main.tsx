import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ChatbotEmbed from './pages/chatbot-embed.tsx'

const isProduction = import.meta.env.PROD;

const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  if (isProduction) {
    return <>{children}</>;
  }
  return <StrictMode>{children}</StrictMode>;
};

createRoot(document.getElementById('root')!).render(
  <AppWrapper>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chatbot-embed" element={<ChatbotEmbed />} />
      </Routes>
    </BrowserRouter>
  </AppWrapper>,
)
