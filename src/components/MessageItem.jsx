import React from 'react';

function MessageItem({ message, isOwn }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      ...styles.messageWrapper,
      justifyContent: isOwn ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        ...styles.messageContainer,
        alignItems: isOwn ? 'flex-end' : 'flex-start'
      }}>
        {!isOwn && (
          <div style={styles.senderName}>{message.senderName}</div>
        )}
        
        <div style={{
          ...styles.messageBubble,
          backgroundColor: isOwn ? '#4A90E2' : '#fff',
          color: isOwn ? '#fff' : '#333',
          borderRadius: isOwn ? '15px 15px 0 15px' : '15px 15px 15px 0'
        }}>
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="첨부 이미지"
              style={styles.messageImage}
              loading="lazy"
            />
          )}
          {message.memo && (
            <div style={styles.messageText}>
              {message.memo}
            </div>
          )}
        </div>
        
        <div style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

const styles = {
  messageWrapper: {
    display: 'flex',
    marginBottom: '15px'
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '70%'
  },
  senderName: {
    fontSize: '25px',
    color: '#666',
    marginBottom: '5px',
    marginLeft: '5px',
    fontWeight: 'bold'
  },
  messageBubble: {
    padding: '15px 18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    wordWrap: 'break-word'
  },
  messageImage: {
    maxWidth: '100%',
    borderRadius: '10px',
    marginBottom: '8px',
    display: 'block'
  },
  messageText: {
    fontSize: '27px',
    lineHeight: '1.4'
  },
  timestamp: {
    fontSize: '23px',
    color: '#999',
    marginTop: '3px',
    marginLeft: '5px',
    marginRight: '5px'
  }
};

export default MessageItem;
