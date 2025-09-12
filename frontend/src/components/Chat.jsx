import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import './Chat.css';

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar mudanças no tamanho da tela
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>💬 Chat</h2>
        <p>Converse com seus matches</p>
      </div>

      <div className="chat-content">
        {isMobile ? (
          // Layout mobile: mostrar apenas uma view por vez
          selectedChat ? (
            <ChatWindow 
              chat={selectedChat} 
              onClose={handleCloseChat}
            />
          ) : (
            <ChatList 
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChat?.chat_id}
            />
          )
        ) : (
          // Layout desktop: mostrar ambas as views lado a lado
          <>
            <div className="chat-sidebar">
              <ChatList 
                onChatSelect={handleChatSelect}
                selectedChatId={selectedChat?.chat_id}
              />
            </div>
            <div className="chat-main">
              <ChatWindow 
                chat={selectedChat} 
                onClose={handleCloseChat}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
