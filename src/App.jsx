import React, { useState, useEffect } from 'react';
import { Check, Trash2, LogOut, RefreshCw, Plus, Video } from 'lucide-react';
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

// ===== CẤU HÌNH CHUẨN CHĂN NUÔI THỰC TẾ =====
const MILK_COW_PRICE = 25000000;      // 25 triệu/con
const MILK_INTERVAL_HOURS = 12;       // Thời gian cooldown giữa 2 lần vắt (12 tiếng / lần, tối đa 2 lần/ngày)

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
  const [sharedCows, setSharedCows] = useState([]); // Bò sở hữu chung
  
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
  const [cows, setCows] = useState([]); // Bò cá nhân

  // Nạp tiền modal
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // Admin tạo bò
  const [newCowName, setNewCowName] = useState('');

  // Lắng nghe dữ liệu realtime từ Firestore
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubDeposits = onSnapshot(collection(db, 'deposits'), (snap) => {
      setPendingDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSharedCows = onSnapshot(collection(db, 'cows'), (snap) => {
      setSharedCows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

  // Đồng bộ số dư và kho cá nhân của user
  useEffect(() => {
    if (currentUser?.role === 'user') {
      const me = members.find(m => m.cccd === currentUser.cccd || m.id === currentUser.cccd);
      if (me) {
        setBalance(me.balance || 0);
        if (me.inventory) setInventory(me.inventory);
        if (me.cows) setCows(me.cows);
      }
    }
  }, [members, currentUser]);

  // ===== XÁC THỰC (AUTH) =====
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

  // ===== NẠP TIỀN =====
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

  // ===== ADMIN: TẠO BÒ SỞ HỮU CHUNG =====
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
        dailyHarvestCount: 0,           // Đếm số lần vắt trong ngày
        lastResetDate: new Date().toDateString(), // Ngày dùng để reset số lần vắt
        nextHarvestAt: now              // Sẵn sàng vắt lần đầu
      });
      alert("Tạo bò thành công!");
      setNewCowName('');
    } catch (err) {
      alert("Lỗi tạo bò!");
    }
  };

  // ===== USER: MUA CỔ PHẦN =====
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

      const updates = {
        availableShares: cow.availableShares - percent,
        owners: newOwners,
        status: cow.availableShares - percent <= 0 ? 'full' : 'available'
      };

      await updateDoc(doc(db, 'cows', cow.id), updates);
      alert(`Mua thành công ${percent}% bò "${cow.name}"\nSố tiền: ${cost.toLocaleString()}đ`);
    } catch (err) {
      console.error(err);
      alert("Lỗi mua cổ phần!");
    }
  };

  // ===== LOGIC VẮT SỮA BÒ CHUẨN NGÀY & COOLDOWN =====
  const harvestSharedMilk = async (cow) => {
    const now = Date.now();
    const todayStr = new Date().toDateString();

    // 1. Kiểm tra và reset bộ đếm nếu sang ngày mới
    let dailyCount = cow.dailyHarvestCount || 0;
    if (cow.lastResetDate !== todayStr) {
      dailyCount = 0;
    }

    // 2. Giới hạn tối đa 2 lần vắt / ngày cho 1 con bò sữa
    if (dailyCount >= 2) {
      return alert(`🚫 Con bò này đã đạt giới hạn tối đa 2 lần vắt trong ngày hôm nay! Vui lòng chờ đến ngày mai.`);
    }

    // 3. Kiểm tra Cooldown thời gian giữa 2 lần vắt (12 tiếng)
    if (cow.nextHarvestAt && now < cow.nextHarvestAt) {
      const timeLeft = cow.nextHarvestAt - now;
      const hours = Math.floor(timeLeft / 3600000);
      const mins = Math.floor((timeLeft % 3600000) / 60000);
      return alert(`⏳ Chưa đến chu kỳ vắt sữa tiếp theo! Vui lòng đợi thêm ${hours} giờ ${mins} phút.`);
    }

    // 4. Kiểm tra độ no của bò (Phải $\ge 40%$)
    const currentHunger = cow.hunger ?? 100;
    if (currentHunger < 40) {
      return alert(`⚠️ Bò "${cow.name}" đang đói (${currentHunger}% độ no)! Cần cho bò ăn cỏ trước khi vắt sữa.`);
    }

    // 5. Tiến hành vắt sữa & chia tiền tự động
    const liters = Math.floor(Math.random() * 3) + 7; // Sản lượng mỗi lần: 7 - 9 lít (~16-18 lít/ngày)
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

      // Cập nhật trạng thái bò: Tăng số lần vắt trong ngày lên 1, đặt mốc cooldown 12 tiếng tiếp theo, giảm độ no
      await updateDoc(doc(db, 'cows', cow.id), {
        dailyHarvestCount: dailyCount + 1,
        lastResetDate: todayStr,
        nextHarvestAt: now + MILK_INTERVAL_HOURS * 60 * 60 * 1000,
        hunger: Math.max(10, currentHunger - 40)
      });

      alert(`🎉 Vắt sữa thành công!\n- Sản lượng lần này: ${liters} lít (Lần ${dailyCount + 1}/2 trong ngày)\n- Tổng doanh thu: ${totalMoney.toLocaleString()}đ\n- Đã chia tiền vào số dư các cổ đông.`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi vắt sữa!");
    }
  };

  const feedSharedCow = async (cow) => {
    if (inventory.grass <= 0) return alert("Bạn đã hết cỏ trong kho cá nhân! Hãy vào Cửa hàng mua thêm.");
    const newInventory = { ...inventory, grass: inventory.grass - 1 };
    setInventory(newInventory);
    
    const currentHunger = cow.hunger ?? 100;
    const newHunger = Math.min(100, currentHunger + 35);

    try {
      await updateDoc(doc(db, 'members', currentUser.cccd), { inventory: newInventory });
      await updateDoc(doc(db, 'cows', cow.id), { hunger: newHunger });
      alert(`🌿 Đã cho bò "${cow.name}" ăn 1 bó cỏ! Độ no hiện tại: ${newHunger}%`);
    } catch (err) {
      alert("Lỗi cho bò ăn!");
    }
  };

  // ===== TÍNH NĂNG CÁ NHÂN & CỬA HÀNG =====
  const feedCow = async (cowId) => {
    if (inventory.grass <= 0) return alert("Bạn đã hết cỏ! Hãy mua thêm ở cửa hàng.");
    const newInventory = { ...inventory, grass: inventory.grass - 1 };
    const newCows = cows.map(c => c.id === cowId ? { ...c, hunger: Math.min(100, c.hunger + 35) } : c);
    
    setInventory(newInventory);
    setCows(newCows);
    await updateDoc(doc(db, 'members', currentUser.cccd), { inventory: newInventory, cows: newCows });
    alert("Đã cho bò ăn cỏ!");
  };

  const harvestMilk = async (cowId) => {
    const cow = cows.find(c => c.id === cowId);
    if (cow.type !== 'milk') return alert("Chỉ bò sữa mới cho sữa!");
    
    const todayStr = new Date().toDateString();
    let dailyCount = cow.dailyHarvestCount || 0;
    if (cow.lastResetDate !== todayStr) dailyCount = 0;

    if (dailyCount >= 2) return alert("Con bò này đã đạt giới hạn tối đa 2 lần vắt trong ngày hôm nay!");
    if (cow.hunger < 40) return alert("Bò đang đói (dưới 40% độ no), hãy cho ăn trước!");
    
    const newInventory = { ...inventory, milk: inventory.milk + 8 };
    const newCows = cows.map(c => c.id === cowId ? { 
      ...c, 
      hunger: Math.max(10, c.hunger - 40),
      dailyHarvestCount: dailyCount + 1,
      lastResetDate: todayStr
    } : c);

    setInventory(newInventory);
    setCows(newCows);
    await updateDoc(doc(db, 'members', currentUser.cccd), { inventory: newInventory, cows: newCows });
    alert(`Thu hoạch thành công +8 lít sữa tươi vào kho cá nhân! (Lần ${dailyCount + 1}/2 trong ngày)`);
  };

  const buyItem = async (itemKey) => {
    let cost = 0;
    if (itemKey === 'milkCow') cost = shopPrices.milkCow.price;
    if (itemKey === 'goldCow') cost = shopPrices.goldCow.price;
    if (itemKey === 'grass') cost = shopPrices.grass.price;

    if (balance < cost) return alert("Số dư không đủ!");
    const newBalance = balance - cost;
    setBalance(newBalance);

    let newInventory = { ...inventory };
    let newCows = [...cows];

    if (itemKey === 'grass') {
      newInventory.grass += 20;
    } else if (itemKey === 'milkCow') {
      newCows.push({ id: Date.now(), name: `Bò Sữa #${newCows.length + 1}`, tag: `BV-100${newCows.length + 1}`, type: 'milk', hunger: 100, dailyHarvestCount: 0 });
    } else if (itemKey === 'goldCow') {
      newCows.push({ id: Date.now(), name: `Bò Vàng #${newCows.length + 1}`, tag: `BV-200${newCows.length + 1}`, type: 'gold', hunger: 100 });
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
      console.error(err);
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

  // ===== HÀNH ĐỘNG ADMIN =====
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

  // ===== GIAO DIỆN ĐĂNG NHẬP / ĐĂNG KÝ =====
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

  // ===== GIAO DIỆN ADMIN =====
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
          {/* Tạo bò sở hữu chung */}
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

          {/* Danh sách bò sở hữu chung */}
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
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#94a3b8' }}>Giá trị: {cow.totalPrice?.toLocaleString()}đ</p>
                {cow.owners?.length > 0 && (
                  <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1' }}>
                    Chủ sở hữu: {cow.owners.map(o => `${o.fullName} (${o.percent}%)`).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Thành viên */}
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>👥 Thành viên</h3>
          <div style={{ background: '#1e293b', borderRadius: 20, border: '1px solid #334155', overflow: 'hidden', marginBottom: 36 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                  <th style={{ padding: 14, textAlign: 'left' }}>Họ tên</th>
                  <th style={{ padding: 14, textAlign: 'left' }}>CCCD</th>
                  <th style={{ padding: 14, textAlign: 'left' }}>Trạng thái</th>
                  <th style={{ padding: 14, textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: 14 }}>{m.fullName}</td>
                    <td style={{ padding: 14, color: '#34d399', fontFamily: 'monospace' }}>{m.cccd}</td>
                    <td style={{ padding: 14 }}>
                      <span style={{ background: m.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: m.status === 'approved' ? '#34d399' : '#fbbf24', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{m.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                    </td>
                    <td style={{ padding: 14, textAlign: 'right' }}>
                      {m.status !== 'approved' && <button onClick={() => approveMember(m.id)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, marginRight: 8, cursor: 'pointer' }}>Duyệt</button>}
                      <button onClick={() => rejectMember(m.id, m.cccd)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lệnh nạp tiền */}
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>💰 Lệnh nạp tiền</h3>
          <div style={{ background: '#1e293b', borderRadius: 20, border: '1px solid #334155', overflow: 'hidden', marginBottom: 36 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8' }}>
                  <th style={{ padding: 14, textAlign: 'left' }}>CCCD</th>
                  <th style={{ padding: 14, textAlign: 'left' }}>Số tiền</th>
                  <th style={{ padding: 14, textAlign: 'left' }}>Thời gian</th>
                  <th style={{ padding: 14, textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.filter(d => d.status === 'pending').length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Không có lệnh chờ</td></tr>
                ) : pendingDeposits.filter(d => d.status === 'pending').map(dep => (
                  <tr key={dep.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: 14, fontFamily: 'monospace', color: '#34d399' }}>{dep.cccd}</td>
                    <td style={{ padding: 14, color: '#fbbf24', fontWeight: 700 }}>+{Number(dep.amount).toLocaleString()}đ</td>
                    <td style={{ padding: 14 }}>{dep.time}</td>
                    <td style={{ padding: 14, textAlign: 'right' }}>
                      <button onClick={() => approveDeposit(dep.id, dep.cccd, dep.amount)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>Xác nhận</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Điều chỉnh giá */}
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>⚙️ Điều chỉnh giá</h3>
          <div style={{ background: '#1e293b', borderRadius: 20, border: '1px solid #334155', padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Giá Bò Sữa</label>
                <input type="number" value={editingPrices.milkCow?.price || 0} onChange={e => setEditingPrices({...editingPrices, milkCow: {...editingPrices.milkCow, price: Number(e.target.value)}})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 10, borderRadius: 10, color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Giá Bò Vàng</label>
                <input type="number" value={editingPrices.goldCow?.price || 0} onChange={e => setEditingPrices({...editingPrices, goldCow: {...editingPrices.goldCow, price: Number(e.target.value)}})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 10, borderRadius: 10, color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Giá Cỏ</label>
                <input type="number" value={editingPrices.grass?.price || 0} onChange={e => setEditingPrices({...editingPrices, grass: {...editingPrices.grass, price: Number(e.target.value)}})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 10, borderRadius: 10, color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>Giá thu mua sữa / lít</label>
                <input type="number" value={editingPrices.milkSellPrice || 0} onChange={e => setEditingPrices({...editingPrices, milkSellPrice: Number(e.target.value)})}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 10, borderRadius: 10, color: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={saveNewPrices} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>Lưu bảng giá</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== GIAO DIỆN USER =====
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
        <button onClick={() => setActiveTab('farm')} style={{ padding: '14px 18px', background: 'transparent', border: 'none', borderBottom: activeTab === 'farm' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'farm' ? '#34d399' : '#94a3b8', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🐄 Trang trại cá nhân</button>
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

        {/* TAB BÒ CỦA TÔI (Sở hữu chung) */}
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
                  const hunger = cow.hunger ?? 100;
                  
                  const canHarvestTime = !cow.nextHarvestAt || now >= cow.nextHarvestAt;
                  const isUnderDailyLimit = dailyCount < 2;
                  const canHarvest = canHarvestTime && isUnderDailyLimit && hunger >= 40;
                  
                  const timeLeft = cow.nextHarvestAt ? Math.max(0, cow.nextHarvestAt - now) : 0;
                  const hoursLeft = Math.floor(timeLeft / 3600000);
                  const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

                  let statusText = 'Sẵn sàng vắt sữa';
                  if (!isUnderDailyLimit) statusText = 'Đã đủ 2 lần/ngày (Hẹn mai)';
                  else if (!canHarvestTime) statusText = `Chờ chu kỳ: ${hoursLeft}h ${minsLeft}p`;
                  else if (hunger < 40) statusText = 'Bò đang đói (<40%)';

                  return (
                    <div key={cow.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{cow.name}</h4>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                            Bạn sở hữu: <strong style={{ color: '#34d399' }}>{myShare?.percent}%</strong> · Đã vắt hôm nay: <strong style={{ color: '#60a5fa' }}>{dailyCount}/2 lần</strong>
                          </p>
                        </div>
                        <span style={{ background: canHarvest ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: canHarvest ? '#34d399' : '#fbbf24', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {statusText}
                        </span>
                      </div>

                      {/* Thanh độ no của bò chung */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                          <span>Độ no của bò chung</span>
                          <span style={{ color: hunger < 40 ? '#f87171' : '#34d399' }}>{hunger}%</span>
                        </div>
                        <div style={{ height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${hunger}%`, height: '100%', background: hunger < 40 ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>

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

        {/* TAB TRANG TRẠI CÁ NHÂN */}
        {activeTab === 'farm' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Đàn bò cá nhân của bạn ({cows.length})</h3>
            {cows.length === 0 ? (
              <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, textAlign: 'center', color: '#64748b' }}>Bạn chưa có bò cá nhân. Hãy vào Cửa hàng để mua.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                {cows.map(cow => {
                  const todayStr = new Date().toDateString();
                  const dailyCount = cow.lastResetDate === todayStr ? (cow.dailyHarvestCount || 0) : 0;
                  const canHarvest = dailyCount < 2 && cow.hunger >= 40;

                  return (
                    <div key={cow.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{cow.name}</h4>
                      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#94a3b8' }}>Tag: {cow.tag} · Đã vắt: {dailyCount}/2 lần hôm nay</p>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                          <span>Độ no (Cần &gt;= 40)</span>
                          <span style={{ color: cow.hunger < 40 ? '#f87171' : '#34d399' }}>{cow.hunger}%</span>
                        </div>
                        <div style={{ height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${cow.hunger}%`, height: '100%', background: cow.hunger < 40 ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => feedCow(cow.id)} style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🌿 Cho ăn</button>
                        {cow.type === 'milk' && (
                          <button onClick={() => harvestMilk(cow.id)} style={{ flex: 1, background: canHarvest ? '#059669' : '#334155', color: '#fff', border: 'none', padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: canHarvest ? 'pointer' : 'not-allowed', opacity: canHarvest ? 1 : 0.6 }}>🥛 Thu sữa</button>
                        )}
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
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>📦 Kho của bạn</h3>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div><span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Cỏ</span><span style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{inventory.grass} bó</span></div>
                  <div><span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Sữa</span><span style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa' }}>{inventory.milk} lít</span></div>
                </div>
                {inventory.milk > 0 && (
                  <button onClick={sellMilk} style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
                    Bán sữa ({inventory.milk}L = {(inventory.milk * shopPrices.milkSellPrice).toLocaleString()}đ)
                  </button>
                )}
              </div>
            </div>
            
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>🛒 Cửa hàng</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{shopPrices.milkCow.name}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8' }}>{shopPrices.milkCow.desc}</p>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginBottom: 14 }}>{shopPrices.milkCow.price.toLocaleString()}đ</div>
                <button onClick={() => buyItem('milkCow')} style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: 10, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Mua Bò Sữa</button>
              </div>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{shopPrices.goldCow.name}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8' }}>{shopPrices.goldCow.desc}</p>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginBottom: 14 }}>{shopPrices.goldCow.price.toLocaleString()}đ</div>
                <button onClick={() => buyItem('goldCow')} style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: 10, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Mua Bò Vàng</button>
              </div>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 20 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{shopPrices.grass.name}</h4>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8' }}>{shopPrices.grass.desc}</p>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginBottom: 14 }}>{shopPrices.grass.price.toLocaleString()}đ</div>
                <button onClick={() => buyItem('grass')} style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: 10, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>Mua Cỏ</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB CAMERA TRỰC TIẾP BA VÌ */}
        {activeTab === 'camera' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>📹 Camera Trực Tiếp Nông Trại Bò Vàng (Ba Vì)</h3>
              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span> LIVE 24/7
              </span>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, overflow: 'hidden', padding: 16 }}>
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                >
                  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ thẻ video.
                </video>
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 8, fontSize: 12, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}>
                  🟢 Camera #01 · Trực tiếp từ Đồng cỏ Ba Vì · 1080p
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Khu chuồng trại cao sản Ba Vì - Camera #01</h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Trạng thái: Đang phát trực tiếp từ đồng cỏ Ba Vì. Bò đang thong thả gặm cỏ tươi.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => alert("Đang kết nối góc máy chuồng Bò Vàng Giống...")} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>📹 Góc máy 2</button>
                  <button onClick={() => alert("Đang kết nối góc máy khu vắt sữa...")} style={{ background: '#334155', color: '#34d399', border: 'none', padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🥛 Góc máy Vắt sữa</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nạp tiền */}
      {showDepositModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, textAlign: 'center' }}>Nạp tiền</h3>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>Chọn nhanh:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[100000, 500000, 1000000, 2000000, 5000000].map(a => (
                  <button key={a} onClick={() => setDepositAmount(a.toString())} style={{ background: depositAmount === a.toString() ? '#10b981' : '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px 14px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>{a.toLocaleString()}đ</button>
                ))}
              </div>
            </div>
            <input type="number" placeholder="Nhập số tiền" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 12, color: '#fff', marginBottom: 16, boxSizing: 'border-box' }} />
            {qrAmount >= 10000 && (
              <div style={{ background: '#0f172a', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'center' }}>
                <img src={qrUrl} alt="QR" style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 8 }} />
                <div style={{ marginTop: 12, textAlign: 'left', fontSize: 13, lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}><strong>Ngân hàng:</strong> Techcombank</p>
                  <p style={{ margin: 0 }}><strong>STK:</strong> 991169999999</p>
                  <p style={{ margin: 0 }}><strong>Chủ TK:</strong> Ngô Hoàng Vũ</p>
                  <p style={{ margin: 0, color: '#34d399' }}><strong>Nội dung:</strong> {transferContent}</p>
                  <p style={{ margin: 0, color: '#fbbf24' }}><strong>Số tiền:</strong> {qrAmount.toLocaleString()}đ</p>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowDepositModal(false); setDepositAmount(''); }} style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: 13, borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
              <button onClick={requestDeposit} style={{ flex: 1, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', padding: 13, borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Tôi đã chuyển</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}