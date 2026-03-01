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
const Dashboard = () => {
    const [stats, setStats] = useState({ atletas: 0, equipes: 0, medalhas: 0 });
    const [hasLegacyData, setHasLegacyData] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        const legacyAtletas = JSON.parse(localStorage.getItem('atletas') || '[]');
        const legacyEquipes = JSON.parse(localStorage.getItem('equipes') || '[]');
        if (legacyAtletas.length > 0 || legacyEquipes.length > 0) {
            setHasLegacyData(true);
        }
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/atletas');
            const atletas = await response.json();
            const eqResponse = await fetch('http://localhost:3001/api/equipes');
            const equipes = await eqResponse.json();
            setStats({ atletas: atletas.length, equipes: equipes.length, medalhas: 0 });
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        }
    };

    const handleMigration = async () => {
        if (!window.confirm("Deseja migrar seus dados antigos para o novo banco de dados?")) return;

        setIsMigrating(true);
        try {
            const legacyAtletas = JSON.parse(localStorage.getItem('atletas') || '[]');
            const legacyEquipes = JSON.parse(localStorage.getItem('equipes') || '[]');

            const result = await api.migrar({
                atletas: legacyAtletas,
                equipes: legacyEquipes
            });

            if (result.success) {
                alert(`Migração concluída! ${result.results.equipesMigradas} equipes e ${result.results.atletasMigrados} atletas migrados.`);
                localStorage.removeItem('atletas');
                localStorage.removeItem('equipes');
                setHasLegacyData(false);
                fetchStats();
            } else {
                alert("Erro na migração: " + result.error);
            }
        } catch (error) {
            alert("Erro na migração: " + error.message);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem' }}>Dashboard Compet System</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Bem-vindo ao sistema de gestão de competições.</p>
                </div>
                {hasLegacyData && (
                    <button
                        className="btn btn-primary"
                        onClick={handleMigration}
                        disabled={isMigrating}
                        style={{ background: 'var(--accent)', color: '#000' }}
                    >
                        {isMigrating ? 'Migrando...' : 'Recuperar Dados Antigos'}
                    </button>
                )}
            </div>

            <div className="stat-grid">
                <div className="glass-card">
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Atletas Inscritos</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.atletas}</p>
                </div>
                <div className="glass-card">
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Equipes Registradas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.equipes}</p>
                </div>
                <div className="glass-card">
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Medalhas Distribuídas</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800' }}>{stats.medalhas}</p>
                </div>
            </div>
        </div>
    );
};

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
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>COMPET SYSTEM</h2>
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
                    <p>© 2026 Compet System</p>
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
