import React, { useState } from 'react';
import Checkout from './pages/Checkout';
import AdminPayments from './pages/AdminPayments';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import AuthModal from './components/AuthModal';

export default function App() {
    const [currentView, setCurrentView] = useState('checkout'); // 'checkout' | 'adminPayments' | 'dashboard' | 'reports'
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [loggedUser, setLoggedUser] = useState(null);

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* Navigation Header */}
            <header style={{ background: '#0f172a', color: '#fff', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        B
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>BookNest Portal (Minh Anh)</span>
                </div>

                <nav style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setCurrentView('checkout')}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: currentView === 'checkout' ? '#2563eb' : 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        📱 Checkout QR
                    </button>

                    <button
                        onClick={() => setCurrentView('adminPayments')}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: currentView === 'adminPayments' ? '#2563eb' : 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        💳 Quản Lý Thanh Toán
                    </button>

                    <button
                        onClick={() => setCurrentView('dashboard')}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: currentView === 'dashboard' ? '#2563eb' : 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        📊 Dashboard
                    </button>

                    <button
                        onClick={() => setCurrentView('reports')}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: currentView === 'reports' ? '#2563eb' : 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        📈 Báo Cáo & Export
                    </button>

                    <button
                        onClick={() => setShowAuthModal(true)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        {loggedUser ? `👤 ${loggedUser.name || 'Tài Khoản'}` : '🔐 Đăng Nhập / Captcha'}
                    </button>
                </nav>
            </header>

            {/* Main Content Area */}
            <main>
                {currentView === 'checkout' && <Checkout />}
                {currentView === 'adminPayments' && <AdminPayments />}
                {currentView === 'dashboard' && <Dashboard />}
                {currentView === 'reports' && <Reports />}
            </main>

            {/* Auth / Captcha Modal Component (DB-39) */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onAuthSuccess={(user) => {
                    setLoggedUser(user);
                    alert(`Đăng nhập thành công với mã xác thực Captcha! Chào mừng ${user.name || 'bạn'}`);
                }}
            />
        </div>
    );
}
