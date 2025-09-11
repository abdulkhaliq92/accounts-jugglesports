"use client";

import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom"; // ← v5 router hook
import "./Header.css";

const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const routerHistory = useHistory(); // ← use this instead of global `history`

  useEffect(() => {
    try {
      const raw = localStorage.getItem("profile");
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Close dropdown on outside click / Esc
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e) => e.key === "Escape" && setIsMenuOpen(false);
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [isMenuOpen]);

  const logout = () => {
    localStorage.removeItem("profile");
    setUser(null);
    setIsMenuOpen(false);
    // Optionally route to home/login:
    routerHistory.push("/login");
  };

  const handleLogin = () => {
    // If you prefer SPA navigation:
    // routerHistory.push("/login");
    window.location.href = "/login";
  };

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  // Guest header
  // if (!user) {
  //   return (
  //     <header className="guest-header">
  //       <div className="header-container">
  //         <div className="logo">
  //           <h2>InvoiceApp</h2>
  //         </div>

  //         <nav className="nav-links" aria-label="Primary">
  //           <a href="#features">Features</a>
  //           <a href="#pricing">Pricing</a>
  //           <a href="#about">About</a>
  //           <a href="#contact">Contact</a>
  //         </nav>

  //         <button onClick={handleLogin} className="get-started-btn">
  //           Get Started
  //         </button>
  //       </div>
  //     </header>
  //   );
  // }

  // Authenticated header
  if(!user){
    return(<></>)
  }
  else{
  return (
    <header className="auth-header">
      <div className="header-container">
        <div className="logo">
          <img
            style={{ width: "400px", cursor: "pointer" }}
            onClick={() => routerHistory.push("/")}   // ← fixed
            src="https://i.postimg.cc/RFzbLWZ1/juggle-sports-logo.png"
            alt="arc-invoice"
            crossOrigin="anonymous"
          />
        </div>

        <nav className="main-nav" aria-label="App">
          <a href="/dashboard" className="nav-item">
            Dashboard
          </a>
          <a href="/invoice" className="nav-item">
            Create Invoice
          </a>
          <a href="/invoices" className="nav-item">
            List All Invoices
          </a>
          {/* <a href="/customer" className="nav-item">
            Add new Customer
          </a> */}
        </nav>

        <div className="user-menu" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="user-avatar"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="User menu"
          >
            {(user?.result?.name || "U").charAt(0)}
          </button>

          {isMenuOpen && (
            <div className="dropdown-menu">
              {/* Clickable overlay to close menu */}
              <div className="dropdown-overlay" onClick={() => setIsMenuOpen(false)} />

              <div className="menu-content" role="menu">
                <div className="user-info">
                  <span className="user-name">{user?.result?.name || "User"}</span>
                  <span className="user-email">{user?.result?.email || ""}</span>
                </div>

                {/* <div className="menu-divider" /> */}

                {/* <button className="menu-item" onClick={() => setIsMenuOpen(false)} role="menuitem">
                  Profile
                </button>
                <button className="menu-item" onClick={() => setIsMenuOpen(false)} role="menuitem">
                  Settings
                </button> */}

                <div className="menu-divider" />

                <button className="menu-item logout" onClick={logout} role="menuitem">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
};

export default Header;

/* -------------------------------------------
   React Router v6?
   -------------------------------------------
   Replace:
     import { useHistory } from "react-router-dom";
     const routerHistory = useHistory();
     onClick={() => routerHistory.push("/")}

   With:
     import { useNavigate } from "react-router-dom";
     const navigate = useNavigate();
     onClick={() => navigate("/")}
*/
