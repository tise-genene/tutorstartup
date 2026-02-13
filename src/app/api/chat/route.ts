import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { readFileSync } from "fs";
import { join } from "path";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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
We provide personalized home tutoring and online programming courses for KG-12, university students, and adults. 
Contact: info@eagletutorials.com, Phone: +251 932 508 910 or +251 914 731 746.
Website: https://eagletutorials.netlify.app`;
  }

  const systemPrompt = `You are an AI assistant for Eagle Tutorials Services, Founded by Visionary CEO Genene Tise, a tutoring company based in Addis Ababa, Ethiopia.

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

TONE: Professional yet approachable, encouraging and supportive.`;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
