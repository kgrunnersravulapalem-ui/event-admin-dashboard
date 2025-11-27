# 🚀 Quick Start Guide

Get your Event Enrollment application running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (or run: `npm install -g pnpm`)
- Firebase account (free)

## Step 1: Firebase Setup (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (Start in production mode)
4. Copy your Firebase config from **Project Settings** → **Web App**

## Step 2: Environment Setup (1 minute)

```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local and add your Firebase credentials
# (Use any text editor)
```

Paste your Firebase values:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 3: Install & Run (1 minute)

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Step 4: Test It! (1 minute)

1. Open [http://localhost:3000](http://localhost:3000)
2. Fill in the enrollment form:
   - Organization: Any
   - Name: Test User
   - Gender: Any
   - Mobile: 1234567890
   - Category: Any
   - Size: Any
3. Click **Submit Enrollment**
4. See the success toast! 🎉

## Verify in Firebase

1. Go to Firebase Console → **Firestore Database**
2. You should see a `participants` collection with your test data

## That's it! 🎊

Your application is now running. Check out these docs for more:

- **SETUP.md** - Detailed setup instructions
- **COMPONENTS.md** - Component documentation
- **PROJECT_STRUCTURE.md** - Project overview
- **README.md** - Full documentation

## Troubleshooting

### "Failed to add participant"
→ Check your Firebase credentials in `.env.local`
→ Make sure Firestore is enabled
→ Check browser console for errors

### Port 3000 already in use
→ Run on different port: `pnpm dev -p 3001`

### Module not found
→ Delete `node_modules` and run `pnpm install` again

## Next Steps

- Customize the organization list in `EnrollmentForm.tsx`
- Adjust colors in `globals.css` and component styles
- Add your branding and logo
- Deploy to Vercel (push to GitHub and connect)

## Need Help?

Check the comprehensive documentation in:
- SETUP.md (detailed setup)
- COMPONENTS.md (component usage)
- PROJECT_STRUCTURE.md (file organization)

**Happy coding!** 🚀

---

Built with ❤️ using Next.js, TypeScript, and Firebase
