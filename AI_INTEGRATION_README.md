# AI Assistant Integration Guide

This project now includes a real AI assistant powered by OpenAI GPT-4, trained on Eagle Tutorials Services data.

## What's Been Added

### 1. AI Training Data (`AI_TRAINING_DATA.md`)
- Comprehensive information about Eagle Tutorials Services
- Company overview, services, tutors, contact info
- Brand voice guidelines for the AI
- Common Q&A pairs

### 2. API Route (`src/app/api/chat/route.ts`)
- Handles AI chat requests
- Loads training data and provides it as context
- Streams responses from OpenAI GPT-4o-mini
- Falls back to rule-based replies if AI fails

### 3. Updated ChatWidget (`src/app/_components/ChatWidget.tsx`)
- Toggle button to enable/disable AI mode
- Streaming message display (typing effect)
- Loading states and animations
- Persists AI preference in localStorage

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. Copy the key (you won't see it again!)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Or update your existing `.env` file with the OpenAI key.

### 3. Install Dependencies

The AI SDK packages have been added to package.json. Run:

```bash
npm install
```

### 4. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click the chat button (bottom right)

4. Click the "AI OFF" button to enable AI mode (turns green)

5. Ask questions like:
   - "What services do you offer?"
   - "Who are your tutors?"
   - "How can I become a tutor?"
   - "What is Eagle Tutorials Services?"

## How It Works

### Toggle AI Mode
- Users can toggle between rule-based bot and AI assistant
- AI mode is persisted in localStorage
- When AI is enabled, the button shows "AI ON" in green

### AI Responses
- The AI receives the full training document as context
- It answers based on Eagle Tutorials Services information
- Responses are streamed in real-time (typing effect)
- If the AI API fails, it falls back to the rule-based bot

### Cost Considerations
- Uses GPT-4o-mini (cheaper than GPT-4)
- Typical cost: ~$0.01-0.03 per conversation
- Monitor usage at https://platform.openai.com/usage

## Customizing the AI

### Update Training Data
Edit `AI_TRAINING_DATA.md` to add:
- New services or offerings
- Additional tutor information
- Updated contact details
- New FAQ items
- Brand voice guidelines

After updating, restart the dev server for changes to take effect.

### Change AI Model
Edit `src/app/api/chat/route.ts`:

```typescript
model: openai("gpt-4o"), // For better quality (more expensive)
model: openai("gpt-4o-mini"), // Current setting (good balance)
model: openai("gpt-3.5-turbo"), // Cheaper option
```

### Modify System Prompt
In `src/app/api/chat/route.ts`, edit the `systemPrompt` variable to change:
- AI personality and tone
- Response length
- What information to emphasize
- How to handle unknown questions

## Deployment

### Environment Variables on Hosting

Make sure to set `OPENAI_API_KEY` in your hosting platform:

- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Render**: Dashboard → Environment → Add Environment Variable
- **Railway**: Variables → Add variable

### Security
⚠️ **Important**: Never commit your `.env.local` file or expose the API key in client-side code. The API route keeps the key server-side only.

## Troubleshooting

### "AI not working" or fallback replies
- Check that `OPENAI_API_KEY` is set correctly
- Verify the API key has billing enabled at OpenAI
- Check browser console for errors
- Ensure `AI_TRAINING_DATA.md` exists in project root

### Slow responses
- GPT-4o-mini is already optimized for speed
- Consider upgrading your OpenAI account for higher rate limits
- Check your internet connection

### Cost concerns
- Monitor usage at https://platform.openai.com/usage
- Set up billing alerts at OpenAI
- Consider switching to GPT-3.5-turbo for lower costs

## Features

✅ Real AI powered by OpenAI GPT-4  
✅ Trained on Eagle Tutorials Services data  
✅ Streaming responses (typing effect)  
✅ Toggle between AI and rule-based bot  
✅ Fallback to rule-based if AI fails  
✅ Persists user preferences  
✅ Loading states and animations  
✅ Mobile responsive  

## Next Steps

1. **Test thoroughly** - Try various questions to ensure quality
2. **Refine training data** - Add more specific information as needed
3. **Monitor costs** - Keep an eye on OpenAI usage
4. **Gather feedback** - Ask users about their experience
5. **Iterate** - Update based on common questions and feedback
