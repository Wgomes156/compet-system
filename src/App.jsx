import { useState, useEffect } from 'react'
import {
    Users,
    UserCircle,
    Trophy,
    LayoutDashboard,
    FileText,
    ShieldAlert,
    Menu,
    X
} from 'lucide-react'
import Equipes from './pages/Equipes'
import Atletas from './pages/Atletas'
import Relatorios from './pages/Relatorios'
import Chaveamento from './pages/Chaveamento'

// Placeholder para futuras páginas
const Dashboard = () => (
    <div className="animate-fade-in">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Dashboard Judô</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '3rem' }}>Bem-vindo ao sistema de gestão de competições.</p>
        <div className="stat-grid">
            <div className="glass-card">
                <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Atletas Inscritos</h3>
                <p style={{ fontSize: '2rem', fontWeight: '800' }}>0</p>
            </div>
            <div className="glass-card">
                <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Equipes Registradas</h3>
                <p style={{ fontSize: '2rem', fontWeight: '800' }}>0</p>
            </div>
            <div className="glass-card">
                <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Medalhas Distribuídas</h3>
                <p style={{ fontSize: '2rem', fontWeight: '800' }}>0</p>
            </div>
        </div>
    </div>
)

function App() {
    const [activePage, setActivePage] = useState('dashboard')

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'equipes', label: 'Equipes', icon: <Users size={20} /> },
        { id: 'atletas', label: 'Atletas', icon: <UserCircle size={20} /> },
        { id: 'chaves', label: 'Chaveamento', icon: <Trophy size={20} /> },
        { id: 'relatorios', label: 'Relatórios', icon: <FileText size={20} /> },
    ]

    return (
        <div style={{ display: 'flex' }}>
            <aside className="sidebar">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '3rem',
                    padding: '0 0.5rem'
                }}>
                    <Trophy color="var(--accent)" size={32} />
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>JUDÔ COMPET</h2>
                </div>

                <nav style={{ flex: 1 }}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{
                    marginTop: 'auto',
                    padding: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.8rem',
                    color: 'var(--text-dim)'
                }}>
                    <p>© 2026 Judô Compet System</p>
                </div>
            </aside>

            <main className="main-content">
                {activePage === 'dashboard' && <Dashboard />}
                {activePage === 'equipes' && <Equipes />}
                {activePage === 'atletas' && <Atletas />}
                {activePage === 'relatorios' && <Relatorios />}
                {activePage === 'chaves' && <Chaveamento />}
            </main>
        </div>
    )
}

export default App
