import React from 'react';
import { Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'system' | 'data_query' | 'ui_explanation';
  mentions?: string[];
  metadata?: any;
}

interface ChatMessageProps {
  message: Message;
  styles?: any;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, styles = {} }) => {
  const formatContent = (content: string) => {
    // Format mentions
    let formattedContent = content.replace(
      /@(\w+)/g, 
      `<span class="${styles.mention || 'mention'}">@$1</span>`
    );

    // Format bold text
    formattedContent = formattedContent.replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    );

    // Format bullet points
    formattedContent = formattedContent.replace(
      /^([🔴🟡🟢📊⭐⏱️🎯📧🎁📊🗓️👥🏆💰📊🤝])\s\*\*(.*?)\*\*:/gm,
      '$1 <strong>$2</strong>:'
    );

    return formattedContent;
  };

  const getMessageIcon = () => {
    if (message.sender === 'bot') {
      if (message.type === 'error') {
        return <AlertCircle className={`${styles.messageAvatar} ${styles.error}`} size={24} />;
      }
      return <Bot className={styles.messageAvatar} size={24} />;
    }
    return <User className={`${styles.messageAvatar} ${styles.user}`} size={24} />;
  };

  const getMessageClass = () => {
    let className = `${styles.message} ${styles[message.sender + 'Message']}`;
    if (message.type === 'error') className += ` ${styles.error}`;
    if (message.type === 'system') className += ` ${styles.system}`;
    return className;
  };

  return (
    <div className={getMessageClass()}>
      {getMessageIcon()}
      <div className={styles.messageContent}>
        <div 
          className={styles.messageText}
          dangerouslySetInnerHTML={{ 
            __html: formatContent(message.content) 
          }}
        />
        <div className={styles.messageTimestamp}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;