import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import MessageItem from './MessageItem';
import AdminPanel from './AdminPanel';

function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setIsAdmin(userDoc.data().isAdmin === true);
      }
    };
    checkAdmin();
  }, [user.uid]);

  // 메시지 실시간 로드
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 이미지 선택 처리
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택해주세요.');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 이미지 압축
  const compressImage = async (imageFile) => {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);
      console.log('원본 크기:', (imageFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('압축 후 크기:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      return compressedFile;
    } catch (error) {
      console.error('이미지 압축 오류:', error);
      throw error;
    }
  };

  // 메시지 전송
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // 텍스트만 있는 경우
    if (!selectedImage && messageText.trim()) {
      try {
        await addDoc(collection(db, 'messages'), {
          senderUid: user.uid,
          senderName: user.displayName || '익명',
          memo: messageText.trim(),
          imageUrl: null,
          timestamp: serverTimestamp()
        });
        setMessageText('');
      } catch (error) {
        console.error('메시지 전송 오류:', error);
        alert('메시지 전송에 실패했습니다.');
      }
      return;
    }

    // 사진이 있는 경우 메모 필수
    if (selectedImage && !messageText.trim()) {
      alert('사진에 대한 메모를 작성해주세요.');
      return;
    }

    // 사진 + 메모 전송
    if (selectedImage && messageText.trim()) {
      setUploading(true);
      try {
        // 이미지 압축
        const compressedImage = await compressImage(selectedImage);

        // Firebase Storage에 업로드
        const timestamp = Date.now();
        const fileName = `images/${user.uid}_${timestamp}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, compressedImage);
        const imageUrl = await getDownloadURL(storageRef);

        // Firestore에 메시지 저장
        await addDoc(collection(db, 'messages'), {
          senderUid: user.uid,
          senderName: user.displayName || '익명',
          memo: messageText.trim(),
          imageUrl: imageUrl,
          storagePath: fileName,
          timestamp: serverTimestamp()
        });

        // 초기화
        setMessageText('');
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('전송 오류:', error);
        alert('전송에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      signOut(auth);
    }
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>🗨️ 오빌톡</h1>
        <div style={styles.headerButtons}>
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              style={styles.adminButton}
            >
              {showAdminPanel ? '채팅' : '관리자'}
            </button>
          )}
          <button onClick={handleLogout} style={styles.logoutButton}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 관리자 패널 또는 채팅 화면 */}
      {showAdminPanel ? (
        <AdminPanel />
      ) : (
        <>
          {/* 메시지 목록 */}
          <div style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <p>아직 메시지가 없습니다.</p>
                <p style={{ fontSize: '27px', color: '#999' }}>첫 메시지를 보내보세요! 📸</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderUid === user.uid}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 이미지 미리보기 */}
          {imagePreview && (
            <div style={styles.imagePreview}>
              <img src={imagePreview} alt="미리보기" style={styles.previewImage} />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={styles.removeImageButton}
              >
                ✕
              </button>
            </div>
          )}

          {/* 입력 영역 */}
          <form onSubmit={handleSendMessage} style={styles.inputContainer}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={styles.imageButton}
              disabled={uploading}
            >
              📷
            </button>
            <input
              type="text"
              placeholder={selectedImage ? "사진에 대한 메모를 작성하세요" : "메시지를 입력하세요"}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={styles.textInput}
              disabled={uploading}
            />
            <button
              type="submit"
              style={{
                ...styles.sendButton,
                opacity: uploading ? 0.5 : 1
              }}
              disabled={uploading}
            >
              {uploading ? '전송중...' : '전송'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#fff'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#4A90E2',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  headerTitle: {
    fontSize: '32px',
    fontWeight: 'bold'
  },
  headerButtons: {
    display: 'flex',
    gap: '10px'
  },
  adminButton: {
    padding: '12px 20px',
    backgroundColor: '#fff',
    color: '#4A90E2',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '27px',
    fontWeight: 'bold'
  },
  logoutButton: {
    padding: '12px 20px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '27px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    fontSize: '27px'
  },
  imagePreview: {
    position: 'relative',
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    borderTop: '1px solid #ddd'
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '8px'
  },
  removeImageButton: {
    position: 'absolute',
    top: '15px',
    right: '25px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    fontSize: '27px'
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    borderTop: '1px solid #ddd',
    backgroundColor: 'white'
  },
  imageButton: {
    fontSize: '35px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px'
  },
  textInput: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '22px',
    border: '2px solid #ddd',
    borderRadius: '20px',
    outline: 'none'
  },
  sendButton: {
    padding: '12px 25px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '27px',
    fontWeight: 'bold'
  }
};

export default Chat;
