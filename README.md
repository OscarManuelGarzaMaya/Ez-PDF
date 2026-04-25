# PDF Reader

A clean, minimal PDF reader for Android and iOS built with React Native and Expo.
Includes an AI-powered document summarization feature using Anthropic's Claude API,
with a limit of 5 free summaries per month per device.

> Built as a portfolio project to demonstrate full-stack mobile development,
> native file handling, backend integration with Supabase, and practical AI implementation.

---

## Screenshots

> 🚧 Coming soon

---

## Features

- 📂 Open and read PDF files stored on your device
- 🔍 Full-text search within documents
- 🔖 Bookmark pages for quick access
- ✨ AI-generated document summaries (5 free per month)
- 🌙 Dark and light mode
- 📱 Android and iOS support

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Expo + React Native | Cross-platform, fast iteration |
| Language | TypeScript | Type safety across the full codebase |
| PDF Rendering | react-native-pdf-jsi | Faster than react-native-pdf, JSI-based |
| State Management | Zustand | Minimal boilerplate, sufficient for this scope |
| Backend | Supabase (Edge Functions) | Serverless, free tier, protects API keys |
| AI | Anthropic API — claude-haiku-4-5 | Fast and cost-efficient for summarization |
| Navigation | React Navigation | Industry standard for React Native |

---

## Project Structure

/
├── assets/                  # App icon, splash screen, images
├── screens/                 # HomeScreen, ViewerScreen
├── components/              # Reusable UI components
├── services/                # FileService, SummaryService
├── store/                   # Zustand stores (pdf, bookmark, theme)
├── hooks/                   # Custom hooks
├── supabase/
│   ├── functions/
│   │   └── summarize/       # Edge Function — validates credits + calls Anthropic
│   └── migrations/          # SQL migrations — summary_credits table
├── .env.example             # Required environment variables
└── app.json                 # Expo configuration

---

## Architecture Overview

The app follows a layered architecture. The Anthropic API key never lives
in the client — all AI requests go through a Supabase Edge Function that
validates the monthly credit limit before calling the API.

App (React Native)
→ Supabase Edge Function (validates credits + calls Anthropic)
→ Anthropic API (claude-haiku-4-5)
→ Supabase DB (tracks usage per device)
---

## Local Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)
- EAS CLI (`npm install -g eas-cli`)
- An Expo account
- A Supabase project
- An Anthropic API key

### 1. Clone the repository

```bash
git clone https://github.com/OscarManuelGarzaMaya/pdf-reader.git
cd pdf-reader
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env` file:
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

### 4. Set up Supabase

```bash
supabase login
supabase link --project-ref your_project_ref
supabase db push
supabase functions deploy summarize
```

Set the Anthropic API key as a Supabase secret:

```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Run the app

```bash
npx expo start
```

---

## Download

> 🚧 Coming soon — Google Play Store

---

## License

MIT © Oscar Manuel Garza Maya
