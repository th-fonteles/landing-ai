import { streamText, convertToModelMessages } from 'ai'
import { createGroq } from '@ai-sdk/groq'

// export const runtime = 'edge'

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY!,
})

export async function POST(req: Request) {
    const { messages } = await req.json()

    const result = streamText({
        model: groq('openai/gpt-oss-120b'), // grátis, 6000 tokens/min
        system: `Você é um expert em React e Tailwind. 
    Gere APENAS o código TSX de uma landing page completa.
    REGRAS CRÍTICAS:
    1. Comece direto com "export default function LandingPage() {"
    2. NÃO use markdown, não coloque \`\`\`tsx, não dê explicações.
    3. Use apenas Tailwind CSS. Não importe bibliotecas.
    4. Crie seções: Hero, Features, Pricing, Footer.
    5. Design moderno, dark mode, cores roxo/violeta como principal.
    6. O código deve ser completo e funcional.
    7. SEMPRE feche todas as tags JSX. Não pare no meio.`, // <- regra nova
        messages: await convertToModelMessages(messages),
        maxOutputTokens: 4000, // <- força resposta completa
        temperature: 0.2, // <- menos criatividade = menos chance de quebrar
    })

    return result.toUIMessageStreamResponse()
}
