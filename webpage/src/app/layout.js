import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { PromptProvider } from '../context/PromptContext';
import { SettingsProvider } from '../context/SettingsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Robo Show Prep',
  description: 'AI-powered show prep for radio DJs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SettingsProvider>
          <PromptProvider>
            {children}
          </PromptProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}