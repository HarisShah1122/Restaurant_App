
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm p-3 mb-5 bg-body rounded animate__animated animate__slideInDown">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">


          <svg width="80" height="80" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="circlePath" d="M150,150 m-120,0 a120,120 0 1,1 240,0 a120,120 0 1,1 -240,0" />
            </defs>

            <style>
              {`
      .text-rotate text {
        font-size: 8px;
        fill: white;
        font-family: Arial, sans-serif;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .rotate-text {
        animation: rotate 20s linear infinite;
        transform-origin: 150px 150px;
      }

      @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .glow {
        stroke: white;
        stroke-width: 1.5;
        animation: glow 2s ease-in-out infinite alternate;
      }

      @keyframes glow {
        from { stroke: white; }
        to { stroke: #ffd700; }
      }
    `}
            </style>

            <circle cx="150" cy="150" r="90" fill="gold" stroke="green" strokeWidth="4" />

            {/* Fork icon */}
            <g className="glow">
              <path d="M130 110 L130 170 M127 110 L133 110 M127 115 L133 115 M127 120 L133 120"
                stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Knife icon */}
            <g className="glow">
              <path d="M170 110 Q175 140 170 170" stroke="white" strokeWidth="2" fill="none" />
              <path d="M170 170 L173 173 L167 173 Z" fill="white" />
            </g>

            {/* Circulating text */}
            <g className="rotate-text">
              <text>
                <textPath href="#circlePath" startOffset="0%">
                  ★ Delish Dine • Tasty Meals • Great Ambience •
                </textPath>
              </text>
            </g>
          </svg>


        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/restaurant">All Restaurants</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/karachi">Karachi Restaurants</Link>
            </li>
            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login <i className="bi bi-box-arrow-in-right"></i></Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register <i className="bi bi-person-plus"></i></Link>
                </li>
              </>
            )}
            {isAuthenticated && (
              <li className="nav-item">
                <button className="nav-link btn btn-link" onClick={handleLogout}>
                  Logout <i className="bi bi-box-arrow-right"></i>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;