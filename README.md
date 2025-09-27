# CollegeCrush

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2.0-yellow" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-2.53.0-green" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-blue" alt="Tailwind CSS" />
</div>

<div align="center">
  <h3>The exclusive dating app for college students</h3>
  <p>Connect with fellow students through swiping, blind dates, and real-time messaging</p>
</div>

## ✨ Features

### 🔐 **Secure Authentication**
- College email verification (50+ supported universities)
- OTP-based login for enhanced security
- Automatic profile creation and onboarding

### 💫 **Modern Swipe Experience**
- Tinder-style card swiping with smooth animations
- Premium user ads integration
- Daily swipe limits for free users
- Advanced matching algorithm

### 💬 **Real-Time Messaging**
- Instant messaging with typing indicators
- Message read receipts and delivery status
- Retry mechanism for failed messages
- Rizz meter for conversation analysis
- AI-powered icebreakers

### 📅 **Blind Date System**
- Location-based date proposals
- Premium feature with cafe selection
- VibeCheck feedback system
- Anonymous date matching

### 🎯 **Premium Features**
- Unlimited swipes
- Blind date access
- Priority matching
- Ad-free experience

### 🎨 **Polished UI/UX**
- Responsive design for all devices
- Dark theme with glassmorphism effects
- Smooth Framer Motion animations
- Accessibility-first approach

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: Google Gemini API for icebreakers
- **Payments**: Cashfree integration
- **Deployment**: Vercel/Netlify ready

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Gemini API key (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anuragkrishna15/CollegeCrush.git
   cd CollegeCrush
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Database Setup**
   - Run the SQL script in `scripts/database_setup.sql` in your Supabase SQL editor
   - Configure storage buckets as described in `docs/storage_setup.html`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 📁 Project Structure

```
CollegeCrush/
├── src/
│   ├── components/
│   │   ├── screens/          # Main app screens
│   │   ├── modals/           # Modal components
│   │   ├── common/           # Reusable components
│   │   ├── chat/             # Chat-specific components
│   │   └── skeletons/        # Loading skeletons
│   ├── services/             # API and external services
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   ├── utils/                # Utility functions
│   ├── constants/            # App constants
│   └── App.tsx               # Main app component
├── docs/                     # Documentation
├── scripts/                  # Database scripts
└── public/                   # Static assets
```

## 🎯 Key Components

### Core Screens
- **SwipeScreen**: Card-based swiping interface
- **ChatScreen**: Conversation list and messaging
- **DatesScreen**: Blind date management
- **ProfileScreen**: User profile and settings

### Services
- **API Service**: RESTful API calls to Supabase
- **Messaging Service**: Real-time chat with retry logic
- **Authentication**: Secure user management

### Features
- **Real-time subscriptions** for live updates
- **Optimistic UI** for smooth interactions
- **Error boundaries** for crash prevention
- **Lazy loading** for performance optimization

## 🔧 Configuration

### Supported Universities
The app supports authentication from 50+ Indian universities including:
- VIT Delhi, IIIT Delhi, Amity University
- JIMS, MAIT, GTBIT, BPIT
- Jamia Hamdard, LPU, CU Mail
- And many more...

### Environment Variables
```env
# Required
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional
GEMINI_API_KEY=your_api_key_for_ai_features
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

See `docs/DEPLOYMENT.md` and `docs/VERCEL_DEPLOY.md` for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support or questions:
- Create an issue on GitHub
- Contact the development team

## 🙏 Acknowledgments

- Built with ❤️ for college students
- Special thanks to the Supabase team for amazing backend services
- Icons by Lucide React
- Animations powered by Framer Motion

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/Anuragkrishna15">Anurag Krishna</a></p>
  <p>Connect students, create memories ✨</p>
</div>