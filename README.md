# 🗨️ 오빌톡 (ObilTalk)

사진 공유 특화 그룹 채팅 PWA 앱입니다.

## 📋 주요 기능

- ✅ 이메일/비밀번호 회원가입 및 로그인
- ✅ 관리자 승인 시스템
- ✅ 실시간 그룹 채팅
- ✅ 사진 + 메모 전송 (이미지 자동 압축)
- ✅ 관리자 패널 (사용자 승인/삭제/관리자 지정)
- ✅ 30일 경과 데이터 자동 삭제
- ✅ 모바일 최적화 UI

## 🛠 기술 스택

- **Frontend:** React + Vite
- **Backend:** Firebase (Firestore, Storage, Authentication, Functions)
- **Hosting:** Vercel
- **Image Compression:** browser-image-compression

## 🚀 배포 방법

### 1. Vercel 배포
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 연결
3. 자동으로 배포됨

### 2. Firebase Functions 배포
```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 연결
firebase use --add

# Functions 배포
firebase deploy --only functions
```

### 3. Firestore 보안 규칙 배포
```bash
firebase deploy --only firestore:rules
```

### 4. Storage 보안 규칙 배포
```bash
firebase deploy --only storage
```

## 👤 최초 관리자 설정

앱 배포 후 첫 관리자를 설정하려면:

1. 회원가입 후 Firebase Console → Firestore Database 접속
2. `users` 컬렉션에서 관리자로 지정할 사용자 문서 선택
3. 필드 수정:
   - `approved`: true
   - `isAdmin`: true (필드 추가)

## 📱 PWA 설치

모바일 브라우저에서 앱 접속 후 "홈 화면에 추가" 선택

## 🔒 보안

- Firestore 보안 규칙으로 승인된 사용자만 접근 가능
- Storage 업로드 크기 제한 (5MB)
- 관리자만 사용자 관리 가능

## 📞 문의

문제가 발생하면 Firebase Console의 로그를 확인하세요.

## 📁 프로젝트 구조

```
obiltalk/
├── public/
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Chat.jsx
│   │   ├── AdminPanel.jsx
│   │   └── MessageItem.jsx
│   ├── firebase.js
│   ├── App.jsx
│   └── main.jsx
├── functions/
│   ├── package.json
│   └── index.js
├── index.html
├── package.json
├── vite.config.js
├── firebase.json
├── firestore.rules
├── storage.rules
└── README.md
```
