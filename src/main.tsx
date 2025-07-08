
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import useSupabaseAuthStore from '@/store/supabaseAuthStore'

// Initialize auth when the app starts
useSupabaseAuthStore.getState().initialize();

createRoot(document.getElementById("root")!).render(<App />);
