import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        // 회원가입
        if (!displayName.trim()) {
          setError('이름을 입력해주세요.');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 프로필 업데이트
        await updateProfile(user, { displayName: displayName.trim() });

        // Firestore에 사용자 정보 저장 (관리자 승인 대기 상태)
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName.trim(),
          approved: false, // 관리자 승인 필요
          createdAt: new Date()
        });

        alert('가입이 완료되었습니다. 관리자 승인을 기다려주세요.');
      } else {
        // 로그인
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 승인 여부 확인
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && !userDoc.data().approved) {
          await auth.signOut();
          setError('관리자의 승인을 기다리고 있습니다.');
          return;
        }
      }
    } catch (error) {
      console.error('인증 오류:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (error.code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else if (error.code === 'auth/weak-password') {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>🗨️ 오빌톡</h1>
        <p style={styles.subtitle}>사진 공유 그룹 채팅</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          {isSignUp && (
            <input
              type="text"
              placeholder="이름 (채팅에 표시될 이름)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={styles.input}
              required
            />
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button}>
            {isSignUp ? '회원가입' : '로그인'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={styles.toggleLink}
          >
            {isSignUp ? ' 로그인' : ' 회원가입'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  loginBox: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '40px 30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  title: {
    fontSize: '40px',
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    fontSize: '27px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  input: {
    padding: '18px',
    fontSize: '27px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none'
  },
  button: {
    padding: '18px',
    fontSize: '27px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  error: {
    color: '#e74c3c',
    fontSize: '27px',
    textAlign: 'center'
  },
  toggle: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '27px',
    color: '#666'
  },
  toggleLink: {
    color: '#4A90E2',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default Login;
