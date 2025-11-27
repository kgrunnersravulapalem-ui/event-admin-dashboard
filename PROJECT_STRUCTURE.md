# Project Structure Overview

## 📁 Directory Structure

```
event-enrollment/
│
├── 📄 Configuration Files
│   ├── .env.example              # Environment variables template
│   ├── .gitignore               # Git ignore rules
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── next.config.ts           # Next.js configuration
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── package.json             # Dependencies and scripts
│   └── pnpm-lock.yaml           # Lock file for dependencies
│
├── 📚 Documentation
│   ├── README.md                # Project overview and quick start
│   ├── SETUP.md                 # Detailed setup instructions
│   └── COMPONENTS.md            # Component documentation and API
│
├── 🎨 app/                      # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page (main entry)
│
├── 🧩 components/               # React components
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx           # Button component
│   │   ├── Input.tsx            # Input field component
│   │   ├── Dropdown.tsx         # Select/dropdown component
│   │   ├── Card.tsx             # Card container component
│   │   └── index.ts             # Barrel export
│   │
│   └── forms/                   # Form components
│       └── EnrollmentForm.tsx   # Main enrollment form
│
├── 🎨 styles/                   # CSS Modules (no inline styles)
│   ├── Button.module.css        # Button styles
│   ├── Input.module.css         # Input styles
│   ├── Dropdown.module.css      # Dropdown styles
│   ├── Card.module.css          # Card styles
│   ├── EnrollmentForm.module.css # Form styles
│   └── Home.module.css          # Home page styles
│
├── 🔧 lib/                      # Utility libraries
│   ├── firebase.ts              # Firebase initialization
│   └── firestoreService.ts      # Firestore operations
│
├── 📝 types/                    # TypeScript definitions
│   └── index.ts                 # Type definitions
│
└── 🌐 public/                   # Static assets
    ├── next.svg
    └── vercel.svg
```

## 🎯 Key Features Implemented

### ✅ Development Standards
- [x] Airbnb JavaScript Style Guide
- [x] React functional components and hooks
- [x] Comprehensive documentation
- [x] TypeScript for type safety
- [x] pnpm as package manager
- [x] No inline styles - CSS Modules only
- [x] Industry-standard code organization

### ✅ UI Components
- [x] Button component (primary, secondary, outline variants)
- [x] Input component (with validation and icons)
- [x] Dropdown component (customizable options)
- [x] Card component (consistent containers)
- [x] All components fully documented

### ✅ Functionality
- [x] Complete enrollment form with all required fields
- [x] Firebase Firestore integration
- [x] Form validation
- [x] Toast notifications (success/error)
- [x] Loading states
- [x] Form reset functionality
- [x] Error handling

### ✅ Design
- [x] Minimal and modern aesthetic
- [x] Gradient background
- [x] Smooth animations
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Consistent color scheme
- [x] Professional typography

### ✅ Accessibility
- [x] WCAG 2.1 Level AA compliant
- [x] Keyboard navigation
- [x] ARIA labels and roles
- [x] Screen reader support
- [x] Focus management
- [x] Semantic HTML

### ✅ Responsiveness
- [x] Mobile-first approach
- [x] Flexible grid layouts
- [x] Touch-friendly targets
- [x] Tested on multiple devices

## 🔑 Important Files

### Core Application Files

1. **app/page.tsx** - Main landing page with form
2. **components/forms/EnrollmentForm.tsx** - Complete enrollment form
3. **lib/firestoreService.ts** - Database operations
4. **lib/firebase.ts** - Firebase configuration

### Reusable Components

1. **components/ui/Button.tsx** - Reusable button
2. **components/ui/Input.tsx** - Reusable input field
3. **components/ui/Dropdown.tsx** - Reusable dropdown
4. **components/ui/Card.tsx** - Reusable card container

### Styling Files

1. **app/globals.css** - Global styles and resets
2. **styles/Home.module.css** - Home page styles
3. **styles/EnrollmentForm.module.css** - Form styles
4. **styles/Button.module.css** - Button styles
5. **styles/Input.module.css** - Input styles
6. **styles/Dropdown.module.css** - Dropdown styles
7. **styles/Card.module.css** - Card styles

## 🚀 Quick Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## 📊 Form Fields

| Field | Component | Type | Validation |
|-------|-----------|------|------------|
| Organization | Dropdown | Select | Required |
| Name | Input | Text | Required |
| Gender | Dropdown | Select | Required |
| Mobile Number | Input | Tel | Required, 10-15 digits |
| Category | Dropdown | Select | Required |
| Size | Dropdown | Select | Required |

## 🗄️ Database Schema

### Firestore Collection: `participants`

```typescript
{
  organization: string;      // Organization name
  name: string;             // Participant full name
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;     // 10-15 digit number
  category: '3K' | '5K' | '10K';
  size: string;             // T-shirt size (XS-XXL)
  createdAt: Timestamp;     // Auto-generated
}
```

## 🎨 Design System

### Colors

- **Primary**: `#3b82f6` (Blue)
- **Secondary**: `#f1f5f9` (Light Gray)
- **Success**: `#10b981` (Green)
- **Error**: `#ef4444` (Red)
- **Text Primary**: `#1e293b` (Dark Gray)
- **Text Secondary**: `#64748b` (Medium Gray)
- **Background**: `#ffffff` (White)
- **Gradient**: `#667eea` to `#764ba2` (Purple gradient)

### Typography

- **Font Family**: System fonts (San Francisco, Segoe UI, Roboto)
- **Heading**: 2.5rem, bold
- **Subheading**: 1.5rem, semi-bold
- **Body**: 1rem, regular
- **Small**: 0.875rem, medium

### Spacing

- **Base unit**: 0.25rem (4px)
- **Small gap**: 0.5rem (8px)
- **Medium gap**: 1rem (16px)
- **Large gap**: 2rem (32px)

### Border Radius

- **Small**: 0.5rem (8px)
- **Medium**: 1rem (16px)

## 🔐 Security Considerations

### Current Setup (Development)
- Open Firestore rules for easy testing
- Firebase credentials in environment variables
- No authentication required

### Production Recommendations
1. Implement Firebase Authentication
2. Restrict Firestore security rules
3. Add server-side validation
4. Implement rate limiting
5. Add CAPTCHA for spam prevention
6. Use HTTPS only
7. Restrict API keys to specific domains

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Android 90+

## 🎓 Technologies Used

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.0.5 |
| Language | TypeScript | 5.9.3 |
| Database | Firebase | 12.6.0 |
| Styling | CSS Modules | - |
| Notifications | react-hot-toast | 2.6.0 |
| Package Manager | pnpm | 10.13.1 |
| Linting | ESLint | 9.39.1 |

## 📞 Next Steps

1. **Set up Firebase** (see SETUP.md)
2. **Configure environment variables**
3. **Run the development server**
4. **Test the form submission**
5. **Customize as needed**
6. **Deploy to production**

## 🎉 Success Criteria

✅ All development guidelines followed
✅ Industry-standard code quality
✅ Fully documented codebase
✅ Responsive and accessible
✅ Clean, minimal design
✅ Production-ready structure

---

**Ready to go!** Follow SETUP.md to get started. 🚀
