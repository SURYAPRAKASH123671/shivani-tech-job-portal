import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { isAuthenticated, role, email, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/')
  }

  return (
    <header className="relative border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg font-semibold text-navy">
          Shivani <span className="text-amber">Technologies</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-navy md:hidden"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav
          className={`${menuOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-40 flex-col gap-4 border-b border-line bg-surface px-6 py-4 text-sm font-medium text-ink shadow-sm md:static md:flex md:w-auto md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <Link to="/jobs" onClick={closeMenu} className="hover:text-navy-light">
            Find jobs
          </Link>

          {isAuthenticated && role === 'CANDIDATE' && (
            <>
              <Link to="/candidate/dashboard" onClick={closeMenu} className="hover:text-navy-light">
                Dashboard
              </Link>
              <Link to="/candidate/profile" onClick={closeMenu} className="hover:text-navy-light">
                My profile
              </Link>
              <Link to="/applications" onClick={closeMenu} className="hover:text-navy-light">
                My applications
              </Link>
            </>
          )}

          {isAuthenticated && role === 'EMPLOYER' && (
            <Link to="/employer/dashboard" onClick={closeMenu} className="hover:text-navy-light">
              Employer dashboard
            </Link>
          )}

          {isAuthenticated && role === 'EMPLOYEE' && (
            <Link to="/employee/dashboard" onClick={closeMenu} className="hover:text-navy-light">
              Dashboard
            </Link>
          )}

          {isAuthenticated && role === 'ADMIN' && (
            <>
              <Link to="/admin/dashboard" onClick={closeMenu} className="hover:text-navy-light">
                Dashboard
              </Link>
              <Link to="/admin/companies" onClick={closeMenu} className="hover:text-navy-light">
                Companies
              </Link>
              <Link to="/admin/jobs" onClick={closeMenu} className="hover:text-navy-light">
                All jobs
              </Link>
              <Link to="/admin/lookups" onClick={closeMenu} className="hover:text-navy-light">
                Categories &amp; skills
              </Link>
              <Link to="/admin/employees" onClick={closeMenu} className="hover:text-navy-light">
                Employees
              </Link>
              <Link to="/admin/notifications" onClick={closeMenu} className="hover:text-navy-light">
                Mail &amp; SMS
              </Link>
            </>
          )}

          {isAuthenticated ? (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <span className="text-muted">{email}</span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-line px-3 py-1.5 text-ink hover:border-navy hover:text-navy"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <Link to="/login" onClick={closeMenu} className="hover:text-navy-light">
                Log in
              </Link>
              <Link
                to="/register/candidate"
                onClick={closeMenu}
                className="rounded-md bg-navy px-4 py-1.5 text-white hover:bg-navy-light"
              >
                Get started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
