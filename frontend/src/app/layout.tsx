import './globals.css';
import React from 'react';
import ChatWidget from '@/components/chat/ChatWidget';
import LanguageProvider from '@/components/i18n/LanguageProvider';

export const metadata = {
  title: "UdyamAI",
  description: "AI-Powered Business Feasibility and Scheme Advisor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
          <ChatWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
