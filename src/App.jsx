import { useState } from 'react';
import { Users, Package, ShoppingCart } from 'lucide-react';
import ClientesTab from './components/ClientesTab';
import ArticulosTab from './components/ArticulosTab';
import PedidosTab from './components/PedidosTab';
import './index.css';

// 1. IMPORTAR EL LOGO
import logoAMM from './assets/logoAMM.png'; 

function App() {
  const [activeTab, setActiveTab] = useState('clientes');

  const tabs = [
    { id: 'clientes', label: 'Clientes', icon: Users, component: ClientesTab },
    { id: 'articulos', label: 'Artículos', icon: Package, component: ArticulosTab },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, component: PedidosTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="app-container">
      <header className="app-header">
        {/* 2. HEADER ADAPTADO CON EL LOGO */}
        <div className="header-logo-container">
          
          {/* QUITAMOS EL IMG FUERA DEL H1 */}
          <img src={logoAMM} alt="Logo AMM" className="app-logo" />
          
          <h1>Sistema de Gestión de Inventario y Pedidos</h1>
        </div>
        {/* Fin del header adaptado */} 
      </header>

      <main className="main-content">
        <div className="tabs-container">
          <nav className="tabs-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="tab-content">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;