import Groq from "groq-sdk";
import { readFileSync } from "fs";
import { join } from "path";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Load training data
  let trainingData = "";
  try {
    const trainingPath = join(process.cwd(), "AI_TRAINING_DATA.md");
    trainingData = readFileSync(trainingPath, "utf-8");
  } catch {
    // Fallback if file not found
    trainingData = `Eagle Tutorials Services - A tutoring company based in Addis Ababa, Ethiopia. 
We provide personalized home and online tutoring for KG-12, university students, and adults. 
Contact: info@eagletutorials.com, Phone: +251 932 508 910 or +251 914 731 746.
Website: https://eagletutorials.netlify.app`;
  }

  const systemPrompt = `You are the Eagle Tutorials Services Support Bot, an AI assistant for Eagle Tutorials Services, a tutoring company based in Addis Ababa, Ethiopia.

IMPORTANT IDENTITY RULES:
- You are a support bot/assistant, NOT Genene Tise
- Genene Tise is the CEO and founder of Eagle Tutorials Services (a real person)
- Only mention Genene Tise when specifically asked about the founder, owner, CEO, or who started the company
- When greeting or introducing yourself, say "Hello! I'm the Eagle Tutorials Support Bot" or similar
- Never claim to be Genene Tise

TRAINING DATA:
${trainingData}

INSTRUCTIONS:
1. Answer questions based on the training data above about Eagle Tutorials Services
2. Be professional, friendly, and encouraging
3. If you don't know something specific, provide general helpful information about tutoring services
4. Always mention the contact information when relevant: info@eagletutorials.com, +251 932 508 910
5. For tutor applications, direct them to: https://forms.gle/yRfe2JxqqhjY8kTD7
6. Keep responses concise but informative (2-4 sentences typically)
7. If asked about pricing, say it varies by subject and level, and they should contact us for a quote
8. Emphasize our personalized approach and experienced tutors
9. ONLY mention Genene Tise when asked about the founder, CEO, owner, or who started the company

TONE: Professional yet approachable, encouraging and supportive.`;

  try {
    const stream = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      model: "llama-3.1-8b-instant", // Fast, cheap, production-ready
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    // Create a ReadableStream for the response
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              // Format as Vercel AI SDK expects: "0:content\n"
              const data = `0:"${content.replace(/"/g, '\\"')}"\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Groq API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
