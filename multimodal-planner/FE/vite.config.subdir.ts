import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    base: '/carpub',
    root: './',
    plugins: [react()],
    build: {
        commonjsOptions: { transformMixedEsModules: true }
    }
})
