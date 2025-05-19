import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { initializeDatabase } from '../lib/db';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Robo Show Prep',
  description: 'AI-powered show prep for radio DJs',
};

// Initialize the database on server-side
initializeDatabase().catch(error => {
  console.error('Database initialization failed in layout:', error);
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}