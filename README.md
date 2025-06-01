# Robo Show Prep

A modern web application that helps radio DJs quickly create AI-powered show preparation content through a library of customizable prompts. Generate radio-ready content like artist bios, music facts, weather reports, and various show segments with integrated OpenAI support.

## Features

### 🎙️ Prompt Management
- **Organize Content**: Store and categorize prompts for radio show preparation
- **Custom Prompts**: Create prompts using variables (e.g., `{{artist}}`, `{{song}}`) for customization
- **Smart Organization**: Category navigation with "All Prompts", "Recently Used", and "Favorites" prioritized
- **Tag Filtering**: Filter prompts by tags to quickly find relevant content
- **Import/Export**: Share prompt collections with standardized JSON format

### 🤖 AI Integration
- **OpenAI GPT-4o**: Submit prompts directly to OpenAI for content generation
- **Variable Replacement**: Automatic variable substitution before AI submission
- **Response Management**: Save, edit, and organize AI-generated responses
- **History Tracking**: Browse response history for each prompt with user attribution

### 👥 Multi-User System
- **User Authentication**: Secure JWT-based sessions with password hashing
- **Approval Workflow**: New users require administrator approval before access
- **Data Isolation**: User-specific favorites, recently used items, and responses
- **Admin Dashboard**: Complete user management and system administration interface

### 🔒 Security & Validation
- **Bot Protection**: Cloudflare Turnstile integration for registration and login
- **Real-time Validation**: Live password strength and email format validation
- **Form Security**: Comprehensive input validation with security filtering
- **Session Management**: Secure cookie handling with automatic expiration

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Theme Support**: Light and dark modes with consistent styling
- **Font Customization**: Adjustable font sizes (small, medium, large)
- **Visual Feedback**: Clean interface with intuitive navigation and status indicators

## Quick Start

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/slyderc/roboprep.git
   cd roboprep/webpage
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings (see Configuration section below)
   ```

3. **Initialize Database**
   ```bash
   npx prisma migrate dev
   npm run db:init
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Open `http://localhost:3000`
   - Login with default admin: `admin@example.com` / `RoboPrepMe`
   - **Important**: New user accounts require admin approval

## Configuration

### Required Environment Variables

Create a `.env.local` file with the following settings:

```bash
# OpenAI API Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_OPENAI_MAX_TOKENS=2048
NEXT_PUBLIC_OPENAI_TEMPERATURE=0.7

# Database Configuration
DATABASE_URL="file:../roboprep.db"
DATABASE_TARGET_VERSION="2.1.0"

# Authentication Configuration
JWT_SECRET="your-secure-random-secret-key"
JWT_EXPIRATION="12h"
COOKIE_NAME="robo_auth"
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true

# Security Configuration (Production)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

### OpenAI API Setup
1. Get an API key from [OpenAI](https://platform.openai.com/)
2. Add the key to your `.env.local` file
3. Adjust model settings as needed (model, tokens, temperature)

### Security Setup (Production)
1. Generate a secure JWT secret (32+ random characters)
2. For production deployments, configure Cloudflare Turnstile:
   - Get keys from your Cloudflare dashboard
   - Add to environment variables
   - Turnstile automatically activates in production, bypasses in development

## Database Management

### Basic Operations
```bash
# View database in browser
npx prisma studio

# Reset database (development)
npm run db:reset

# Initialize with default data
npm run db:init
```

### Database Upgrades
The application includes multiple database upgrade methods:

```bash
# Check if upgrade is needed
npm run db:check

# Database-only upgrade (requires manual rebuild)
npm run db:upgrade

# Complete production upgrade (recommended)
npm run db:upgrade-production
```

**Web Interface**: Admin users can manage database upgrades through the admin dashboard at `/admin` → Database Management.

**⚠️ Important**: Web-based upgrades may require manual application restart. For production, use the CLI tools.

For detailed upgrade procedures and troubleshooting, see **[DATABASE_UPGRADES.md](DATABASE_UPGRADES.md)**.

### Backup & Recovery
- Automatic backups created before database upgrades
- Manual backups: `cp roboprep.db roboprep-backup-$(date +%Y%m%d).db`
- Restore: Replace database file with backup

## Production Deployment

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Build Options
- `npm run build` - Optimized production build (recommended)
- `npm run build:quiet` - Minimal output for CI/CD
- `npm run build:strict` - Full warnings for debugging

## User Management

### Default Admin Account
- **Email**: `admin@example.com`
- **Password**: `RoboPrepMe`
- **Note**: Change default password after first login

### User Approval Workflow
1. Users register but cannot access until approved
2. Admin receives notification of pending users on dashboard
3. Admin reviews and approves/rejects from `/admin` dashboard
4. Approved users receive access immediately

### Admin Functions
- User approval and management
- Password resets
- Admin privilege management
- Database statistics and upgrades
- System monitoring

## Troubleshooting

### Common Issues

**Database Errors**
```bash
# Check upgrade status
npm run db:check

# If upgrade needed
npm run db:upgrade

# If migrations fail
npx prisma migrate reset
npm run db:init
```

**Authentication Issues**
- Verify JWT_SECRET is set in environment
- Check cookie settings for your domain
- Ensure Turnstile keys are correct for production

**OpenAI Integration**
- Verify API key is valid and has credits
- Check API key permissions
- Review model and token settings

**Build Issues**
```bash
# Try different build modes
npm run build:strict  # Full error output
npm run build:quiet   # Minimal output
```

### Getting Help
- Check the admin dashboard for system status
- Review browser console for client-side errors
- Check server logs for API errors
- Verify environment variable configuration

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and component documentation
- **[DATABASE.md](DATABASE.md)** - Database schema, migrations, and upgrade system
- **[DATABASE_UPGRADES.md](DATABASE_UPGRADES.md)** - Comprehensive database upgrade procedures and troubleshooting
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines for Claude Code integration
- **[LICENSE.md](LICENSE.md)** - MIT License with attribution requirements

## Technology Stack

- **Frontend**: React 18, Next.js 14, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite with automated upgrade system
- **AI**: OpenAI GPT-4o integration
- **Security**: JWT authentication, bcrypt hashing, Cloudflare Turnstile
- **Development**: TypeScript, ESLint, Puppeteer testing

## License

This project is licensed under the MIT License with Attribution - see [LICENSE.md](LICENSE.md) for details.

**Attribution Requirements:**
- Include original copyright notice
- Provide attribution to Now Wave Radio (https://nowwave.radio)
- Reference original repository (https://github.com/slyderc/roboprep)

---

**Built with ❤️ for radio DJs by radio DJs** 📻
