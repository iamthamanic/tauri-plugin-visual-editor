import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModalApp } from './ModalApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModalApp />
  </StrictMode>,
);
