import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import styles from './ChatButton.module.css';

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnreadMessages?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ 
  isOpen, 
  onClick, 
  hasUnreadMessages = false 
}) => {
  return (
    <button 
      className={`${styles.chatButton} ${isOpen ? styles.open : ''} ${hasUnreadMessages ? styles.hasUnread : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <div className={styles.chatButtonIcon}>
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </div>
      
      {hasUnreadMessages && !isOpen && (
        <div className={styles.unreadIndicator}>
          <span className={styles.unreadDot}></span>
        </div>
      )}
      
      {!isOpen && (
        <div className={styles.chatButtonTooltip}>
          Ask me about your engagement data!
        </div>
      )}
    </button>
  );
};

export default ChatButton;