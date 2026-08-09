import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <i className="fas fa-tasks"></i>
          <span>ProjectFlow</span>
        </div>
        <div className="nav-right">
          <div className="user-menu">
            <img
              src={user?.avatar || 'https://via.placeholder.com/40'}
              alt="User"
              className="user-avatar"
            />
            <span>{user?.name || 'User'}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
