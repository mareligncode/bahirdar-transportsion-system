// store/index.ts - Remove Redux if you're using Zustand
// If you're using Zustand only, this file might not be needed
// But if you have existing Redux code, let me know

// If you're ONLY using Zustand, you can create a simple store setup:
import { useAuth } from './authStore';

export { useAuth };