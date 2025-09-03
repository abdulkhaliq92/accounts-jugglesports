// import React, { useState, useEffect } from 'react'
// import { useHistory, useLocation } from 'react-router-dom'
// import { useDispatch } from 'react-redux'
// import decode from 'jwt-decode'
// import styles from './Header.module.css'

// import Button from '@material-ui/core/Button';
// import ClickAwayListener from '@material-ui/core/ClickAwayListener';
// import Grow from '@material-ui/core/Grow';
// import Paper from '@material-ui/core/Paper';
// import Popper from '@material-ui/core/Popper';
// import MenuItem from '@material-ui/core/MenuItem';
// import MenuList from '@material-ui/core/MenuList';
// import { makeStyles } from '@material-ui/core/styles';
// import Avatar from '@material-ui/core/Avatar';
// import Logo from '../svgIcons/Logo'
// // import axios from 'axios'


// const useStyles = makeStyles((theme) => ({
//   root: {
//     display: 'flex',
//   },
//   paper: {
//     marginRight: theme.spacing(2),
//   },
// }));



// const Header = () => {
//     const dispatch = useDispatch()
//     const [user, setUser] = useState(JSON.parse(localStorage.getItem('profile')))
//     const history = useHistory()
//     const location = useLocation()


//     useEffect(() => {
//         setUser(JSON.parse(localStorage.getItem('profile')))
//     },[location])

    
//     //GET REPO INFO FROM GITHUB
//     // useEffect(() => {
//     //   getMetaData()
//     // },[])


//     // const getMetaData = async() => {
//     //   const response = await axios.get('https://api.github.com/repos/panshak/arc')
//     //       // console.log(response.data);
//     // }

//     const logout =() => {
//         dispatch({ type: 'LOGOUT' })
//         history.push('/')
//         setUser(null)
//     }  


//     useEffect(()=> {
//         const token = user?.token
//         // setUser(JSON.parse(localStorage.getItem('profile')))
//         //If token expires, logout the user
//         if(token) {
//             const decodedToken = decode(token)
//             if(decodedToken.exp * 1000 < new Date().getTime()) logout()
//         }
//         // eslint-disable-next-line
//     }, [location, user]) //when location changes, set the user





//   const classes = useStyles();
//   const [open, setOpen] = React.useState(false);
//   const anchorRef = React.useRef(null);

//   const handleToggle = () => {
//     setOpen((prevOpen) => !prevOpen);
//   };

//   const handleClose = (event ) => {
//     if (anchorRef.current && anchorRef.current.contains(event.target)) {
//       return;
//     }

//     setOpen(false);
//   };


//   const openLink =(link) => {
//       history.push(`/${link}`)
//       setOpen(false);
//   }

//   function handleListKeyDown(event) {
//     if (event.key === 'Tab') {
//       event.preventDefault();
//       setOpen(false);
//     }
//   }

//   // return focus to the button when we transitioned from !open -> open
//   const prevOpen = React.useRef(open);
//   React.useEffect(() => {
//     if (prevOpen.current === true && open === false) {
//       anchorRef.current.focus();
//     }

//     prevOpen.current = open;
//   }, [open]);




//     if(!user) return (
//         <div className={styles.header2}>
//          {/* <img style={{width: '200px', cursor: 'pointer'}} onClick={()=> history.push('/')} src="https://i.postimg.cc/RFzbLWZ1/juggle-sports-logo.png" alt="arc-invoice" /> */}
//          <Logo onClick={()=> history.push('/')} width={200} />
//         <button onClick={()=> history.push('/login')} className={styles.login}>Get started</button>
//         </div>
//     )
//     return (
//         <div className={styles.header}>
//             <div className={classes.root}>
//       <div>
//         <Button
//           ref={anchorRef}
//           aria-controls={open ? 'menu-list-grow' : undefined}
//           aria-haspopup="true"
//           onClick={handleToggle}
//         >
//           <Avatar style={{backgroundColor: '#1976D2'}}>{user?.result?.name?.charAt(0)}</Avatar>
//         </Button>
//         <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
//           {({ TransitionProps, placement }) => (
//             <Grow
//               {...TransitionProps}
//               style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
//             >
//               <Paper elevation={3}>
//                 <ClickAwayListener onClickAway={handleClose}>
//                   <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={handleListKeyDown} >
//                     <MenuItem onClick={() => openLink('settings') }>{(user?.result?.name).split(" ")[0]}</MenuItem>
//                     <MenuItem onClick={()=> logout()} >Logout</MenuItem>
//                   </MenuList>
//                 </ClickAwayListener>
//               </Paper>
//             </Grow>
//           )}
//         </Popper>
//       </div>
//     </div>


//         </div>
//     )
// }

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

                <div className="menu-divider" />

                <button className="menu-item" onClick={() => setIsMenuOpen(false)} role="menuitem">
                  Profile
                </button>
                <button className="menu-item" onClick={() => setIsMenuOpen(false)} role="menuitem">
                  Settings
                </button>

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
