# Ez-PDF

A clean, minimal PDF reader for Android built with React Native and Expo.
Includes an AI-powered document summarization feature using Anthropic's Claude API,
with a limit of 5 free summaries per month per device.

> Built as a portfolio project to demonstrate full-stack mobile development,
> native file handling, backend integration with Supabase, and practical AI implementation.

---

## Screenshots

<table>
  <tr>
    <td align="center"><img width="260" alt="Screenshot_1791869561" src="https://github.com/user-attachments/assets/a35515a0-fccf-4694-a3c5-6b0a396c3c26" /></td>
    <td align="center"><img width="260" alt="Screenshot_1791869583" src="https://github.com/user-attachments/assets/054c2bab-6e96-4843-bdc5-96ce33f25a12" /></td>
  </tr>
  <tr>
    <td align="center"><img width="260" alt="Screenshot_1791869571" src="https://github.com/user-attachments/assets/2bad2b0b-1332-4896-8cf3-db88520b8f56" /></td>
    <td align="center"><img width="260" alt="Screenshot_1791869588" src="https://github.com/user-attachments/assets/341656f3-f586-4853-b6f4-f6cd6e230a0a" /></td>
  </tr>
</table>

---

## Features

- 📂 Open PDFs from your device, or straight from other apps via **Open with… Ez-PDF**
- 🔒 Open password-protected PDFs (the password is kept in memory only, never stored)
- 🔍 Full-text search with highlighted matches inside the document
- 🔖 Bookmark pages for quick access
- 🖨️ Print documents through the system print dialog
- ✨ AI-generated document summaries (5 free per month, documents up to 100 pages)
- 🕘 Recent files carousel, with quick delete by swiping, long-pressing or tapping ✕
- 🧭 Guided onboarding tour, available again anytime from the menu
- 🌍 Available in English, Spanish and French
- 🌙 Dark and light mode
- ⚠️ Clear error messages for damaged or unsupported files
- 📱 Android support

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Expo + React Native | Cross-platform, fast iteration |
| Language | TypeScript | Type safety across the full codebase |
| PDF Rendering | react-native-pdf-jsi | Faster than react-native-pdf, JSI-based |
| Printing | expo-print | Native print dialog without extra setup |
| State Management | Zustand | Minimal boilerplate, sufficient for this scope |
| Localization | i18next + react-i18next | Simple key-based translations with device language detection |
| Backend | Supabase (Edge Functions) | Serverless, free tier, protects API keys |
| AI | Anthropic API — claude-haiku-4-5 | Fast and cost-efficient for summarization |
| Navigation | React Navigation | Industry standard for React Native |

---

## Project Structure
```text
/
├── assets/                    # App icon, splash screen, Play Store artwork
├── screens/                   # HomeScreen, ViewerScreen
├── components/                # Reusable UI components
│   ├── Viewer/                # Viewer panels (search, bookmarks, summary), password prompt, load error
│   ├── PdfPane/               # Memoized PDF view
│   └── Onboarding/            # Guided tour
├── hooks/                     # useBottomPanel, useKeyboardHeight
├── services/                  # File picker, "Open with" imports, AI summary, Supabase client
├── store/                     # Zustand stores (pdf, bookmark, theme, onboarding, device)
├── locales/                   # Translations (en, es, fr)
├── supabase/
│   └── functions/
│       └── generate-summary/  # Edge Function — validates credits + calls Anthropic
└── app.json                   # Expo configuration
```

---

## Architecture Overview

The app follows a layered architecture. The Anthropic API key never lives
in the client — all AI requests go through a Supabase Edge Function that
validates the monthly credit limit before calling the API.

```text
App (React Native)
  → Supabase Edge Function (validates credits + calls Anthropic)
  → Anthropic API (claude-haiku-4-5)
  → Supabase DB (tracks usage per device in summary_credits)
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Supabase CLI (`npm install -g supabase`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio with an emulator, or an Android device
- An Expo account
- A Supabase project with a `summary_credits` table
- An Anthropic API key

### 1. Clone the repository

```bash
git clone https://github.com/OscarManuelGarzaMaya/Ez-PDF.git
cd Ez-PDF
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase

```bash
supabase login
supabase link --project-ref your_project_ref
supabase functions deploy generate-summary
```

Set the Anthropic API key as a Supabase secret:

```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Run the app

The app uses native modules, so it runs as a development build, not in Expo Go:

```bash
npx expo run:android
```

After the first install, `npx expo start` is enough until you add or update a native dependency.

---

## Download

[Google Play Store](https://play.google.com/store/apps/details?id=com.oscarg.ezpdf&pli=1)

---

## License

MIT © Oscar Manuel Garza Maya
