import React, { useState } from 'react';
import CreatePage from './CreatePage';
import LiveStudio from './LiveStudio';

export default function App() {
  const [started, setStarted] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');

  function handleCreate(prompt) {
    setInitialPrompt(prompt);
    setStarted(true);
  }

  if (!started) {
    return <CreatePage onCreate={handleCreate} />;
  }

  return <LiveStudio initialPrompt={initialPrompt} />;
}
