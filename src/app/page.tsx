'use client'

import { useChat } from '@ai-sdk/react'
import { Sandpack } from "@codesandbox/sandpack-react"
import { nightOwl } from "@codesandbox/sandpack-themes"
import { DefaultChatTransport } from 'ai'
import { useState, useMemo } from 'react'

// Move pra fora do componente - constante não precisa recriar
const defaultCode = `export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-500 mb-4">
          Gerador de Landing Page com IA
        </h1>
        <p className="text-gray-400">
          Descreva seu produto ao lado e clique em Gerar
        </p>
      </div>
    </div>
  )
}`

export default function Home() {
  const [showEditor, setShowEditor] = useState(false)
  const [input, setInput] = useState('')

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/generate',
    }),
    onError: (err) => {
      console.error('Stream error:', err)
    }
  })

  const isLoading = status === 'streaming'

  const lastAssistantMessage = useMemo(() => {
    if (isLoading) return ''
    return messages
      .filter(m => m.role === 'assistant')
      .at(-1)
      ?.parts
      .find(part => part.type === 'text')
      ?.text || ''
  }, [messages, isLoading])

  const isCodeComplete =
    lastAssistantMessage.includes('export default') &&
    lastAssistantMessage.trim().endsWith('}') &&
    (lastAssistantMessage.match(/{/g) || []).length === (lastAssistantMessage.match(/}/g) || []).length

  const generatedCode = isCodeComplete ? lastAssistantMessage : ''
  const codeError = !isCodeComplete && lastAssistantMessage ? 'Código incompleto. Gere novamente.' : error?.message

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input) return
    sendMessage({ text: input })
    setInput('')
  }

  const sandpackFiles = useMemo(() => ({
    "/App.tsx": {
      code: generatedCode || defaultCode, // <- agora defaultCode vem de fora
    },
    "/index.tsx": {
      code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      hidden: true
    },
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      hidden: true
    }
  }), [generatedCode]) // <- agora só depende de generatedCode

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 h-screen bg-zinc-950">
      <div className="p-8 flex flex-col justify-center border-r border-zinc-800">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold text-white mb-2">
            Landing Page AI
          </h1>
          <p className="text-zinc-400 mb-8">
            Descreva seu produto e a IA cria a página na hora
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full h-32 p-4 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: App que organiza tarefas pra freelancers com IA"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Gerando...' : 'Gerar Landing Page'}
            </button>
          </form>

          {generatedCode && (
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300"
            >
              {showEditor ? 'Ver só Preview' : 'Mostrar Editor de Código'}
            </button>
          )}

          {codeError && (
            <div className="mt-4 text-sm text-red-400 bg-red-950/50 p-3 rounded border border-red-900">
              {codeError}
            </div>
          )}
        </div>
      </div>

      <div className="h-screen">
        <Sandpack
          key={generatedCode}
          theme={nightOwl}
          template="react-ts"
          files={sandpackFiles}
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
            showNavigator: false,
            showTabs: false,
            editorHeight: "100vh",
            // @ts-expect-error bla
            layout: showEditor ? "split" : "preview",
            autorun: true,
            autoReload: false
          }}
        />
      </div>
    </main>
  )
}