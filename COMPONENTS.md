# Component Documentation

This document provides usage examples and API references for all reusable components.

## UI Components

### Button

A versatile button component with multiple variants and sizes.

**Import:**
```tsx
import { Button } from '@/components/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | Visual style variant |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| fullWidth | `boolean` | `false` | Whether button takes full width |
| isLoading | `boolean` | `false` | Shows loading spinner |
| children | `ReactNode` | required | Button content |

**Examples:**

```tsx
// Primary button
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

// Loading state
<Button isLoading={true}>
  Submitting...
</Button>

// Full width
<Button fullWidth>
  Submit Enrollment
</Button>

// Secondary outline
<Button variant="outline" onClick={handleReset}>
  Reset
</Button>
```

---

### Input

A text input component with label, validation, and helper text support.

**Import:**
```tsx
import { Input } from '@/components/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Label text |
| error | `string` | - | Error message to display |
| helperText | `string` | - | Helper text below input |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size |
| icon | `ReactNode` | - | Icon element on the left |
| required | `boolean` | `false` | Whether field is required |

**Examples:**

```tsx
// Basic input
<Input
  label="Full Name"
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Required input with error
<Input
  label="Email"
  type="email"
  required
  error="Please enter a valid email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With helper text
<Input
  label="Mobile Number"
  type="tel"
  helperText="Enter 10-digit mobile number"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>

// With icon
<Input
  label="Search"
  icon={<SearchIcon />}
  placeholder="Search..."
/>
```

---

### Dropdown

A select/dropdown component with customizable options.

**Import:**
```tsx
import { Dropdown } from '@/components/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Label text |
| options | `DropdownOption[]` | required | Array of options |
| placeholder | `string` | `'Select an option'` | Placeholder text |
| error | `string` | - | Error message |
| helperText | `string` | - | Helper text |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | Dropdown size |
| required | `boolean` | `false` | Whether field is required |

**DropdownOption Type:**
```tsx
interface DropdownOption {
  value: string;
  label: string;
}
```

**Examples:**

```tsx
// Basic dropdown
const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

<Dropdown
  label="Gender"
  options={genderOptions}
  value={gender}
  onChange={(e) => setGender(e.target.value)}
/>

// Required dropdown with error
<Dropdown
  label="Category"
  options={categoryOptions}
  required
  error="Please select a category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
/>

// With custom placeholder
<Dropdown
  label="Organization"
  options={orgOptions}
  placeholder="Choose your organization"
  value={org}
  onChange={(e) => setOrg(e.target.value)}
/>
```

---

### Card

A container component with consistent styling.

**Import:**
```tsx
import { Card } from '@/components/ui';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `ReactNode` | required | Card content |
| className | `string` | `''` | Additional CSS classes |

**Examples:**

```tsx
// Basic card
<Card>
  <h2>Title</h2>
  <p>Content goes here</p>
</Card>

// With custom styling
<Card className="custom-card-style">
  <EnrollmentForm />
</Card>
```

---

## Form Components

### EnrollmentForm

The main enrollment form component with all fields and validation.

**Import:**
```tsx
import EnrollmentForm from '@/components/forms/EnrollmentForm';
```

**Props:**
None - This is a complete form component.

**Example:**

```tsx
import EnrollmentForm from '@/components/forms/EnrollmentForm';

function Page() {
  return (
    <div>
      <h1>Enrollment</h1>
      <EnrollmentForm />
    </div>
  );
}
```

**Features:**
- Organization selection
- Personal information (name, gender, mobile)
- Event details (category, size)
- Real-time validation
- Firebase integration
- Success/error notifications
- Form reset functionality

---

## Styling Guidelines

### CSS Modules

All components use CSS Modules for styling. Never use inline styles.

**File naming convention:**
- Component: `ComponentName.tsx`
- Styles: `ComponentName.module.css`

**Example:**

```tsx
// Button.tsx
import styles from '@/styles/Button.module.css';

const Button = () => (
  <button className={styles.button}>
    Click me
  </button>
);
```

### Class Composition

Combine multiple classes using array filter and join:

```tsx
const buttonClasses = [
  styles.button,
  styles[variant],
  fullWidth && styles.fullWidth,
  className,
]
  .filter(Boolean)
  .join(' ');

<button className={buttonClasses}>...</button>
```

---

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus states with `:focus-visible`
- Tab order is logical

### ARIA Attributes
- Proper ARIA labels and roles
- `aria-invalid` for error states
- `aria-describedby` for helper/error text
- `aria-required` for required fields

### Screen Readers
- Semantic HTML elements
- Descriptive labels
- Error announcements with `role="alert"`

**Example:**
```tsx
<input
  id={inputId}
  aria-invalid={!!error}
  aria-describedby={error ? errorId : undefined}
  aria-required={required}
/>
```

---

## Responsiveness

All components are fully responsive:

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

### Responsive Patterns
- Flexible layouts with CSS Grid and Flexbox
- Relative units (rem, em, %)
- Media queries in CSS Modules
- Touch-friendly target sizes (min 44x44px)

---

## Best Practices

### Component Development

1. **Single Responsibility**: Each component does one thing well
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Props Validation**: Use TypeScript interfaces for all props
4. **Documentation**: Document all components with JSDoc comments
5. **Accessibility First**: Include ARIA attributes and keyboard support
6. **Error Handling**: Gracefully handle all error states
7. **Loading States**: Show loading indicators for async operations

### Code Style

1. **Naming**: Use PascalCase for components, camelCase for functions
2. **Exports**: Use named exports for utilities, default for components
3. **File Structure**: One component per file
4. **Comments**: Use JSDoc for public APIs, inline comments for complex logic
5. **TypeScript**: Always define types, avoid `any`

---

## Testing

### Manual Testing Checklist

For each component:
- [ ] All variants render correctly
- [ ] Props are validated
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Responsive on all screen sizes
- [ ] Loading/error states display properly
- [ ] Focus management works
- [ ] Meets accessibility standards

---

## Need Help?

- Check inline code documentation
- Review component source code
- Test in browser DevTools
- Use React DevTools for debugging

Happy coding! 🚀
