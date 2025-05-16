'use client';

import React from 'react';
import { PromptProvider } from '../context/PromptContext';
import { SettingsProvider } from '../context/SettingsContext';
import { HomePage } from '../components/HomePage';

export default function Home() {
  return (
    <SettingsProvider>
      <PromptProvider>
        <HomePage />
      </PromptProvider>
    </SettingsProvider>
  );
}