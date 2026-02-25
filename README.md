# TutorHub - Open Source Tutor Marketplace

A modern tutor marketplace built with Next.js 15 and Supabase. Connect students with tutors, manage bookings, handle payments, and more.

## Features

- **User Authentication** - Secure auth with Better Auth + Supabase
- **Tutor Profiles** - Browse and search tutors by subject, price, rating
- **Job Postings** - Students can post tutoring jobs
- **Messaging** - Real-time chat between students and tutors
- **Contracts & Milestones** - Secure payment milestones
- **Reviews & Ratings** - Build trust with reviews
- **Admin Dashboard** - Manage users, content, and platform
- **AI Assistant** - Groq-powered chat support

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Supabase (Auth, Database, Realtime, Storage, Edge Functions)
- **Payments**: Chapa (Ethiopian payment gateway)
- **AI**: Groq SDK for chat assistant
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- pnpm/npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tutorhub.git
cd tutorhub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Set up your Supabase project
# 1. Create a new Supabase project
# 2. Run migrations in supabase/migrations/
# 3. Update .env with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/`
3. Configure storage buckets for file uploads
4. Set up edge functions in `supabase/functions/`

## Deployment

Deploy to Vercel, Netlify, or any Node.js hosting:

```bash
npm run build
npm start
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.
