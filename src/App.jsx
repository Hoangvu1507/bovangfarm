import React, { useState, useEffect } from 'react';
import {
  Check, Trash2, LogOut, RefreshCw
} from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc,
  onSnapshot, deleteDoc, getDocs, addDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC1B-LdOHNhXsY71_238isWyPrfH7MsQlo",
  authDomain: "bovangfarm123.firebaseapp.com",
  projectId: "bovangfarm123",
  storageBucket: "bovangfarm123.firebasestorage.app",
  messagingSenderId: "66910533772",
  appId: "1:66910533772:web:df680698964745dc2923a9",
  measurementId: "G-1XKD6KCVSN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export default function App() {
  const [authMode, setAuthMode] = useState(() => {
    return localStorage.getItem('farm_logged_user') ? null : 'login';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('farm_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regForm, setRegForm] = useState({
    fullName: '',
    cccd: '',
    password: '',
    dob: '',
    phone: '',
    address: ''
  });

  const [members, setMembers] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [shopPrices, setShopPrices] = useState({
    milkCow: { name: 'Bò Sữa Cao Sản', price: 300000, desc: 'Cho sữa tươi định kỳ hàng ngày.' },
    goldCow: { name: 'Bò Vàng Giống', price: 500000, desc: 'Sinh sản bò con, gia tăng tài sản.' },
    grass: { name: 'Gói 20 Bó Cỏ', price: 50000, desc: 'Thức ăn dinh dưỡng cho đàn bò.' },
    milkSellPrice: 25000
  });
  const [editingPrices, setEditingPrices] = useState({ ...shopPrices });

  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('farm');
  const [inventory, setInventory] = useState({
    grass: 0,
    milk: 0,
    medicine: 0
  });
  const [cows, setCows] = useState([]);

  // State nạp tiền
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(list);
    });

    const unsubDeposits = onSnapshot(collection(db, 'deposits'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingDeposits(list);
    });

    const unsubPrices = onSnapshot(doc(db, 'settings', 'prices'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShopPrices(data);
        setEditingPrices(data);
      } else {
        const initialPrices = {
          milkCow: { name: 'Bò Sữa Cao Sản', price: 300000, desc: 'Cho sữa tươi định kỳ hàng ngày.' },
          goldCow: { name: 'Bò Vàng Giống', price: 500000, desc: 'Sinh sản bò con, gia tăng tài sản.' },
          grass: { name: 'Gói 20 Bó Cỏ', price: 50000, desc: 'Thức ăn dinh dưỡng cho đàn bò.' },
          milkSellPrice: 25000
        };
        setDoc(doc(db, 'settings', 'prices'), initialPrices);
      }
    });

    return () => {
      unsubMembers();
      unsubDeposits();
      unsubPrices();
    };
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      const me = members.find(m => m.cccd === currentUser.cccd || m.id === currentUser.cccd);
      if (me) {
        setBalance(me.balance || 0);
      }
    }
  }, [members, currentUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername === '001098000393' && loginPassword === 'Phuongthao97@@') {
      const adminData = { role: 'admin', fullName: 'Quản Trị Viên Hệ Thống' };
      setCurrentUser(adminData);
      localStorage.setItem('farm_logged_user', JSON.stringify(adminData));
      setAuthMode(null);
      return;
    }

    const found = members.find(m => (m.cccd === loginUsername || m.id === loginUsername) && m.password === loginPassword);
    if (found) {
      if (found.status !== 'approved') {
        alert("Tài khoản của bạn đang chờ Quản Trị Viên phê duyệt. Vui lòng quay lại sau!");
        return;
      }
      const userData = { role: 'user', ...found };
      setCurrentUser(userData);
      localStorage.setItem('farm_logged_user', JSON.stringify(userData));
      setBalance(found.balance || 0);
      setAuthMode(null);
    } else {
      alert("Sai số CCCD hoặc mật khẩu, hoặc tài khoản chưa được duyệt!");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanCccd = regForm.cccd.trim();
    if (!cleanCccd || !regForm.fullName || !regForm.password) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    if (cleanCccd === '001098000393') {
      alert("Số CCCD này trùng với tài khoản quản trị hệ thống!");
      return;
    }

    try {
      const docRef = doc(db, 'members', cleanCccd);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        alert(`Số CCCD (${cleanCccd}) này đã tồn tại trên Cloud!`);
        return;
      }

      const newMember = { ...regForm, cccd: cleanCccd, balance: 0, status: 'pending' };
      await setDoc(docRef, newMember);
      alert("Đăng ký thành công! Hồ sơ đã được đồng bộ lên Cloud để Admin phê duyệt.");
      setAuthMode('login');
      setRegForm({ fullName: '', cccd: '', password: '', dob: '', phone: '', address: '' });
    } catch (error) {
      console.error(error);
      alert("Đăng ký thất bại, vui lòng kiểm tra kết nối mạng.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farm_logged_user');
    setCurrentUser(null);
    setAuthMode('login');
  };

  const clearAllDatabase = async () => {
    if (!window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ dữ liệu trên Cloud không?")) return;
    try {
      const memberSnapshot = await getDocs(collection(db, 'members'));
      const deleteMemberPromises = memberSnapshot.docs.map(d => deleteDoc(doc(db, 'members', d.id)));

      const depositSnapshot = await getDocs(collection(db, 'deposits'));
      const deleteDepositPromises = depositSnapshot.docs.map(d => deleteDoc(doc(db, 'deposits', d.id)));

      await Promise.all([...deleteMemberPromises, ...deleteDepositPromises]);
      localStorage.clear();
      setCurrentUser(null);
      setAuthMode('login');
      alert("Đã xóa sạch toàn bộ dữ liệu trên Cloud thành công!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi xóa dữ liệu.");
    }
  };

  const feedCow = (cowId) => {
    if (inventory.grass <= 0) {
      alert("Bạn đã hết cỏ trong kho! Vui lòng ghé Cửa hàng để mua thêm cỏ.");
      return;
    }
    setInventory(prev => ({ ...prev, grass: prev.grass - 1 }));
    setCows(prev => prev.map(c => c.id === cowId ? { ...c, hunger: Math.min(100, c.hunger + 25) } : c));
    alert("Đã cho bò ăn cỏ!");
  };

  const harvestMilk = (cowId) => {
    const cow = cows.find(c => c.id === cowId);
    if (cow.type !== 'milk') {
      alert("Chỉ có Bò Sữa Cao Sản mới có thể cho sữa!");
      return;
    }
    if (cow.hunger < 40) {
      alert("Bò đang đói, hãy cho bò ăn cỏ trước!");
      return;
    }
    setInventory(prev => ({ ...prev, milk: prev.milk + 5 }));
    setCows(prev => prev.map(c => c.id === cowId ? { ...c, hunger: Math.max(10, c.hunger - 30) } : c));
    alert("Thu hoạch thành công +5 Lít Sữa tươi vào kho!");
  };

  const buyItem = async (itemKey) => {
    let cost = 0;
    if (itemKey === 'milkCow') cost = shopPrices.milkCow.price;
    if (itemKey === 'goldCow') cost = shopPrices.goldCow.price;
    if (itemKey === 'grass') cost = shopPrices.grass.price;

    if (balance < cost) {
      alert("Số dư tài khoản không đủ! Vui lòng nạp thêm tiền.");
      return;
    }

    const newBalance = balance - cost;
    setBalance(newBalance);

    try {
      await updateDoc(doc(db, 'members', currentUser.cccd), { balance: newBalance });

      if (itemKey === 'grass') {
        setInventory(prev => ({ ...prev, grass: prev.grass + 20 }));
        alert("Mua thành công +20 Bó Cỏ!");
      } else if (itemKey === 'milkCow') {
        const newCow = { id: Date.now(), name: `Bò Sữa Cao Sản #${cows.length + 1}`, tag: `BV-100${cows.length + 1}`, type: 'milk', hunger: 100, owner: currentUser.cccd };
        setCows(prev => [...prev, newCow]);
        alert("Mua thành công Bò Sữa Cao Sản!");
      } else if (itemKey === 'goldCow') {
        const newCow = { id: Date.now(), name: `Bò Vàng Giống #${cows.length + 1}`, tag: `BV-200${cows.length + 1}`, type: 'gold', hunger: 100, owner: currentUser.cccd };
        setCows(prev => [...prev, newCow]);
        alert("Mua thành công Bò Vàng Giống!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sellMilk = async () => {
    if (inventory.milk <= 0) {
      alert("Không có sữa để bán!");
      return;
    }
    const litersToSell = inventory.milk;
    const earnedMoney = litersToSell * shopPrices.milkSellPrice;
    const newBalance = balance + earnedMoney;

    setInventory(prev => ({ ...prev, milk: 0 }));
    setBalance(newBalance);

    try {
      await updateDoc(doc(db, 'members', currentUser.cccd), { balance: newBalance });
      alert(`Đã bán ${litersToSell} lít sữa thu về +${earnedMoney.toLocaleString()} đ!`);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== HÀM NẠP TIỀN =====
  const requestDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 10000) {
      alert("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }

    try {
      await addDoc(collection(db, 'deposits'), {
        cccd: currentUser.cccd,
        amount: amount,
        time: new Date().toLocaleString('vi-VN'),
        status: 'pending',
        fullName: currentUser.fullName
      });

      alert("Đã gửi yêu cầu nạp tiền thành công!\nVui lòng chuyển khoản theo QR hoặc thông tin bên dưới và chờ Admin xác nhận.");
      setDepositAmount('');
      setShowDepositModal(false);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const approveMember = async (memberId) => {
    try {
      await updateDoc(doc(db, 'members', memberId), { status: 'approved' });
      alert(`Đã phê duyệt thành viên ID: ${memberId}`);
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi phê duyệt thành viên.");
    }
  };

  const rejectMember = async (memberId, cccdDisplay) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản CCCD: ${cccdDisplay || memberId} không?`)) return;

    try {
      await deleteDoc(doc(db, 'members', memberId));

      const depositsSnap = await getDocs(collection(db, 'deposits'));
      const deleteDepositPromises = depositsSnap.docs
        .filter(d => d.data().cccd === (cccdDisplay || memberId))
        .map(d => deleteDoc(doc(db, 'deposits', d.id)));

      await Promise.all(deleteDepositPromises);

      alert(`Đã xóa thành viên: ${cccdDisplay || memberId}`);
    } catch (error) {
      console.error("Lỗi khi xóa thành viên:", error);
      alert("Có lỗi khi xóa thành viên.");
    }
  };

  const approveDeposit = async (depositId, cccd, amount) => {
    try {
      await updateDoc(doc(db, 'deposits', depositId), { status: 'approved' });
      const targetMember = members.find(m => m.cccd === cccd || m.id === cccd);
      if (targetMember) {
        const newBalance = (targetMember.balance || 0) + amount;
        await updateDoc(doc(db, 'members', targetMember.id), { balance: newBalance });
      }
      alert(`Đã duyệt nạp ${amount.toLocaleString()} đ cho CCCD: ${cccd}`);
    } catch (error) {
      console.error(error);
    }
  };

  const saveNewPrices = async () => {
    try {
      await setDoc(doc(db, 'settings', 'prices'), editingPrices);
      setShopPrices(editingPrices);
      alert("Đã cập nhật bảng giá mới trên Cloud!");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi cập nhật bảng giá.");
    }
  };

  const manualReloadData = () => {
    alert("Dữ liệu đang được đồng bộ realtime tự động qua Cloud Firestore!");
  };

  // ===== GIAO DIỆN ĐĂNG NHẬP / ĐĂNG KÝ =====
  if (authMode) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#f1f5f9'
      }}>
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '24px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 16px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
            }}>
              🐄
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', color: '#fff' }}>
              Bò Vàng Farm O2O
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              Hệ thống Quản lý Chăn nuôi Thông minh
            </p>
          </div>

          <div style={{
            display: 'flex',
            background: '#0f172a',
            padding: '5px',
            borderRadius: '14px',
            marginBottom: '28px',
            border: '1px solid #334155'
          }}>
            <button
              onClick={() => setAuthMode('login')}
              style={{
                flex: 1,
                padding: '11px',
                background: authMode === 'login' ? '#10b981' : 'transparent',
                color: authMode === 'login' ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setAuthMode('register')}
              style={{
                flex: 1,
                padding: '11px',
                background: authMode === 'register' ? '#10b981' : 'transparent',
                color: authMode === 'register' ? '#fff' : '#94a3b8',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Đăng Ký Thành Viên
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                  Số CCCD / Tài khoản Admin
                </label>
                <input
                  type="text"
                  placeholder="Nhập số CCCD của bạn"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                  Mật khẩu
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                Đăng Nhập Hệ Thống
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '7px' }}>Họ và Tên</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={regForm.fullName}
                  onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '7px' }}>
                  Số CCCD <span style={{ color: '#94a3b8', fontWeight: '400' }}>(dùng làm tên đăng nhập)</span>
                </label>
                <input
                  type="text"
                  placeholder="001098xxxxxx"
                  value={regForm.cccd}
                  onChange={e => setRegForm({ ...regForm, cccd: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '7px' }}>Mật khẩu</label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '7px' }}>Ngày Sinh</label>
                  <input
                    type="date"
                    value={regForm.dob}
                    onChange={e => setRegForm({ ...regForm, dob: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '7px' }}>Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="0909xxxxxx"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '7px' }}>Địa Chỉ Thường Trú</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                  value={regForm.address}
                  onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                Gửi Hồ Sơ Đăng Ký
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}>
                Hồ sơ sẽ được gửi lên Cloud để Admin phê duyệt
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ===== ADMIN PANEL =====
  if (currentUser && currentUser.role === 'admin') {
    const pendingMembersCount = members.filter(m => m.status === 'pending').length;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f1f5f9', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: '50px' }}>
        <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#dc2626', color: '#fff', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px' }}>ADMIN DASHBOARD</div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Quản Trị Hệ Thống Bò Vàng Farm</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={clearAllDatabase}
              style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
            >
              🗑️ Xóa Cloud Database
            </button>
            <button
              onClick={handleLogout}
              style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Đăng Xuất
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1150px', margin: '28px auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
              👥 Quản Lý & Phê Duyệt Thành Viên ({pendingMembersCount} chờ duyệt)
            </h3>
            <button
              onClick={manualReloadData}
              style={{ background: '#334155', color: '#34d399', border: '1px solid #475569', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} /> Cloud Realtime Active
            </button>
          </div>

          <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '36px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '14px 18px' }}>Họ và Tên</th>
                  <th style={{ padding: '14px 18px' }}>Số CCCD (Login)</th>
                  <th style={{ padding: '14px 18px' }}>SĐT / Địa Chỉ</th>
                  <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Không có thành viên nào trên Cloud.</td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#fff' }}>{m.fullName}</td>
                      <td style={{ padding: '14px 18px', color: '#34d399', fontFamily: 'monospace', fontWeight: '600' }}>{m.cccd || m.id}</td>
                      <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{m.phone} - {m.address}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: m.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: m.status === 'approved' ? '#34d399' : '#fbbf24',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {m.status === 'approved' ? 'Đã kích hoạt' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {m.status !== 'approved' && (
                            <button
                              onClick={() => approveMember(m.id)}
                              style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                            >
                              <Check size={14} /> Duyệt
                            </button>
                          )}
                          <button
                            onClick={() => rejectMember(m.id, m.cccd)}
                            style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '14px' }}>💰 Phê Duyệt Lệnh Nạp Tiền Của User</h3>
          <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '36px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '14px 18px' }}>Mã CCCD User</th>
                  <th style={{ padding: '14px 18px' }}>Số Tiền Nạp</th>
                  <th style={{ padding: '14px 18px' }}>Thời Gian</th>
                  <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Không có lệnh nạp tiền nào đang chờ.</td>
                  </tr>
                ) : (
                  pendingDeposits.map((dep) => (
                    <tr key={dep.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#34d399', fontWeight: '700' }}>{dep.cccd}</td>
                      <td style={{ padding: '14px 18px', color: '#fbbf24', fontWeight: '800' }}>+{Number(dep.amount).toLocaleString()} đ</td>
                      <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{dep.time}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: dep.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: dep.status === 'approved' ? '#34d399' : '#fbbf24',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700'
                        }}>
                          {dep.status === 'approved' ? 'Đã duyệt' : 'Chờ xác nhận'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {dep.status === 'pending' ? (
                          <button
                            onClick={() => approveDeposit(dep.id, dep.cccd, dep.amount)}
                            style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Xác Nhận Đã Nhận Tiền
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>Đã hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '14px' }}>⚙️ Điều Chỉnh Giá Bán Bò, Vật Phẩm & Giá Thu Mua Sữa</h3>
          <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Giá Bò Sữa Cao Sản (đ)</label>
                <input
                  type="number"
                  value={editingPrices.milkCow.price}
                  onChange={e => setEditingPrices({ ...editingPrices, milkCow: { ...editingPrices.milkCow, price: Number(e.target.value) } })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Giá Bò Vàng Giống (đ)</label>
                <input
                  type="number"
                  value={editingPrices.goldCow.price}
                  onChange={e => setEditingPrices({ ...editingPrices, goldCow: { ...editingPrices.goldCow, price: Number(e.target.value) } })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Giá Gói 20 Bó Cỏ (đ)</label>
                <input
                  type="number"
                  value={editingPrices.grass.price}
                  onChange={e => setEditingPrices({ ...editingPrices, grass: { ...editingPrices.grass, price: Number(e.target.value) } })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>Giá Thu Mua 1 Lít Sữa (đ)</label>
                <input
                  type="number"
                  value={editingPrices.milkSellPrice}
                  onChange={e => setEditingPrices({ ...editingPrices, milkSellPrice: Number(e.target.value) })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button
              onClick={saveNewPrices}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              Lưu Thay Đổi Bảng Giá
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== USER PANEL =====
  const transferContent = `BVF${currentUser?.cccd || ''}`;
  const qrAmount = Number(depositAmount) || 0;
  const qrUrl = `https://img.vietqr.io/image/TCB-991169999999-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('NGO HOANG VU')}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f1f5f9', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: '70px' }}>
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px' }}>🐄</div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Bò Vàng Farm</h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Xin chào, {currentUser?.fullName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#0f172a', padding: '8px 14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fbbf24' }}>💰</span>
            <span style={{ fontWeight: '800', color: '#34d399' }}>{balance.toLocaleString()} đ</span>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            + Nạp tiền
          </button>
          <button
            onClick={handleLogout}
            style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Thoát
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('farm')}
          style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'farm' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'farm' ? '#34d399' : '#94a3b8', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
        >
          🏡 Trang Trại Của Tôi
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'shop' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'shop' ? '#34d399' : '#94a3b8', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
        >
          🛒 Cửa Hàng & Kho
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 20px' }}>
        {activeTab === 'farm' ? (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
              Đàn Bò Của Bạn ({cows.filter(c => c.owner === currentUser.cccd).length} con)
            </h3>
            {cows.filter(c => c.owner === currentUser.cccd).length === 0 ? (
              <div style={{ background: '#1e293b', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                Bạn chưa có bò nào. Hãy vào Cửa hàng để mua bò!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {cows.filter(c => c.owner === currentUser.cccd).map(cow => (
                  <div key={cow.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{cow.name}</h4>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>Tag: {cow.tag}</span>
                      </div>
                      <span style={{
                        background: cow.type === 'milk' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: cow.type === 'milk' ? '#60a5fa' : '#facc15',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {cow.type === 'milk' ? 'Bò Sữa' : 'Bò Vàng'}
                      </span>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                        <span>Độ no</span>
                        <span style={{ fontWeight: '700', color: cow.hunger < 40 ? '#f87171' : '#34d399' }}>{cow.hunger}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${cow.hunger}%`, height: '100%', background: cow.hunger < 40 ? '#ef4444' : '#10b981' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => feedCow(cow.id)}
                        style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                      >
                        🌿 Cho Ăn
                      </button>
                      {cow.type === 'milk' && (
                        <button
                          onClick={() => harvestMilk(cow.id)}
                          style={{ flex: 1, background: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        >
                          🥛 Thu Sữa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginTop: 0, marginBottom: '14px' }}>📦 Kho Vật Phẩm Của Bạn</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Cỏ Dự Trữ</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#34d399' }}>{inventory.grass} bó</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Sữa Tươi</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#60a5fa' }}>{inventory.milk} lít</span>
                  </div>
                </div>
                {inventory.milk > 0 && (
                  <button
                    onClick={sellMilk}
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Bán Ngay ({inventory.milk} Lít = {(inventory.milk * shopPrices.milkSellPrice).toLocaleString()} đ)
                  </button>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>🛒 Cửa Hàng Trang Trại</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700' }}>{shopPrices.milkCow.name}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>{shopPrices.milkCow.desc}</p>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{shopPrices.milkCow.price.toLocaleString()} đ</div>
                <button
                  onClick={() => buyItem('milkCow')}
                  style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  Mua Bò Sữa
                </button>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700' }}>{shopPrices.goldCow.name}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>{shopPrices.goldCow.desc}</p>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{shopPrices.goldCow.price.toLocaleString()} đ</div>
                <button
                  onClick={() => buyItem('goldCow')}
                  style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  Mua Bò Vàng
                </button>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700' }}>{shopPrices.grass.name}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0' }}>{shopPrices.grass.desc}</p>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{shopPrices.grass.price.toLocaleString()} đ</div>
                <button
                  onClick={() => buyItem('grass')}
                  style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                >
                  Mua Cỏ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL NẠP TIỀN + QR CODE ===== */}
      {showDepositModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '440px',
            border: '1px solid #334155',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', textAlign: 'center' }}>
              Nạp tiền vào tài khoản
            </h3>

            {/* Chọn nhanh số tiền */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>Chọn nhanh số tiền:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[100000, 200000, 500000, 1000000, 2000000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    style={{
                      background: depositAmount === amount.toString() ? '#10b981' : '#0f172a',
                      color: depositAmount === amount.toString() ? '#fff' : '#cbd5e1',
                      border: '1px solid #334155',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {amount.toLocaleString()}đ
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                Hoặc nhập số tiền khác (đ)
              </label>
              <input
                type="number"
                placeholder="Ví dụ: 300000"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Thông tin chuyển khoản + QR */}
            {qrAmount >= 10000 && (
              <div style={{ background: '#0f172a', borderRadius: '14px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#94a3b8' }}>Quét mã QR để thanh toán:</p>
                <img
                  src={qrUrl}
                  alt="QR Code nạp tiền"
                  style={{ width: '220px', height: '220px', borderRadius: '12px', background: '#fff', padding: '8px' }}
                />
                <div style={{ marginTop: '14px', textAlign: 'left', fontSize: '13px', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Ngân hàng:</strong> Techcombank</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Số tài khoản:</strong> 991169999999</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Chủ tài khoản:</strong> Ngô Hoàng Vũ</p>
                  <p style={{ margin: '0 0 4px 0', color: '#34d399' }}><strong>Nội dung CK:</strong> {transferContent}</p>
                  <p style={{ margin: '0', color: '#fbbf24' }}><strong>Số tiền:</strong> {qrAmount.toLocaleString()} đ</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositAmount('');
                }}
                style={{
                  flex: 1,
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '13px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                onClick={requestDeposit}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  padding: '13px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Tôi đã chuyển khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}