import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    base: '/',
    root: './',
    plugins: [react()],
    build: {
        commonjsOptions: { transformMixedEsModules: true }
    }
})
