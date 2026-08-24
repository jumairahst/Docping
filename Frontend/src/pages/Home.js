import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthProfile } from '../authProfile';

function Home() {
  const {
    authUser: user,
    displayName: profileName,
    role,
    authLoading,
  } = useAuthProfile();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container">
          <a
            className="navbar-brand fw-bold fs-3"
            href="/"
            style={{ textDecoration: 'none' }}
          >
            🩺{' '}
            <span style={{ color: '#074481' }}>
              Doc
            </span>
            <span
              style={{
                color: '#2c64a0',
                fontStyle: 'italic'
              }}
            >
              Ping
            </span>
          </a>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mx-auto gap-3">
              <li className="nav-item">
                <a
                  href="/"
                  style={{
                    textDecoration: 'none',
                    fontWeight: '500',
                    color: '#23517f',
                    borderBottom: '2px solid #23517f',
                    paddingBottom: '4px'
                  }}
                >
                  Home
                </a>
              </li>

              <li className="nav-item">
                <a
                  href="/doctors"
                  style={{
                    textDecoration: 'none',
                    fontWeight: '500',
                    color: '#555'
                  }}
                >
                  Doctors
                </a>
              </li>

              {/* Logged out: Home, Doctors, About */}
              {/* Logged in: Home, Doctors, My Appointments/My Dashboard */}
              {/* Don't render this slot until we actually know
                  whether the user is logged in / what their role
                  is — avoids briefly showing the wrong label. */}
              {authLoading ? null : user ? (
                <li className="nav-item">
                  <a
                    href={
                      role === 'doctor'
                        ? '/doctor-dashboard'
                        : '/dashboard'
                    }
                    style={{
                      textDecoration: 'none',
                      fontWeight: '500',
                      color: '#555'
                    }}
                  >
                    {role === 'doctor'
                      ? 'My Dashboard'
                      : 'My Appointments'}
                  </a>
                </li>
              ) : (
                <li className="nav-item">
                  <a
                    href="/about"
                    style={{
                      textDecoration: 'none',
                      fontWeight: '500',
                      color: '#555'
                    }}
                  >
                    About
                  </a>
                </li>
              )}
            </ul>

            <div className="d-flex gap-2 align-items-center">
              {user ? (
                <>
                  {/* Logged-in user's registered name */}
                  <span
                    style={{
                      fontSize: '13px',
                      color: '#23517f',
                      fontWeight: '500'
                    }}
                  >
                    👤 {profileName || 'User'}
                  </span>

                  <button
                    className="btn px-4"
                    style={{
                      border: '1px solid #23517f',
                      color: '#23517f',
                      borderRadius: '8px'
                    }}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="btn px-4"
                    style={{
                      border: '1px solid #23517f',
                      color: '#23517f'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        '#23517f';
                      e.currentTarget.style.color =
                        'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'transparent';
                      e.currentTarget.style.color =
                        '#23517f';
                    }}
                  >
                    Login
                  </a>

                  <a
                    href="/signup"
                    className="btn px-4"
                    style={{
                      background: '#23517f',
                      color: 'white'
                    }}
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #9dc4e8 0%, #d1e5f7 100%)',
          padding: '60px 0 40px'
        }}
      >
        <div className="container">
          <div className="mb-3">
            <span
              className="badge rounded-pill px-3 py-2"
              style={{
                background: '#23517f',
                fontSize: '14px'
              }}
            >
              ⊙ Trusted by 50,000+ patients
            </span>
          </div>

          <h1
            className="mb-3"
            style={{
              color: '#1e4872',
              fontSize: '40px',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}
          >
            Ping a doctor,
            <br />
            get an appointment
          </h1>

          <p
            className="fw-bold mb-4"
            style={{
              color: '#2a5885d8',
              fontSize: '18px'
            }}
          >
            Find top doctors, check availability, and
            book instantly.
          </p>

          <div className="d-flex gap-5 mt-4">
            <div>
              <div
                className="fw-bold"
                style={{
                  fontSize: '24px',
                  color: '#074481'
                }}
              >
                200+
              </div>

              <div
                style={{
                  color: '#185FA5',
                  fontSize: '14px'
                }}
              >
                Doctors
              </div>
            </div>

            <div>
              <div
                className="fw-bold"
                style={{
                  fontSize: '24px',
                  color: '#23517f'
                }}
              >
                15+
              </div>

              <div
                style={{
                  color: '#185FA5',
                  fontSize: '14px'
                }}
              >
                Specialties
              </div>
            </div>

            <div>
              <div
                className="fw-bold"
                style={{
                  fontSize: '24px',
                  color: '#0C447C'
                }}
              >
                50K+
              </div>

              <div
                style={{
                  color: '#185FA5',
                  fontSize: '14px'
                }}
              >
                Patients
              </div>
            </div>

            <div>
              <div
                className="fw-bold"
                style={{
                  fontSize: '24px',
                  color: '#0C447C'
                }}
              >
                4.8★
              </div>

              <div
                style={{
                  color: '#185FA5',
                  fontSize: '14px'
                }}
              >
                Rating
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Section */}
      <div className="container py-5">
        <h2
          className="fw-bold mb-1"
          style={{ color: '#2d4662' }}
        >
          Browse by speciality
        </h2>

        <p className="text-muted mb-4">
          Choose your health concern and find the right
          specialist
        </p>

        <div className="row g-3">
          {[
            {
              name: 'Cardiologist',
              icon: '🫀',
              count: '24 doctors'
            },
            {
              name: 'Neurologist',
              icon: '🧠',
              count: '18 doctors'
            },
            {
              name: 'Dentist',
              icon: '🦷',
              count: '32 doctors'
            },
            {
              name: 'Eye Care',
              icon: '👁️',
              count: '15 doctors'
            },
            {
              name: 'Pediatrician',
              icon: '🍼',
              count: '20 doctors'
            },
            {
              name: 'Orthopedic',
              icon: '🩻',
              count: '12 doctors'
            },
            {
              name: 'Dermatologist',
              icon: '🧬',
              count: '22 doctors'
            },
            {
              name: 'General',
              icon: '🏥',
              count: '45 doctors'
            }
          ].map((spec, index) => (
            <div
              className="col-6 col-md-3"
              key={index}
            >
              <div
                className="card border text-center p-3 h-100"
                style={{
                  cursor: 'pointer',
                  borderRadius: '12px'
                }}
                onClick={() =>
                  (window.location.href =
                    `/doctors?specialty=${spec.name}`)
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor =
                    '#185FA5')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor =
                    '#dee2e6')
                }
              >
                <div className="fw-medium mb-1">
                  {spec.name}
                </div>

                <div
                  style={{
                    fontSize: '32px',
                    position: 'relative',
                    top: '-7px'
                  }}
                >
                  {spec.icon}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {spec.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;