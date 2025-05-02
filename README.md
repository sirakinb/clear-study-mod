# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/27b5acc3-db0e-42e2-a31e-01f51d37c3d2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/27b5acc3-db0e-42e2-a31e-01f51d37c3d2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/27b5acc3-db0e-42e2-a31e-01f51d37c3d2) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# Clear Study Mod

A modern study companion application that helps students record, transcribe, and organize their lecture recordings. Built with React, TypeScript, and Supabase.

## Features

- 🎙️ Audio Recording: Record lectures with a simple interface
- 📝 Automatic Transcription: Convert recordings to text using AssemblyAI
- 📁 Folder Organization: Organize recordings in a hierarchical folder structure
- 🔍 Search & Filter: Easily find your recordings
- 📊 Real-time Updates: Changes sync instantly across all devices

## Tech Stack

- Frontend: React + TypeScript
- UI Components: shadcn/ui
- Database & Auth: Supabase
- Transcription: AssemblyAI
- State Management: React Context
- Styling: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- AssemblyAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sirakinb/clear-study-mod.git
cd clear-study-mod
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ASSEMBLY_AI_KEY=your_assembly_ai_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── contexts/      # React Context providers
  ├── hooks/         # Custom React hooks
  ├── lib/           # Utility functions and configurations
  ├── pages/         # Application pages/routes
  └── types/         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
