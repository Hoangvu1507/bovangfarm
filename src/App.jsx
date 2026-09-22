import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Video } from 'lucide-react';
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

// ===== CẤU HÌNH SINH HỌC CHĂN NUÔI THẬT =====
const MILK_COW_PRICE = 25000000;          // 25 triệu/con
const MILK_INTERVAL_HOURS = 12;           // Cooldown giữa 2 lần vắt (12 tiếng)
const HUNGER_LOSS_PER_HOUR = 35 / 24;     // Bò tiêu hao khoảng 35% độ no mỗi 24 giờ không ăn

// ===== COMPONENT CAMERA TRỰC TIẾP BA VÌ =====
function LiveCamera() {
  const cameras = [
    {
      title: "Khu chuồng trại cao sản Ba Vì - Camera #01",
      status: "Trạng thái: Đang phát trực tiếp từ đồng cỏ Ba Vì. Bò đang thong thả gặm cỏ tươi.",
      overlay: "🟢 Camera #01 · Trực tiếp từ Đồng cỏ Ba Vì · 1080p (FPS: 30)",
      image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=1200&auto=format&fit=crop"
    },
    {
      title: "Khu chuồng trại cao sản Ba Vì - Góc máy 2",
      status: "Trạng thái: Góc nhìn toàn cảnh đồng cỏ phía Tây, gió nhẹ, thời tiết đẹp.",
      overlay: "🟢 Góc máy 2 · Góc toàn cảnh · 1080p (FPS: 30)",
      image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1200&auto=format&fit=crop"
    },
    {
      title: "Khu vực vắt sữa tự động - Góc máy Vắt sữa",
      status: "Trạng thái: Khu vực chuồng sạch sẽ, quy trình khép kín tự động.",
      overlay: "🟢 Góc máy Vắt sữa · Khu khép kín · 1080p (FPS: 30)",
      image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=1200&auto=format&fit=crop"
    }
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % cameras.length);
        setFade(true);
      }, 300);
    }, 10000);
    return () => clearInterval(timer);
  }, [cameras.length]);

  const handleSelectCam = (index) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 300);
  };

  const currentCam = cameras[currentIndex];

  return (
    <div style={{ maxWidth: '950px', margin: '20px auto', background: '#161b22', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', border: '1px solid #30363d', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ padding: '14px 20px', background: '#0d1117', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', fontSize: '14px', fontWeight: '500' }}>
        <span>📹 Camera Trực Tiếp Nông Trại Bò Vàng (Ba Vì)</span>
        <div style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '13px' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#ff3b30', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #ff3b30' }}></span> LIVE 24/7
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '500px', background: '#000', overflow: 'hidden' }}>
        <img 
          src={currentCam.image} 
          alt="Live Stream" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: fade ? 1 : 0.2, transition: 'opacity 0.3s ease-in-out' }} 
        />
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(13, 17, 23, 0.75)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
          {currentCam.overlay}
        </div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#e6edf3' }}>{currentCam.title}</div>
          <div style={{ fontSize: '13px', color: '#8b949e' }}>{currentCam.status}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => handleSelectCam(1)}
            style={{ background: currentIndex === 1 ? '#1f6feb' : '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: '0.2s' }}
          >
            📷 Góc máy 2
          </button>
          <button 
            onClick={() => handleSelectCam(2)}
            style={{ background: currentIndex === 2 ? '#1f6feb' : '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: '0.2s' }}
          >
            🥛 Góc máy Vắt sữa
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENT CHÍNH APP =====
export default function App() {
  const [authMode, setAuthMode] = useState(() => localStorage.getItem('farm_logged_user') ? null : 'login');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('farm_logged_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regForm, setRegForm] = useState({ fullName: '', cccd: '', password: '', dob: '', phone: '', address: '' });
  
  const [members, setMembers] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [sharedCows, setSharedCows] = useState([]);
  
  const [shopPrices, setShopPrices] = useState({
    milkCow: { name: 'Bò Sữa Cao Sản', price: 300000, desc: 'Cho sữa tươi định kỳ hàng ngày.' },
    goldCow: { name: 'Bò Vàng Giống', price: 500000, desc: 'Sinh sản bò con, gia tăng tài sản.' },
    grass: { name: 'Gói 20 Bó Cỏ', price: 50000, desc: 'Thức ăn dinh dưỡng cho đàn bò.' },
    milkSellPrice: 25000
  });
  
  const [editingPrices, setEditingPrices] = useState({ ...shopPrices });
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('invest');
  
  const [inventory, setInventory] = useState({ grass: 0, milk: 0, medicine: 0 });
  const [cows, setCows] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [newCowName, setNewCowName] = useState('');

  const calculateRealtimeHunger = (cow) => {
    const now = Date.now();
    const lastUpdate = cow.lastHungerUpdate || cow.createdAt || now;
    const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
    if (hoursPassed <= 0) return cow.hunger ?? 100;
    const hungerLost = Math.floor(hoursPassed * HUNGER_LOSS_PER_HOUR);
    return Math.max(0, (cow.hunger ?? 100) - hungerLost);
  };

  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubDeposits = onSnapshot(collection(db, 'deposits'), (snap) => {
      setPendingDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSharedCows = onSnapshot(collection(db, 'cows'), (snap) => {
      setSharedCows(snap.docs.map(d => {
        const data = d.data();
        const calculatedHunger = calculateRealtimeHunger(data);
        return { id: d.id, ...data, hunger: calculatedHunger };
      }));
    });
    const unsubPrices = onSnapshot(doc(db, 'settings', 'prices'), (snap) => {
      if (snap.exists()) {
        setShopPrices(snap.data());
        setEditingPrices(snap.data());
      } else {
        const initial = {
          milkCow: { name: 'Bò Sữa Cao Sản', price: 300000, desc: 'Cho sữa tươi định kỳ hàng ngày.' },
          goldCow: { name: 'Bò Vàng Giống', price: 500000, desc: 'Sinh sản bò con, gia tăng tài sản.' },
          grass: { name: 'Gói 20 Bó Cỏ', price: 50000, desc: 'Thức ăn dinh dưỡng cho đàn bò.' },
          milkSellPrice: 25000
        };
        setDoc(doc(db, 'settings', 'prices'), initial);
      }
    });
    return () => { unsubMembers(); unsubDeposits(); unsubSharedCows(); unsubPrices(); };
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'user') {
      const me = members.find(m => m.cccd === currentUser.cccd || m.id === currentUser.cccd);
      if (me) {
        setBalance(me.balance || 0);
        if (me.inventory) setInventory(me.inventory);
        if (me.cows) {
          setCows(me.cows.map(c => ({ ...c, hunger: calculateRealtimeHunger(c) })));
        }
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
      if (found.status !== 'approved') return alert("Tài khoản đang chờ phê duyệt!");
      const userData = { role: 'user', ...found };
      setCurrentUser(userData);
      localStorage.setItem('farm_logged_user', JSON.stringify(userData));
      setBalance(found.balance || 0);
      setAuthMode(null);
    } else {
      alert("Sai CCCD hoặc mật khẩu!");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanCccd = regForm.cccd.trim();
    if (!cleanCccd || !regForm.fullName || !regForm.password) return alert("Điền đầy đủ thông tin!");
    if (cleanCccd === '001098000393') return alert("CCCD trùng admin!");
    try {
      const docRef = doc(db, 'members', cleanCccd);
      if ((await getDoc(docRef)).exists()) return alert("CCCD đã tồn tại!");
      await setDoc(docRef, { 
        ...regForm, 
        cccd: cleanCccd, 
        balance: 0, 
        status: 'pending',
        inventory: { grass: 0, milk: 0, medicine: 0 },
        cows: []
      });
      alert("Đăng ký thành công! Chờ Admin duyệt.");
      setAuthMode('login');
      setRegForm({ fullName: '', cccd: '', password: '', dob: '', phone: '', address: '' });
    } catch (err) {
      alert("Đăng ký thất bại!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farm_logged_user');
    setCurrentUser(null);
    setAuthMode('login');
  };

  const requestDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 10000) return alert("Tối thiểu 10.000đ");
    try {
      await addDoc(collection(db, 'deposits'), {
        cccd: currentUser.cccd,
        amount,
        time: new Date().toLocaleString('vi-VN'),
        status: 'pending',
        fullName: currentUser.fullName
      });
      alert("Đã gửi yêu cầu nạp tiền! Chờ Admin xác nhận.");
      setDepositAmount('');
      setShowDepositModal(false);
    } catch (err) {
      alert("Lỗi gửi yêu cầu!");
    }
  };

  const createSharedCow = async () => {
    if (!newCowName.trim()) return alert("Nhập tên bò!");
    const now = Date.now();
    try {
      await addDoc(collection(db, 'cows'), {
        name: newCowName.trim(),
        type: 'milk',
        totalPrice: MILK_COW_PRICE,
        totalShares: 100,
        availableShares: 100,
        owners: [],
        status: 'available',
        createdAt: now,
        hunger: 100,
        lastHungerUpdate: now,
        dailyHarvestCount: 0,
        lastResetDate: new Date().toDateString(),
        nextHarvestAt: now
      });
      alert("Tạo bò thành công!");
      setNewCowName('');
    } catch (err) {
      alert("Lỗi tạo bò!");
    }
  };

  const buyShares = async (cow, percent) => {
    if (cow.availableShares < percent) return alert("Không đủ cổ phần trống!");
    const cost = Math.round(MILK_COW_PRICE * percent / 100);
    if (balance < cost) return alert("Số dư không đủ! Vui lòng nạp thêm tiền.");
    
    const myOwnership = cow.owners?.find(o => o.cccd === currentUser.cccd);
    const currentPercent = myOwnership ? myOwnership.percent : 0;
    if (currentPercent + percent > 100) return alert("Bạn không thể sở hữu quá 100%!");
    try {
      const newBalance = balance - cost;
      await updateDoc(doc(db, 'members', currentUser.cccd), { balance: newBalance });
      setBalance(newBalance);
      const newOwners = [...(cow.owners || [])];
      const existIdx = newOwners.findIndex(o => o.cccd === currentUser.cccd);
      if (existIdx >= 0) {
        newOwners[existIdx].percent += percent;
        newOwners[existIdx].shares += percent;
        newOwners[existIdx].invested += cost;
      } else {
        newOwners.push({
          cccd: currentUser.cccd,
          fullName: currentUser.fullName,
          percent,
          shares: percent,
          invested: cost,
          joinedAt: Date.now()
        });
      }
      await updateDoc(doc(db, 'cows', cow.id), {
        availableShares: cow.availableShares - percent,
        owners: newOwners,
        status: cow.availableShares - percent <= 0 ? 'full' : 'available'
      });
      alert(`Mua thành công ${percent}% bò "${cow.name}"\nSố tiền: ${cost.toLocaleString()}đ`);
    } catch (err) {
      alert("Lỗi mua cổ phần!");
    }
  };

  const harvestSharedMilk = async (cow) => {
    const now = Date.now();
    const todayStr = new Date().toDateString();
    const currentHunger = calculateRealtimeHunger(cow);
    let dailyCount = cow.lastResetDate === todayStr ? (cow.dailyHarvestCount || 0) : 0;
    if (dailyCount >= 2) return alert("🚫 Con bò này đã đạt giới hạn tối đa 2 lần vắt trong ngày hôm nay!");
    if (cow.nextHarvestAt && now < cow.nextHarvestAt) {
      const timeLeft = cow.nextHarvestAt - now;
      const hours = Math.floor(timeLeft / 3600000);
      const mins = Math.floor((timeLeft % 3600000) / 60000);
      return alert(`⏳ Chưa đến chu kỳ vắt sữa tiếp theo! Vui lòng đợi thêm ${hours} giờ ${mins} phút.`);
    }
    if (currentHunger < 40) return alert(`⚠️ Bò "${cow.name}" đang đói (${currentHunger}% độ no)! Cần cho bò ăn cỏ trước.`);
    const liters = Math.floor(Math.random() * 3) + 7;
    const totalMoney = liters * (shopPrices.milkSellPrice || 25000);
    try {
      for (const owner of cow.owners || []) {
        const shareMoney = Math.floor(totalMoney * owner.percent / 100);
        const memberRef = doc(db, 'members', owner.cccd);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const currentBal = memberSnap.data().balance || 0;
          await updateDoc(memberRef, { balance: currentBal + shareMoney });
        }
      }
      await updateDoc(doc(db, 'cows', cow.id), {
        dailyHarvestCount: dailyCount + 1,
        lastResetDate: todayStr,
        nextHarvestAt: now + MILK_INTERVAL_HOURS * 60 * 60 * 1000,
        hunger: Math.max(0, currentHunger - 40),
        lastHungerUpdate: now
      });
      alert(`🎉 Vắt sữa thành công!\n- Sản lượng: ${liters} lít\n- Tổng doanh thu: ${totalMoney.toLocaleString()}đ`);
    } catch (err) {
      alert("Lỗi khi vắt sữa!");
    }
  };

  const feedSharedCow = async (cow) => {
    if (inventory.grass <= 0) return alert("Bạn đã hết cỏ! Hãy mua thêm ở cửa hàng.");
    const newInventory = { ...inventory, grass: inventory.grass - 1 };
    setInventory(newInventory);
    const now = Date.now();
    const currentHunger = calculateRealtimeHunger(cow);
    const newHunger = Math.min(100, currentHunger + 35);
    try {
      await updateDoc(doc(db, 'members', currentUser.cccd), { inventory: newInventory });
      await updateDoc(doc(db, 'cows', cow.id), { hunger: newHunger, lastHungerUpdate: now });
      alert(`🌿 Đã cho bò "${cow.name}" ăn 1 bó cỏ! Độ no hiện tại: ${newHunger}%`);
    } catch (err) {
      alert("Lỗi cho bò ăn!");
    }
  };

  const buyItem = async (itemKey) => {
    let cost = 0;
    if (itemKey === 'milkCow') cost = shopPrices.milkCow.price;
    if (itemKey === 'goldCow') cost = shopPrices.goldCow.price;
    if (itemKey === 'grass') cost = shopPrices.grass.price;
    if (balance < cost) return alert("Số dư không đủ!");
    const newBalance = balance - cost;
    setBalance(newBalance);
    const now = Date.now();
    let newInventory = { ...inventory };
    let newCows = [...cows];
    if (itemKey === 'grass') {
      newInventory.grass += 20;
    } else if (itemKey === 'milkCow') {
      newCows.push({ id: now, name: `Bò Sữa #${newCows.length + 1}`, tag: `BV-100${newCows.length + 1}`, type: 'milk', hunger: 100, lastHungerUpdate: now, dailyHarvestCount: 0 });
    } else if (itemKey === 'goldCow') {
      newCows.push({ id: now, name: `Bò Vàng #${newCows.length + 1}`, tag: `BV-200${newCows.length + 1}`, type: 'gold', hunger: 100, lastHungerUpdate: now });
    }
    setInventory(newInventory);
    setCows(newCows);
    try {
      await updateDoc(doc(db, 'members', currentUser.cccd), { 
        balance: newBalance,
        inventory: newInventory,
        cows: newCows
      });
      alert("Giao dịch mua thành công!");
    } catch (err) {
      alert("Lỗi cập nhật dữ liệu cửa hàng.");
    }
  };

  const sellMilk = async () => {
    if (inventory.milk <= 0) return alert("Không có sữa trong kho!");
    const earned = inventory.milk * shopPrices.milkSellPrice;
    const newBalance = balance + earned;
    const newInventory = { ...inventory, milk: 0 };
    setInventory(newInventory);
    setBalance(newBalance);
    try {
      await updateDoc(doc(db, 'members', currentUser.cccd), { 
        balance: newBalance,
        inventory: newInventory
      });
      alert(`Đã bán sữa thu về +${earned.toLocaleString()}đ`);
    } catch (err) {
      console.error(err);
    }
  };

  const approveMember = async (id) => {
    await updateDoc(doc(db, 'members', id), { status: 'approved' });
    alert("Đã duyệt thành viên!");
  };

  const rejectMember = async (id, cccd) => {
    if (!window.confirm(`Xóa thành viên ${cccd}?`)) return;
    await deleteDoc(doc(db, 'members', id));
    alert("Đã xóa thành viên!");
  };

  const approveDeposit = async (depId, cccd, amount) => {
    await updateDoc(doc(db, 'deposits', depId), { status: 'approved' });
    const member = members.find(m => m.cccd === cccd || m.id === cccd);
    if (member) {
      const newBal = (member.balance || 0) + amount;
      await updateDoc(doc(db, 'members', member.id), { balance: newBal });
    }
    alert(`Đã duyệt nạp ${amount.toLocaleString()}đ`);
  };

  const saveNewPrices = async () => {
    await setDoc(doc(db, 'settings', 'prices'), editingPrices);
    setShopPrices(editingPrices);
    alert("Đã cập nhật bảng giá!");
  };

  const clearAllDatabase = async () => {
    if (!window.confirm("CẢNH BÁO: XÓA TOÀN BỘ DỮ LIỆU?")) return;
    for (const col of ['members', 'deposits', 'cows']) {
      const snap = await getDocs(collection(db, col));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, col, d.id))));
    }
    localStorage.clear();
    window.location.reload();
  };

  // Màn hình Đăng nhập / Đăng ký
  if (authMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter,sans-serif', color: '#f1f5f9' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 460 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🐄</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Bò Vàng Farm O2O</h1>
            <p style={{ color: '#94a3b8', marginTop: 6 }}>Hệ thống Quản lý Chăn nuôi Thông minh</p>
          </div>
          <div style={{ display: 'flex', background: '#0f172a', padding: 5, borderRadius: 14, marginBottom: 28 }}>
            <button onClick={() => setAuthMode('login')} style={{ flex: 1, padding: 11, background: authMode === 'login' ? '#10b981' : 'transparent', color: authMode === 'login' ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Đăng Nhập</button>
            <button onClick={() => setAuthMode('register')} style={{ flex: 1, padding: 11, background: authMode === 'register' ? '#10b981' : 'transparent', color: authMode === 'register' ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Đăng Ký</button>
          </div>
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="text" placeholder="Số CCCD / Admin" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '13px 16px', borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mật khẩu" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: '13px 16px', borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <button type="submit" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: 15, borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>Đăng Nhập</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input type="text" placeholder="Họ và Tên" value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <input type="text" placeholder="Số CCCD" value={regForm.cccd} onChange={e => setRegForm({...regForm, cccd: e.target.value})} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <input type="password" placeholder="Mật khẩu" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <input type="date" value={regForm.dob} onChange={e => setRegForm({...regForm, dob: e.target.value})} required style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
                <input type="text" placeholder="SĐT" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} required style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <input type="text" placeholder="Địa chỉ" value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})} required style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <button type="submit" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: 14, borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>Gửi Hồ Sơ Đăng Ký</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Màn hình Quản trị viên (Admin)
  if (currentUser?.role === 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', fontFamily: 'Inter,sans-serif', paddingBottom: 50 }}>
        <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#dc2626', color: '#fff', padding: '8px 12px', borderRadius: 10, fontWeight: 800, fontSize: 12 }}>ADMIN</div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Quản Trị Bò Vàng Farm</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={clearAllDatabase} style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Xóa Database</button>
            <button onClick={handleLogout} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><LogOut size={14} /> Đăng Xuất</button>
          </div>
        </div>
        <div style={{ maxWidth: 1150, margin: '28px auto', padding: '0 24px' }}>
          <div style={{ background: '#1e293b', borderRadius: 20, border: '1px solid #334155', padding: 24, marginBottom: 32 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800 }}>➕ Tạo Bò Sữa Sở Hữu Chung (25.000.000đ)</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="text" placeholder="Tên bò (VD: Bò Sữa #01)" value={newCowName} onChange={e => setNewCowName(e.target.value)}
                style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', padding: '12px 16px', borderRadius: 12, color: '#fff', boxSizing: 'border-box' }} />
              <button onClick={createSharedCow} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={18} /> Tạo Bò
              </button>
            </div>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>🐄 Bò Sở Hữu Chung ({sharedCows.length})</h3>
          <div style={{ display: 'grid', gap: 16, marginBottom: 36 }}>
            {sharedCows.length === 0 ? (
              <div style={{ background: '#1e293b', borderRadius: 16, padding: 30, textAlign: 'center', color: '#64748b' }}>Chưa có bò nào</div>
            ) : sharedCows.map(cow => (
              <div key={cow.id} style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{cow.name}</h4>
                  <span style={{ background: cow.availableShares === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: cow.availableShares === 0 ? '#34d399' : '#fbbf24', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {cow.availableShares === 0 ? 'Đã bán hết' : `Còn ${cow.availableShares}%`}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#94a3b8' }}>Giá trị: {cow.totalPrice?.toLocaleString()}đ · Độ no: <strong style={{ color: cow.hunger < 40 ? '#f87171' : '#34d399' }}>{cow.hunger}%</strong></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Màn hình Khách hàng (User)
  const transferContent = `BVF${currentUser?.cccd || ''}`;
  const qrAmount = Number(depositAmount) || 0;
  const qrUrl = `https://img.vietqr.io/image/TCB-991169999999-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent('NGO HOANG VU')}`;
  
  const mySharedCows = sharedCows.filter(c => c.owners?.some(o => o.cccd === currentUser.cccd));
  const availableSharedCows = sharedCows.filter(c => c.availableShares > 0);

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', fontFamily: 'Inter,sans-serif', paddingBottom: 70 }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>🐄</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Bò Vàng Farm</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Xin chào, {currentUser?.fullName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#0f172a', padding: '8px 14px', borderRadius: 12, border: '1px solid #334155' }}>
            <span style={{ color: '#fbbf24' }}>💰</span> <span style={{ fontWeight: 800, color: '#34d399' }}>{balance.toLocaleString()}đ</span>
          </div>
          <button onClick={() => setShowDepositModal(true)} style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Nạp tiền</button>
          <button onClick={handleLogout} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}><LogOut size={14} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', gap: 8, overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('invest')} style={{ padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'invest' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'invest' ? '#34d399' : '#94a3b8', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>📈 Đầu tư Bò</button>
        <button onClick={() => setActiveTab('my')} style={{ padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'my' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'my' ? '#34d399' : '#94a3b8', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🏡 Bò của tôi</button>
        <button onClick={() => setActiveTab('shop')} style={{ padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'shop' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'shop' ? '#34d399' : '#94a3b8', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🛒 Cửa hàng & Kho</button>
        <button onClick={() => setActiveTab('camera')} style={{ padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'camera' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'camera' ? '#34d399' : '#94a3b8', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}><Video size={16} /> 📹 Camera Ba Vì</button>
      </div>

      <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 20px' }}>
        {/* TAB ĐẦU TƯ BÒ */}
        {activeTab === 'invest' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Danh sách bò đang mở bán (Sở hữu chung)</h3>
            {availableSharedCows.length === 0 ? (
              <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, textAlign: 'center', color: '#64748b' }}>Hiện không có bò nào còn cổ phần trống</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {availableSharedCows.map(cow => (
                  <div key={cow.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{cow.name}</h4>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#94a3b8' }}>
                      Giá trị: <strong style={{ color: '#fbbf24' }}>{cow.totalPrice?.toLocaleString()}đ</strong> · Còn trống: <strong style={{ color: '#34d399' }}>{cow.availableShares}%</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[25, 50, 75, 100].map(p => (
                        cow.availableShares >= p && (
                          <button key={p} onClick={() => buyShares(cow, p)}
                            style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            Mua {p}% ({Math.round(MILK_COW_PRICE * p / 100).toLocaleString()}đ)
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB BÒ CỦA TÔI */}
        {activeTab === 'my' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Bò bạn đang sở hữu ({mySharedCows.length})</h3>
            {mySharedCows.length === 0 ? (
              <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, textAlign: 'center', color: '#64748b' }}>Bạn chưa sở hữu cổ phần bò nào</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {mySharedCows.map(cow => {
                  const myShare = cow.owners.find(o => o.cccd === currentUser.cccd);
                  const now = Date.now();
                  const todayStr = new Date().toDateString();
                  const dailyCount = cow.lastResetDate === todayStr ? (cow.dailyHarvestCount || 0) : 0;
                  const hunger = cow.hunger;
                  const canHarvest = dailyCount < 2 && hunger >= 40;
                  return (
                    <div key={cow.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{cow.name}</h4>
                      <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#94a3b8' }}>
                        Bạn sở hữu: <strong style={{ color: '#34d399' }}>{myShare?.percent}%</strong> · Độ no: <strong style={{ color: hunger < 40 ? '#f87171' : '#34d399' }}>{hunger}%</strong>
                      </p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => feedSharedCow(cow)} style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          🌿 Cho bò ăn cỏ (Kho: {inventory.grass} bó)
                        </button>
                        <button onClick={() => harvestSharedMilk(cow)} disabled={!canHarvest}
                          style={{ flex: 1, background: canHarvest ? 'linear-gradient(135deg,#10b981,#059669)' : '#334155', color: '#fff', border: 'none', padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: canHarvest ? 'pointer' : 'not-allowed', opacity: canHarvest ? 1 : 0.6 }}>
                          {canHarvest ? '🥛 Vắt sữa & Nhận tiền' : 'Chưa đủ điều kiện'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CỬA HÀNG & KHO */}
        {activeTab === 'shop' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🛒 Cửa hàng vật phẩm</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 30 }}>
              <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 8px' }}>🌿 {shopPrices.grass.name}</h4>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 12px' }}>{shopPrices.grass.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>{shopPrices.grass.price.toLocaleString()}đ</span>
                  <button onClick={() => buyItem('grass')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Mua</button>
                </div>
              </div>
            </div>
            <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, border: '1px solid #334155' }}>
              <h4 style={{ margin: '0 0 8px' }}>📦 Kho của bạn</h4>
              <p style={{ margin: '4px 0' }}>Cỏ trong kho: <strong>{inventory.grass} bó</strong></p>
              <p style={{ margin: '4px 0' }}>Sữa tươi: <strong>{inventory.milk} lít</strong></p>
              {inventory.milk > 0 && (
                <button onClick={sellMilk} style={{ marginTop: 12, background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Bán toàn bộ sữa</button>
              )}
            </div>
          </div>
        )}

        {/* TAB CAMERA BA VÌ */}
        {activeTab === 'camera' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Hệ thống Camera Trực Tiếp Nông Trại</h3>
            <LiveCamera />
          </div>
        )}
      </div>

      {/* Modal Nạp Tiền */}
      {showDepositModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Nạp tiền vào tài khoản</h3>
            <input type="number" placeholder="Nhập số tiền (VNĐ)" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 10, color: '#fff', marginBottom: 16, boxSizing: 'border-box' }} />
            {qrAmount >= 10000 && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src={qrUrl} alt="QR Code" style={{ width: '200px', height: '200px', background: '#fff', padding: 8, borderRadius: 8 }} />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Nội dung chuyển khoản: <strong style={{ color: '#34d399' }}>{transferContent}</strong></p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={requestDeposit} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Đã chuyển khoản</button>
              <button onClick={() => setShowDepositModal(false)} style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}