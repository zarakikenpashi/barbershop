import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import { forwardParticipation, participationFailure } from './api/participation.js'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
    {
      name: 'local-participation-api',
      configureServer(server) {
        const env = loadEnv(mode, process.cwd(), '')
        server.middlewares.use('/api/participation', async (req, res) => {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ ok: false })); return }
          try {
            let body = ''
            for await (const chunk of req) {
              body += chunk
              if (body.length > 16000) throw new Error('Requête trop longue')
            }
            const result = await forwardParticipation(JSON.parse(body), env.WEBHOOK_URL || env.VITE_WEBHOOK_URL)
            res.end(JSON.stringify(result))
          } catch (error) {
            const failure = participationFailure(error)
            console.error('[participation]', failure.code, error.name, error.cause?.code || '')
            res.statusCode = 503
            res.end(JSON.stringify(failure))
          }
        })
      },
    },
  ],
}))
