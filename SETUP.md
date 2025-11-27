# Setup Guide - Event Enrollment Application

This guide will help you set up and run the Event Enrollment application.

## Step 1: Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `event-enrollment` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Enable Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll adjust rules later)
4. Choose a Cloud Firestore location closest to your users
5. Click **"Enable"**

### Configure Firestore Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{document=**} {
      // Allow read and write access to participants collection
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

> **Note**: These rules allow unrestricted access. For production, implement proper authentication and authorization.

### Get Firebase Configuration

1. Click the **gear icon** (Settings) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** `</>` to add a web app
4. Register app name: `Event Enrollment`
5. **Copy the Firebase configuration** (you'll need these values):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 2: Environment Configuration

1. In your project root, copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
   ```

3. Save the file

> **Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Step 3: Install Dependencies

Make sure you have pnpm installed. If not:

```bash
npm install -g pnpm
```

Then install project dependencies:

```bash
pnpm install
```

## Step 4: Run the Application

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Application

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Fill out the enrollment form with test data:
   - Organization: Select any option
   - Name: John Doe
   - Gender: Male
   - Mobile Number: 1234567890
   - Category: 5K
   - Size: M
3. Click **"Submit Enrollment"**
4. You should see a success toast notification
5. Verify data in Firestore:
   - Go to Firebase Console → Firestore Database
   - You should see a `participants` collection with your test entry

## Troubleshooting

### Firebase Connection Issues

**Problem**: "Failed to add participant" error

**Solutions**:
1. Verify your `.env.local` file has correct Firebase credentials
2. Check Firestore security rules allow write access
3. Ensure Firestore is enabled in your Firebase project
4. Check browser console for specific error messages

### Module Not Found Errors

**Problem**: Cannot find module errors

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**: Either kill the process using port 3000 or run on a different port:
```bash
pnpm dev -p 3001
```

### Environment Variables Not Loading

**Problem**: Firebase config not found

**Solutions**:
1. Ensure `.env.local` exists in project root
2. Restart the development server after creating/editing `.env.local`
3. Check that variables start with `NEXT_PUBLIC_`

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub (ensure `.env.local` is not committed)
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
5. Deploy

### Other Platforms

For other platforms (Netlify, AWS, etc.):
1. Build the project: `pnpm build`
2. Set environment variables in platform settings
3. Deploy the `.next` folder

## Security Considerations

### For Production:

1. **Implement Authentication**: Add Firebase Authentication
2. **Update Security Rules**: Restrict Firestore access based on authentication
3. **Add Rate Limiting**: Prevent spam submissions
4. **Input Sanitization**: Validate and sanitize all inputs server-side
5. **HTTPS Only**: Ensure your deployed app uses HTTPS
6. **API Key Restrictions**: In Firebase Console, restrict API keys to your domain

Example production Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.resource.data.keys().hasAll(['organization', 'name', 'gender', 'mobileNumber', 'category', 'size']);
    }
  }
}
```

## Need Help?

- Check the [Next.js Documentation](https://nextjs.org/docs)
- Read [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- Review the project README.md
- Check the inline code documentation

## Next Steps

After successful setup:
- Customize organization options in `EnrollmentForm.tsx`
- Adjust form fields based on your requirements
- Add more validation rules if needed
- Customize the design colors and branding
- Add analytics tracking
- Implement data export functionality

Enjoy using the Event Enrollment application! 🎉
