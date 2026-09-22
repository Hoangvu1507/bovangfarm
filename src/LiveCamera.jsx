import React, { useState, useEffect } from 'react';

export default function LiveCamera() {
  const cameras = [
    {
      title: "Khu chuồng trại cao sản Ba Vì - Camera #01",
      status: "Trạng thái: Đang phát trực tiếp từ đồng cỏ Ba Vì. Bò đang thong thả gặm cỏ tươi.",
      overlay: "🟢 Camera #01 · Trực tiếp từ Đồng cỏ Ba Vì · 1080p (FPS: 30)",
      image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=1200&auto=format&fit=crop"
    },
    {
      title: "Khu chuồng trại cao sản Ba Vì - Camera #02 (Toàn cảnh)",
      status: "Trạng thái: Góc nhìn toàn cảnh đồng cỏ phía Tây, gió nhẹ, thời tiết đẹp.",
      overlay: "🟢 Camera #02 · Góc toàn cảnh · 1080p (FPS: 30)",
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

  // Cơ chế tự động đổi góc sau 10 giây để tránh bò che cứng màn hình
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

  const handleManualSwitch = (index) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 300);
  };

  const currentCam = cameras[currentIndex];

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', border: '1px solid #333', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#181818', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', fontSize: '14px', fontWeight: '500' }}>
        <span>📹 Camera Trực Tiếp Nông Trại Bò Vàng (Ba Vì)</span>
        <div style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#ff3b30', borderRadius: '50%', display: 'inline-block' }}></span> LIVE 24/7
        </div>
      </div>

      {/* Màn hình video có hiệu ứng rung nhẹ camera an ninh */}
      <div style={{ position: 'relative', width: '100%', height: '480px', background: '#000', overflow: 'hidden' }}>
        <img 
          src={currentCam.image} 
          alt="Live Feed" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: fade ? 1 : 0.2, transition: 'opacity 0.3s ease-in-out' }} 
        />
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0, 0, 0, 0.6)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {currentCam.overlay}
        </div>
      </div>

      {/* Thanh điều khiển dưới */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{currentCam.title}</div>
          <div style={{ fontSize: '13px', color: '#aaa' }}>{currentCam.status}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {cameras.map((cam, idx) => (
            <button 
              key={idx}
              onClick={() => handleManualSwitch(idx)}
              style={{
                background: currentIndex === idx ? '#0066cc' : '#2a2a2a',
                color: '#fff',
                border: currentIndex === idx ? '1px solid #0077ff' : '1px solid #444',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Góc máy {idx + 1}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}