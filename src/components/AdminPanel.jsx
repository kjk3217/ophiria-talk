import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      alert('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('이 사용자를 승인하시겠습니까?')) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        approved: true
      });
      alert('사용자가 승인되었습니다.');
      loadUsers();
    } catch (error) {
      console.error('승인 오류:', error);
      alert('승인에 실패했습니다.');
    }
  };

  const handleDelete = async (userId, displayName) => {
    if (!window.confirm(`${displayName} 사용자를 삭제하시겠습니까?\n이 사용자의 모든 메시지도 함께 삭제됩니다.`)) return;

    try {
      // Firestore에서 사용자 문서 삭제
      await deleteDoc(doc(db, 'users', userId));

      // 해당 사용자의 모든 메시지 삭제
      const messagesQuery = query(collection(db, 'messages'), where('senderUid', '==', userId));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      alert('사용자가 삭제되었습니다.');
      loadUsers();
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleToggleAdmin = async (userId, currentAdminStatus, displayName) => {
    const action = currentAdminStatus ? '해제' : '부여';
    if (!window.confirm(`${displayName}님에게 관리자 권한을 ${action}하시겠습니까?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentAdminStatus
      });
      alert(`관리자 권한이 ${action}되었습니다.`);
      loadUsers();
    } catch (error) {
      console.error('권한 변경 오류:', error);
      alert('권한 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        사용자 목록을 불러오는 중...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👥 사용자 관리</h2>
      
      {users.length === 0 ? (
        <div style={styles.empty}>등록된 사용자가 없습니다.</div>
      ) : (
        <div style={styles.userList}>
          {users.map(user => (
            <div key={user.id} style={styles.userCard}>
              <div style={styles.userInfo}>
                <div style={styles.userName}>
                  {user.displayName}
                  {user.isAdmin && <span style={styles.adminBadge}>관리자</span>}
                </div>
                <div style={styles.userEmail}>{user.email}</div>
                <div style={styles.userStatus}>
                  상태: {user.approved ? 
                    <span style={styles.approved}>✓ 승인됨</span> : 
                    <span style={styles.pending}>⏳ 승인 대기</span>
                  }
                </div>
              </div>
              
              <div style={styles.actions}>
                {!user.approved && (
                  <button
                    onClick={() => handleApprove(user.id)}
                    style={styles.approveButton}
                  >
                    승인
                  </button>
                )}
                <button
                  onClick={() => handleToggleAdmin(user.id, user.isAdmin, user.displayName)}
                  style={styles.adminButton}
                >
                  {user.isAdmin ? '관리자 해제' : '관리자 지정'}
                </button>
                <button
                  onClick={() => handleDelete(user.id, user.displayName)}
                  style={styles.deleteButton}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: '16px',
    color: '#666'
  },
  title: {
    fontSize: '25px',
    marginBottom: '20px',
    color: '#333'
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
    fontSize: '16px'
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  userInfo: {
    marginBottom: '15px'
  },
  userName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  adminBadge: {
    fontSize: '12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '12px'
  },
  userEmail: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  userStatus: {
    fontSize: '14px',
    color: '#666'
  },
  approved: {
    color: '#27ae60',
    fontWeight: 'bold'
  },
  pending: {
    color: '#f39c12',
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  approveButton: {
    padding: '8px 15px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '17px',
    fontWeight: 'bold'
  },
  adminButton: {
    padding: '8px 15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '17px'
  },
  deleteButton: {
    padding: '8px 15px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default AdminPanel;
