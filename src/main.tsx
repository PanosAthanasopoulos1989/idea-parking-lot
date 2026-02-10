import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log("Main.tsx - Starting React mount...");
const container = document.getElementById('root');
console.log("Main.tsx - Root container found:", !!container);

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log("Main.tsx - Render call sent");
} else {
  console.error("Main.tsx - COULD NOT FIND ROOT ELEMENT!");
}
