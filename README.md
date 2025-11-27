# Event Enrollment Web Application

A modern, minimal web application for managing event participant enrollments. Built with Next.js, TypeScript, and Firebase Firestore.

## Features

- ✨ **Minimal & Modern Design** - Clean, attractive UI with smooth animations
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- ♿ **Accessible** - WCAG compliant with proper ARIA labels and keyboard navigation
- 🎯 **Form Validation** - Real-time validation with helpful error messages
- 🔥 **Firebase Integration** - Cloud-based data storage with Firestore
- 🎉 **Toast Notifications** - Beautiful success/error feedback
- 🎨 **Reusable Components** - Modular UI components following industry standards
- 📝 **TypeScript** - Type-safe development with comprehensive documentation

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Styling**: CSS Modules (no inline styles)
- **UI Components**: Custom reusable components
- **Notifications**: react-hot-toast
- **Package Manager**: pnpm
- **Code Style**: Airbnb JavaScript Style Guide

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- Firebase account

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up Firebase**:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Get your Firebase configuration from Project Settings

3. **Configure environment variables**:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Add your Firebase credentials to `.env.local`

4. **Run the development server**:
   ```bash
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** with your browser

## Form Fields

The enrollment form includes the following fields:

| Field | Type | Required | Options |
|-------|------|----------|---------|
| Organization | Dropdown | Yes | TCS, Infosys, Wipro, HCL, Tech Mahindra, Other |
| Full Name | Text Input | Yes | - |
| Gender | Dropdown | Yes | Male, Female, Other |
| Mobile Number | Tel Input | Yes | 10-15 digits |
| Race Category | Dropdown | Yes | 3K, 5K, 10K |
| T-Shirt Size | Dropdown | Yes | XS, S, M, L, XL, XXL |

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
