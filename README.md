<!-- This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. -->



# Code Collaboration Room 🚀

A real-time, turn-based collaborative coding platform built with Next.js, Node.js, and Socket.IO. Perfect for pair programming, code reviews, and collaborative development sessions.

## ✨ Features

- **Turn-Based System**: 10-minute sessions with 2-minute turns per developer
- **Real-time Synchronization**: Instant code updates and live cursor tracking
- **Multi-language Support**: JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust
- **Professional Code Editor**: Monaco Editor (VS Code engine) with syntax highlighting
- **Session Management**: Automatic timer controls and turn switching
- **Disconnection Handling**: 30-second reconnection window with graceful fallbacks
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Room Codes**: Easy 6-character room codes for quick joining

## 🏗️ Architecture

### Backend (Node.js + Socket.IO)
- **Express Server**: RESTful API endpoints
- **Socket.IO**: Real-time WebSocket communication
- **Room Management**: In-memory room state with cleanup
- **Timer System**: Server-side session and turn timers
- **TypeScript**: Full type safety

### Frontend (Next.js + React)
- **Next.js 15**: App Router with Server Components
- **Zustand**: Lightweight state management
- **Monaco Editor**: Professional code editing experience
- **Tailwind CSS**: Modern, responsive styling
- **Socket.IO Client**: Real-time connectivity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ahtisham313/code-collab-room.git
cd code-collaboration-room
```

2. **Backend Setup**
```bash
cd backend
npm install
npm run build
npm run dev
```

3. **Frontend Setup** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Open your browser**
```
Frontend: http://localhost:3000
Backend API: http://localhost:5000
```

## 📁 Project Structure

```
code-collaboration-room/
├── backend/                    # Node.js + Socket.IO Server
│   ├── src/
│   │   ├── types/             # TypeScript type definitions
│   │   ├── services/          # Business logic (RoomManager)
│   │   └── server.ts          # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # Next.js React Application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # Reusable React components
│   │   ├── lib/               # Utilities and configurations
│   │   └── types/             # TypeScript types
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.js
|   |___tailwind.config.ts
├── .gitignore               
└── README.md
```

## 🎯 Usage

### Creating a Room
1. Enter your name on the homepage
2. Click "Create New Room"
3. Share the 6-character room code with your partner
4. Start coding when both developers join!

### Joining a Room
1. Enter your name and the room code
2. Click "Join Room"
3.  the session will start automatically

### During a Session
- **Active Developer**: Full editing rights with 2-minute turns
- **Inactive Developer**: Read-only mode with live updates
- **Automatic Turn Switching**: When timer expires
- **Manual Turn Switch**: Active developer can pass turn early
- **Real-time Sync**: All changes appear instantly
- **Language Support**: Switch between 8 programming languages

## ⚙️ Configuration

<!-- ### Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
``` -->

### Production Deployment

1. **Backend**: Deployed on Render
2. **Frontend**: Deployed to Vercel 

<!-- ## 🔧 Development

### Available Scripts

**Backend**
```bash
npm run dev        # Start development server
npm run build      # Build TypeScript
npm start          # Start production server
```

**Frontend**
```bash
npm run dev        # Start Next.js development
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
``` -->

### Adding New Features

1. **New Socket Events**: Add to `backend/src/server.ts` and `frontend/src/lib/socket.ts`
2. **UI Components**: Create in `frontend/src/components/`
3. **State Management**: Update Zustand store in `frontend/src/lib/store.ts`
4. **Types**: Add to respective `types/` directories

<!-- ## 🚢 Deployment

### Backend Deployment (Heroku)

1. Create a new Heroku app
2. Connect your GitHub repository
3. Set environment variables:
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   ```
4. Deploy from `main` branch

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build settings:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
3. Set environment variables:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.herokuapp.com
   ```
4. Deploy automatically on push -->

## 🛠️ Tech Stack

### Backend Technologies
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Socket.IO**: Real-time communication
- **TypeScript**: Type safety
- **CORS**: Cross-origin resource sharing

### Frontend Technologies
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with latest features
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Monaco Editor**: Code editor (VS Code engine)
- **Zustand**: State management
- **Socket.IO Client**: Real-time connectivity
- **Lucide React**: Beautiful icons

## 🔒 Security Features

- **Input Validation**: All user inputs are sanitized
- **Rate Limiting**: Prevents spam and abuse
- **CORS Protection**: Configured for specific origins
- **Session Cleanup**: Automatic room cleanup prevents memory leaks
- **Error Handling**: Graceful error recovery

## 🐛 Troubleshooting

### Common Issues

**Connection Issues**
- Check if backend server is running on port 5000
- Verify CORS settings match your frontend URL
- Ensure WebSocket connections are allowed

**Room Not Found**
- Room codes expire after 13 minutes of inactivity
- Check for typos in the 6-character code
- Ensure backend server is accessible

**Timer Issues**
- Timers are server-side controlled
- Browser tab switching may pause client timers
- Refresh page if timers appear stuck

<!-- ### Debug Mode

Enable debug logging:

**Backend**
```bash
DEBUG=socket.io:* npm run dev
```

**Frontend**
```javascript
localStorage.setItem('debug', 'socket.io-client:*'); -->
<!-- ``` -->

## 📄 API Documentation

### REST Endpoints

```
<!-- GET /api/health              # Server health check -->
<!-- GET /api/stats              # Room statistics -->
POST /api/rooms             # Create new room
GET /api/rooms/:roomId      # Get room info
```

### Socket Events

**Client to Server**
- `create-room` - Create a new collaboration room
- `join-room` - Join existing room
- `code-change` - Update code content
- `switch-turn` - Manually switch turns
- `change-language` - Update programming language

**Server to Client**
- `room-joined` - Room join confirmation
- `developer-joined` - Another developer joined
- `code-updated` - Code content changed
- `turn-switched` - Active developer changed
- `session-started` - Collaboration session began
- `session-ended` - Session completed
- `timer-update` - Timer tick updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor Team**: For the amazing VS Code editor
- **Socket.IO Team**: For real-time communication magic
- **Next.js Team**: For the incredible React framework
- **Tailwind CSS**: For making styling enjoyable
- **Vercel**: For seamless deployment experience

## 📞 Support

If you encounter any issues or have questions:

<!-- 1. Check the [Troubleshooting](#🐛-troubleshooting) section -->
<!-- 2. Search existing [GitHub Issues](https://github.com/yourusername/code-collaboration-room/issues) -->
1. Create a new issue with detailed information
2. Contact: ahtishamm2030@gmail.com

---

**Built with ❤️ for developers, by developer**

*Happy Collaborative Coding! 🎉*