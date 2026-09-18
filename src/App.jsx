import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShoppingBag, Box, Camera, Heart, DollarSign, 
  ShieldAlert, Users, FileText, CheckCircle2, Lock, User, LogOut, ArrowRight, Settings, Check, X, Edit3, RefreshCw, Play
} from 'lucide-react';

// ==========================================
// CẤU HÌNH FIREBASE CHUẨN CỦA BẠN
// ==========================================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, 
  onSnapshot, addDoc, deleteDoc, getDocs 
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
  // --- QUẢN LÝ TRẠNG THÁI XÁC THỰC & ĐĂNG NHẬP ---
  const [authMode, setAuthMode] = useState(() => {
    return localStorage.getItem('farm_logged_user') ? null : 'login';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('farm_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Form state cho Đăng nhập
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form state cho Đăng ký thành viên
  const [regForm, setRegForm] = useState({
    fullName: '',
    cccd: '',
    password: '',
    dob: '',
    phone: '',
    address: ''
  });

  // --- DATABASE HỆ THỐNG (CLOUD FIRESTORE REALTIME) ---
  const [members, setMembers] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);

  const [shopPrices, setShopPrices] = useState({
    milkCow: { name: 'Bò Sữa Cao Sản', price: 300000, desc: 'Cho sữa tươi định kỳ hàng ngày.' },
    goldCow: { name: 'Bò Vàng Giống', price: 500000, desc: 'Sinh sản bò con, gia tăng tài sản.' },
    grass: { name: 'Gói 20 Bó Cỏ', price: 50000, desc: 'Thức ăn dinh dưỡng cho đàn bò.' },
    milkSellPrice: 25000
  });

  const [editingPrices, setEditingPrices] = useState({ ...shopPrices });

  // --- DỮ LIỆU TRANG TRẠI & KHO CỦA USER ---
  const [balance, setBalance] = useState(1500000);
  const [activeTab, setActiveTab] = useState('farm');
  
  const [inventory, setInventory] = useState({
    grass: 45,
    milk: 18,
    medicine: 5
  });

  const [cows, setCows] = useState([
    { id: 1, name: 'Bò Sữa Hà Lan #01', tag: 'BV-1001', type: 'milk', hunger: 80, owner: '001098001234' },
    { id: 2, name: 'Bò Vàng Sinh Sản #01', tag: 'BV-1002', type: 'gold', hunger: 90, owner: '001098001234' }
  ]);

  // LẮNG NGHE DỮ LIỆU REALTIME TỪ CLOUD FIRESTORE
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
      const me = members.find(m => m.cccd === currentUser.cccd);
      if (me) {
        setBalance(me.balance);
      }
    }
  }, [members, currentUser]);

  // --- XỬ LÝ ĐĂNG NHẬP ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername === '001098000393' && loginPassword === 'Phuongthao97@@') {
      const adminData = { role: 'admin', fullName: 'Quản Trị Viên Hệ Thống' };
      setCurrentUser(adminData);
      localStorage.setItem('farm_logged_user', JSON.stringify(adminData));
      setAuthMode(null);
      return;
    }

    const found = members.find(m => m.cccd === loginUsername && m.password === loginPassword);
    if (found) {
      if (found.status !== 'approved') {
        alert("Tài khoản của bạn đang chờ Quản Trị Viên phê duyệt. Vui lòng quay lại sau!");
        return;
      }
      const userData = { role: 'user', ...found };
      setCurrentUser(userData);
      localStorage.setItem('farm_logged_user', JSON.stringify(userData));
      setBalance(found.balance);
      setAuthMode(null);
    } else {
      alert("Sai số CCCD hoặc mật khẩu, hoặc tài khoản chưa được duyệt!");
    }
  };

  // --- XỬ LÝ ĐĂNG KÝ THÀNH VIÊN ---
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

      const newMember = { ...regForm, cccd: cleanCccd, balance: 1000000, status: 'pending' };
      await setDoc(docRef, newMember);
      
      alert("Đăng ký thành công! Hồ sơ đã được đồng bộ lên Cloud để Admin phê duyệt.");
      setAuthMode('login');
      setRegForm({ fullName: '', cccd: '', password: '', dob: '', phone: '', address: '' });
    } catch (error) {
      console.error(error);
      alert("Đăng ký thất bại, vui lòng kiểm tra kết nối mạng.");
    }
  };

  // --- ĐĂNG XUẤT ---
  const handleLogout = () => {
    localStorage.removeItem('farm_logged_user');
    setCurrentUser(null);
    setAuthMode('login');
  };

  // --- XÓA SẠCH DATABASE TRÊN CLOUD ---
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

  // --- CÁC HÀNH ĐỘNG DÀNH CHO USER ---
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
      alert("Số dư tài khoản không đủ!");
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

  // --- HÀNH ĐỘNG DÀNH CHO ADMIN ---
  const approveMember = async (cccd) => {
    try {
      await updateDoc(doc(db, 'members', cccd), { status: 'approved' });
      alert(`Đã phê duyệt thành viên CCCD: ${cccd}`);
    } catch (error) {
      console.error(error);
    }
  };

  const rejectMember = async (cccd) => {
    try {
      await deleteDoc(doc(db, 'members', cccd));
      alert(`Đã từ chối thành viên: ${cccd}`);
    } catch (error) {
      console.error(error);
    }
  };

  const approveDeposit = async (depositId, cccd, amount) => {
    try {
      await updateDoc(doc(db, 'deposits', depositId), { status: 'approved' });
      const targetMember = members.find(m => m.cccd === cccd);
      if (targetMember) {
        const newBalance = (targetMember.balance || 0) + amount;
        await updateDoc(doc(db, 'members', cccd), { balance: newBalance });
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
    }
  };

  const manualReloadData = () => {
    alert("Dữ liệu đang được đồng bộ realtime tự động qua Cloud Firestore!");
  };

  // --- GIAO DIỆN ĐĂNG NHẬP / ĐĂNG KÝ ---
  if (authMode) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif', color: '#f1f5f9' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '42px', marginBottom: '10px' }}>🐄</div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#fff' }}>Bò Vàng Farm O2O</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Hệ thống Quản lý Chăn nuôi Thông minh</p>
          </div>

          <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: '14px', marginBottom: '24px', border: '1px solid #334155' }}>
            <button 
              onClick={() => setAuthMode('login')}
              style={{ flex: 1, padding: '10px', background: authMode === 'login' ? '#10b981' : 'transparent', color: authMode === 'login' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              Đăng Nhập
            </button>
            <button 
              onClick={() => setAuthMode('register')}
              style={{ flex: 1, padding: '10px', background: authMode === 'register' ? '#10b981' : 'transparent', color: authMode === 'register' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              Đăng Ký Thành Viên
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Tên Đăng Nhập (Số CCCD hoặc Admin)</label>
                <input 
                  type="text" 
                  placeholder="Nhập số CCCD hoặc tài khoản"
                  value={loginUsername} 
                  onChange={e => setLoginUsername(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '12px 16px', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Mật Khẩu</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '12px 16px', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
              >
                Đăng Nhập Hệ Thống
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Họ và Tên</label>
                <input 
                  type="text" placeholder="Nguyễn Văn B"
                  value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Số CCCD (Dùng làm tên đăng nhập)</label>
                <input 
                  type="text" placeholder="001098xxxxxx"
                  value={regForm.cccd} onChange={e => setRegForm({...regForm, cccd: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Mật Khẩu</label>
                <input 
                  type="password" placeholder="••••••••"
                  value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Ngày Sinh</label>
                  <input 
                    type="date" 
                    value={regForm.dob} onChange={e => setRegForm({...regForm, dob: e.target.value})}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Số Điện Thoại</label>
                  <input 
                    type="text" placeholder="0909xxxxxx"
                    value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Địa Chỉ Thường Trú</label>
                <input 
                  type="text" placeholder="Số nhà, Đường, Tỉnh/TP"
                  value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}
              >
                Gửi Hồ Sơ Đăng Ký Lên Cloud
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // --- GIAO DIỆN ADMIN PANEL ---
  if (currentUser && currentUser.role === 'admin') {
    const pendingMembersCount = members.filter(m => m.status === 'pending').length;

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f1f5f9', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
        <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#dc2626', color: '#fff', padding: '8px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px' }}>ADMIN DASHBOARD</div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Quản Trị Hệ Thống Bò Vàng Farm</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={clearAllDatabase}
              style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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

        <div style={{ maxWidth: '1100px', margin: '28px auto', padding: '0 24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> Phê Duyệt Đăng Ký Thành Viên ({pendingMembersCount} chờ duyệt) - Realtime Cloud
            </h3>
            <button 
              onClick={manualReloadData}
              style={{ background: '#334155', color: '#34d399', border: '1px solid #475569', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} /> Cloud Realtime Active
            </button>
          </div>

          <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '14px 18px' }}>Họ và Tên</th>
                  <th style={{ padding: '14px 18px' }}>Số CCCD (Login)</th>
                  <th style={{ padding: '14px 18px' }}>SĐT / Địa Chỉ</th>
                  <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Hành Động Phê Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có thành viên nào trên Cloud.</td></tr>
                ) : (
                  members.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#fff' }}>{m.fullName}</td>
                      <td style={{ padding: '14px 18px', color: '#34d399', fontFamily: 'monospace' }}>{m.cccd}</td>
                      <td style={{ padding: '14px 18px', color: '#94a3b8' }}>{m.phone} - {m.address}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ 
                          background: m.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                          color: m.status === 'approved' ? '#34d399' : '#fbbf24', 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' 
                        }}>
                          {m.status === 'approved' ? 'Đã kích hoạt' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {m.status !== 'approved' ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => approveMember(m.cccd)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={14} /> Duyệt
                            </button>
                            <button onClick={() => rejectMember(m.cccd)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <X size={14} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>Đang hoạt động</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💰</span> Phê Duyệt Lệnh Nạp Tiền Của User
          </h3>
          <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden', marginBottom: '32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '14px 18px' }}>Mã CCCD User</th>
                  <th style={{ padding: '14px 18px' }}>Số Tiền Nạp</th>
                  <th style={{ padding: '14px 18px' }}>Thời Gian</th>
                  <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có lệnh nạp tiền nào đang chờ.</td></tr>
                ) : (
                  pendingDeposits.map((dep) => (
                    <tr key={dep.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#34d399', fontWeight: '700' }}>{dep.cccd}</td>
                      <td style={{ padding: '14px 18px', color: '#fbbf24', fontWeight: '800' }}>+{Number(dep.amount).toLocaleString()} đ</td>
                      <td style={{ padding: '14px 18px', color: '#94a3b8' }}>{dep.time}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ background: dep.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: dep.status === 'approved' ? '#34d399' : '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                          {dep.status === 'approved' ? 'Đã duyệt' : 'Chờ xác nhận'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {dep.status === 'pending' ? (
                          <button onClick={() => approveDeposit(dep.id, dep.cccd, dep.amount)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
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

          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚙️</span> Điều Chỉnh Giá Bán Bò, Vật Phẩm & Giá Thu Mua Sữa
          </h3>
          <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Giá Bò Sữa Cao Sản (đ)</label>
                <input 
                  type="number" 
                  value={editingPrices.milkCow.price}
                  onChange={e => setEditingPrices({...editingPrices, milkCow: {...editingPrices.milkCow, price: Number(e.target.value)}})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Giá Bò Vàng Giống (đ)</label>
                <input 
                  type="number" 
                  value={editingPrices.goldCow.price}
                  onChange={e => setEditingPrices({...editingPrices, goldCow: {...editingPrices.goldCow, price: Number(e.target.value)}})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Giá Gói 20 Bó Cỏ (đ)</label>
                <input 
                  type="number" 
                  value={editingPrices.grass.price}
                  onChange={e => setEditingPrices({...editingPrices, grass: {...editingPrices.grass, price: Number(e.target.value)}})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Giá Thu Mua 1 Lít Sữa (đ)</label>
                <input 
                  type="number" 
                  value={editingPrices.milkSellPrice}
                  onChange={e => setEditingPrices({...editingPrices, milkSellPrice: Number(e.target.value)})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '10px 14px', borderRadius: '10px', color: '#fff', fontWeight: '700' }}
                />
              </div>
            </div>
            <button 
              onClick={saveNewPrices}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
            >
              Lưu Cập Nhật Giá Mới
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- GIAO DIỆN USER THÔNG THƯỜNG ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f1f5f9', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      
      {/* HEADER NAVBAR */}
      <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(51, 65, 85, 0.6)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #10b981, #047857)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🐄</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff' }}>Bò Vàng Farm</h1>
                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>O2O LIVE</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Chào: <strong style={{ color: '#fff' }}>{currentUser?.fullName}</strong> (CCCD: {currentUser?.cccd})</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '6px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Số Dư Xu</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24' }}>{balance.toLocaleString()} đ</div>
              </div>
              <button 
                onClick={async () => {
                  const amt = prompt("Nhập số tiền muốn nạp vào tài khoản (đ):", "500000");
                  if (amt) {
                    try {
                      const depositId = 'dep_' + Date.now();
                      const newDeposit = { 
                        id: depositId, 
                        cccd: currentUser.cccd, 
                        amount: Number(amt), 
                        time: new Date().toLocaleTimeString() + ' - ' + new Date().toLocaleDateString(), 
                        status: 'pending' 
                      };
                      await setDoc(doc(db, 'deposits', depositId), newDeposit);
                      alert("Đã gửi yêu cầu nạp tiền lên Cloud! Vui lòng chờ Admin phê duyệt.");
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}
              >
                + Nạp Tiền
              </button>
            </div>

            <button 
              onClick={handleLogout}
              style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '10px 14px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Đăng Xuất
            </button>
          </div>

        </div>
      </div>

      {/* NAVIGATION TABS CHO USER */}
      <div style={{ maxWidth: '1100px', margin: '24px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #334155', paddingBottom: '16px', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('farm')}
            style={{ padding: '10px 20px', borderRadius: '12px', background: activeTab === 'farm' ? '#10b981' : '#1e293b', color: activeTab === 'farm' ? '#fff' : '#94a3b8', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>🏡</span> Trang Trại Của Tôi
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            style={{ padding: '10px 20px', borderRadius: '12px', background: activeTab === 'shop' ? '#10b981' : '#1e293b', color: activeTab === 'shop' ? '#fff' : '#94a3b8', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ShoppingBag size={15} /> Cửa Hàng Vật Phẩm
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            style={{ padding: '10px 20px', borderRadius: '12px', background: activeTab === 'inventory' ? '#10b981' : '#1e293b', color: activeTab === 'inventory' ? '#fff' : '#94a3b8', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Box size={15} /> Kho Hàng & Nông Sản
          </button>
          <button 
            onClick={() => setActiveTab('camera')}
            style={{ padding: '10px 20px', borderRadius: '12px', background: activeTab === 'camera' ? '#10b981' : '#1e293b', color: activeTab === 'camera' ? '#fff' : '#94a3b8', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Camera size={15} /> Camera Trực Tuyến O2O
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH CỦA CÁC TAB */}
      <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 24px' }}>
        
        {/* TAB 1: TRANG TRẠI */}
        {activeTab === 'farm' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Đàn Bò Chăn Nuôi Của Bạn ({cows.filter(c => c.owner === currentUser.cccd).length} con)</h2>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Kho cỏ hiện có: <strong style={{ color: '#34d399' }}>{inventory.grass} bó</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {cows.filter(c => c.owner === currentUser.cccd).map(cow => (
                <div key={cow.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <span style={{ background: cow.type === 'milk' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)', color: cow.type === 'milk' ? '#34d399' : '#fbbf24', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>
                        {cow.type === 'milk' ? '🐄 Bò Sữa Cao Sản' : '🐂 Bò Vàng Giống'}
                      </span>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '10px 0 4px', color: '#fff' }}>{cow.name}</h3>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontFamily: 'monospace' }}>Mã thẻ: {cow.tag}</p>
                    </div>
                    <div style={{ fontSize: '32px' }}>🐄</div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Thể lực / Độ no:</span>
                      <span style={{ color: cow.hunger > 40 ? '#34d399' : '#ef4444' }}>{cow.hunger}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${cow.hunger}%`, height: '100%', background: cow.hunger > 40 ? '#10b981' : '#ef4444', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => feedCow(cow.id)}
                      style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                    >
                      🌿 Cho Ăn Cỏ
                    </button>
                    {cow.type === 'milk' && (
                      <button 
                        onClick={() => harvestMilk(cow.id)}
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                      >
                        🥛 Vắt Sữa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CỬA HÀNG VẬT PHẨM */}
        {activeTab === 'shop' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Cửa Hàng Nông Trại</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Mua thêm giống bò hoặc thức ăn để mở rộng quy mô trang trại của bạn.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🐄</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 8px', color: '#fff' }}>{shopPrices.milkCow.name}</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>{shopPrices.milkCow.desc}</p>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{shopPrices.milkCow.price.toLocaleString()} đ</div>
                  <button 
                    onClick={() => buyItem('milkCow')}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Mua Ngay
                  </button>
                </div>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🐂</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 8px', color: '#fff' }}>{shopPrices.goldCow.name}</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>{shopPrices.goldCow.desc}</p>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{shopPrices.goldCow.price.toLocaleString()} đ</div>
                  <button 
                    onClick={() => buyItem('goldCow')}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Mua Ngay
                  </button>
                </div>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌿</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 8px', color: '#fff' }}>{shopPrices.grass.name}</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>{shopPrices.grass.desc}</p>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24', marginBottom: '16px' }}>{shopPrices.grass.price.toLocaleString()} đ</div>
                  <button 
                    onClick={() => buyItem('grass')}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Mua Ngay
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: KHO HÀNG & NÔNG SẢN */}
        {activeTab === 'inventory' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Kho Nông Sản & Vật Tư</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Quản lý các sản phẩm thu hoạch được và thanh khoản ra tiền mặt.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px', background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '16px' }}>🥛</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Sữa Tươi Nguyên Chất</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{inventory.milk} Lít</div>
                  <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px' }}>Giá thu mua: {shopPrices.milkSellPrice.toLocaleString()} đ / lít</div>
                </div>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '32px', background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '16px' }}>🌿</div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>Cỏ Thức Ăn Cho Bò</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{inventory.grass} Bó</div>
                  <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>Sẵn sàng sử dụng</div>
                </div>
              </div>

            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px', color: '#fff' }}>Thanh Khoản Sữa Tươi Tích Lũy</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Quy đổi toàn bộ sữa trong kho thành tiền xu vào tài khoản của bạn.</p>
              </div>
              <button 
                onClick={sellMilk}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
              >
                Bán Ngay ({(inventory.milk * shopPrices.milkSellPrice).toLocaleString()} đ)
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CAMERA TRỰC TUYẾN O2O */}
        {activeTab === 'camera' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Camera Trực Tuyến Nông Trại (O2O)</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>Theo dõi trực tiếp hoạt động ăn uống và sinh hoạt của đàn bò tại trang trại thực tế.</p>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ height: '400px', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(239, 68, 68, 0.85)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span> LIVE CAM #01
                </div>

                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🐄🌾🚜</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>Khu Vực Chuồng Trại Cao Sản - Chuồng A1</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Đường truyền ổn định • 60 FPS • Độ phân giải HD</p>
              </div>

              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#172033' }}>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Trạng thái: <strong style={{ color: '#34d399' }}>Đang hoạt động bình thường</strong></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Góc Máy Khác</button>
                  <button style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Chụp Màn Hình</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}