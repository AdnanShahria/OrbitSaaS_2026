import { ChatProvider } from './ChatContext';
import { ChatToggleButton } from './components/ChatToggleButton';
import { ChatWelcomePopup } from './components/ChatWelcomePopup';
import { ChatPanel } from './components/ChatPanel';

export function Chatbot() {
  return (
    <ChatProvider>
      <ChatPanel />
      <ChatWelcomePopup />
      <ChatToggleButton />
    </ChatProvider>
  );
}
