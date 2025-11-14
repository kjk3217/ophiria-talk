const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// 매일 새벽 3시에 실행되는 함수 (한국 시간 기준)
exports.deleteOldMessages = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 3 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('30일 경과 메시지 삭제 작업 시작');

    try {
      // 30일 이전 날짜 계산
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log(`삭제 기준 날짜: ${thirtyDaysAgo.toISOString()}`);

      // Firestore에서 30일 이전 메시지 찾기
      const messagesSnapshot = await db
        .collection('messages')
        .where('timestamp', '<', thirtyDaysAgo)
        .get();

      if (messagesSnapshot.empty) {
        console.log('삭제할 메시지가 없습니다.');
        return null;
      }

      console.log(`${messagesSnapshot.size}개의 메시지를 삭제합니다.`);

      // 배치 삭제 준비
      const batch = db.batch();
      const storageDeletePromises = [];

      messagesSnapshot.forEach((doc) => {
        const data = doc.data();

        // Firestore 문서 삭제
        batch.delete(doc.ref);

        // Storage 이미지 삭제
        if (data.imageUrl && data.storagePath) {
          const fileRef = storage.bucket().file(data.storagePath);
          storageDeletePromises.push(
            fileRef.delete().catch((error) => {
              console.error(`파일 삭제 실패 (${data.storagePath}):`, error.message);
            })
          );
        }
      });

      // Firestore 문서 일괄 삭제
      await batch.commit();
      console.log('Firestore 문서 삭제 완료');

      // Storage 파일 삭제
      await Promise.all(storageDeletePromises);
      console.log('Storage 파일 삭제 완료');

      console.log(`총 ${messagesSnapshot.size}개의 메시지 삭제 완료`);
      return null;

    } catch (error) {
      console.error('삭제 작업 중 오류 발생:', error);
      throw error;
    }
  });
