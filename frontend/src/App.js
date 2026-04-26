import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewAsset from './pages/NewAsset';
import Analyze from './pages/Analyze';
import CaseDetail from './pages/CaseDetail';
import Cases from './pages/Cases';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="brand-icon">⚡</div>
          SportSentry AI
        </div>
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/analyze"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Analyze
          </NavLink>
          <NavLink
            to="/cases"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Cases
          </NavLink>
          <NavLink
            to="/assets/new"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            + Register Asset
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets/new" element={<NewAsset />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
