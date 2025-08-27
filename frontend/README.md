# AI Content Moderation Platform - Frontend

## 🎨 Design Features

- **Dark Theme + Gradient Background** - Modern visual experience
- **Glassmorphism Design** - Semi-transparent glass effect
- **Smooth Animations + Modern Icons** - Using Framer Motion and Ant Design icons
- **Responsive Layout + Mobile Adaptation** - Perfect adaptation for various devices

## 🚀 Technology Stack

- **React 18** - Latest version of React framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Ant Design 5.x** - Enterprise-level UI component library
- **Tailwind CSS** - Atomic CSS framework
- **Framer Motion** - Smooth animation library
- **Recharts** - Modern chart library
- **React Router 6** - Routing management
- **Zustand** - Lightweight state management
- **Axios** - HTTP client

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Common components
│   │   ├── Layout/         # Layout components
│   │   ├── Charts/         # Chart components
│   │   └── UI/            # UI components
│   ├── pages/              # Page components
│   │   ├── Dashboard/      # Dashboard
│   │   ├── ContentAudit/   # Content Audit
│   │   ├── AuditHistory/   # Audit History
│   │   └── UserManagement/ # User Management
│   ├── store/              # State management
│   ├── api/                # API interfaces
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   └── styles/             # Style files
├── public/
└── package.json
```

## 🎯 Core Features

### 1. Dashboard
- Real-time data statistics cards
- Audit trend charts (Recharts)
- Audit distribution pie charts
- Recent audit record tables

### 2. Content Audit
- Text content audit
- Image content audit
- Drag and drop upload functionality
- Real-time audit result display

### 3. Audit History
- Advanced filtering functionality
- Paginated table display
- Detail popup viewing
- Data export functionality

### 4. User Management
- User CRUD operations
- Role permission management
- Status management
- Search and filter functionality

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

### Build Production Version
```bash
npm run build
```

### Preview Production Version
```bash
npm run preview
```

## 🎨 Design Highlights

### Visual Effects
- **Dark Theme**: Eye-friendly dark color scheme
- **Gradient Background**: Gradient effect from deep blue to deep gray
- **Glassmorphism**: Semi-transparent glass card effects
- **Smooth Animations**: Page transitions and interaction animations

### Interactive Experience
- **Responsive Design**: Perfect adaptation for desktop and mobile devices
- **Modern Icons**: Using Ant Design icon library
- **Real-time Feedback**: Loading states and operation feedback
- **Accessibility Design**: Support for keyboard navigation and screen readers

### Performance Optimization
- **Code Splitting**: On-demand component loading
- **Lazy Loading**: Image and component lazy loading
- **Cache Strategy**: Reasonable cache configuration
- **Build Optimization**: Vite fast build

## 🔧 Configuration

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { /* Primary colors */ },
        dark: { /* Dark theme colors */ }
      },
      animation: { /* Custom animations */ },
      keyframes: { /* Keyframe animations */ }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Prevent conflicts with Ant Design
  }
}
```

### Ant Design Theme Configuration
```typescript
// App.tsx
<ConfigProvider
  theme={{
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#3b82f6',
      colorBgContainer: 'rgba(15, 23, 42, 0.8)',
      colorBgElevated: 'rgba(30, 41, 59, 0.9)',
      borderRadius: 12,
    },
  }}
>
```

## 📱 Mobile Adaptation

- **Responsive Layout**: Using Tailwind CSS responsive classes
- **Touch Friendly**: Buttons and interactive elements adapted for touch operations
- **Performance Optimization**: Mobile performance optimization
- **PWA Support**: Can be configured as PWA application

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 License

MIT License 