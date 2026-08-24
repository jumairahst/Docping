import React, {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  auth,
} from '../firebase';

import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import api from '../api';

function PatientDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [cancellingId, setCancellingId] =
    useState(null);

  /*
   * Load patient profile + appointments
   */
  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const profileResponse =
        await api.get('/users/me');

      const currentUser =
        profileResponse.data?.user;

      if (!currentUser) {
        await signOut(auth);

        navigate('/login', {
          replace: true,
        });

        return;
      }

      /*
       * A doctor must never see patient dashboard
       */
      if (
        currentUser.role !==
        'patient'
      ) {
        navigate(
          '/doctor-dashboard',
          {
            replace: true,
          }
        );

        return;
      }

      setProfile(
        profileResponse.data
      );

      /*
       * Actual appointments from MongoDB
       */
      const appointmentResponse =
        await api.get(
          '/appointments/my'
        );

      setAppointments(
        appointmentResponse.data
          ?.appointments || []
      );
    } catch (err) {
      console.error(err);

      if (
        err.response?.status ===
          401 ||
        err.response?.status ===
          404
      ) {
        await signOut(auth);

        navigate('/login', {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data
          ?.message ||
          'Unable to load appointments.'
      );
    }

    setLoading(false);
  };

  /*
   * Auth guard
   */
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            navigate('/login', {
              replace: true,
            });

            return;
          }

          setUser(currentUser);

          await loadDashboard();
        }
      );

    return () => unsubscribe();
  }, [navigate]);

  /*
   * Cancel appointment
   */
  const handleCancel = async (
    appointmentId
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this appointment?'
      );

    if (!confirmed) return;

    setCancellingId(
      appointmentId
    );

    try {
      await api.put(
        `/appointments/${appointmentId}/cancel`
      );

      /*
       * Reload actual backend data
       */
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          'Unable to cancel appointment.'
      );
    }

    setCancellingId(null);
  };

  /*
   * Logout
   */
  const handleLogout = async () => {
    await signOut(auth);

    navigate('/', {
      replace: true,
    });
  };

  /*
   * Initials
   */
  const getInitials = () => {
    const name =
      profile?.user?.name ||
      user?.displayName ||
      user?.email ||
      'User';

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            .toUpperCase()
      )
      .join('');
  };

  /*
   * Appointment categories
   */
  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
          'confirmed'
    );

  const completedAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
          'completed'
    );

  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
          'cancelled'
    );

  const formatDate = (
    dateString
  ) => {
    if (!dateString) return '';

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          minHeight: '100vh',
        }}
      >
        <div
          className="spinner-border"
          style={{
            color: '#23517f',
          }}
        />
      </div>
    );
  }

  return (
    <>
      {/* ================= NAVBAR ================= */}

      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container">

          <a
            className="navbar-brand fw-bold fs-3"
            href="/"
            style={{
              textDecoration:
                'none',
            }}
          >
            🩺{' '}
            <span
              style={{
                color:
                  '#074481',
              }}
            >
              Doc
            </span>
            <span
              style={{
                color:
                  '#2c64a0',
                fontStyle:
                  'italic',
              }}
            >
              Ping
            </span>
          </a>

          <div className="d-flex gap-4 mx-auto">

            <a
              href="/"
              style={{
                textDecoration:
                  'none',
                color: '#555',
              }}
            >
              Home
            </a>

            <a
              href="/doctors"
              style={{
                textDecoration:
                  'none',
                color: '#555',
              }}
            >
              Doctors
            </a>

            {/* ALWAYS visible while logged in */}
            <a
              href="/dashboard"
              style={{
                textDecoration:
                  'none',
                fontWeight:
                  '500',
                color:
                  '#23517f',
                borderBottom:
                  '2px solid #23517f',
                paddingBottom:
                  '4px',
              }}
            >
              My Appointments
            </a>

          </div>

          <div className="d-flex align-items-center gap-2">

            <span
              style={{
                fontSize:
                  '13px',
                color:
                  '#23517f',
                fontWeight:
                  '500',
              }}
            >
              👤{' '}
              {profile?.user?.name ||
                user?.email ||
                'User'}
            </span>

            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius:
                  '50%',
                background:
                  '#23517f',
                color:
                  'white',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                fontWeight:
                  'bold',
                fontSize:
                  '13px',
              }}
            >
              {getInitials()}
            </div>

            <button
              onClick={
                handleLogout
              }
              className="btn btn-sm"
              style={{
                border:
                  '1px solid #23517f',
                color:
                  '#23517f',
                borderRadius:
                  '8px',
              }}
            >
              Logout
            </button>

          </div>
        </div>
      </nav>

      {/* ================= CONTENT ================= */}

      <div className="container py-4">

        {error && (
          <div
            className="alert alert-danger"
          >
            {error}
          </div>
        )}

        {/* ================= STATS ================= */}

        <div className="row g-3 mb-4">

          <div className="col-6 col-md-3">
            <div
              className="card p-3"
              style={{
                borderRadius:
                  '12px',
              }}
            >
              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#999',
                }}
              >
                Total appointments
              </div>

              <div
                style={{
                  fontSize:
                    '28px',
                  fontWeight:
                    'bold',
                  color:
                    '#1e4872',
                }}
              >
                {appointments.length}
              </div>

              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#23517f',
                }}
              >
                All time
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="card p-3"
              style={{
                borderRadius:
                  '12px',
              }}
            >
              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#999',
                }}
              >
                Upcoming
              </div>

              <div
                style={{
                  fontSize:
                    '28px',
                  fontWeight:
                    'bold',
                  color:
                    '#1e4872',
                }}
              >
                {
                  upcomingAppointments.length
                }
              </div>

              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#23517f',
                }}
              >
                Confirmed
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="card p-3"
              style={{
                borderRadius:
                  '12px',
              }}
            >
              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#999',
                }}
              >
                Completed
              </div>

              <div
                style={{
                  fontSize:
                    '28px',
                  fontWeight:
                    'bold',
                  color:
                    '#1e4872',
                }}
              >
                {
                  completedAppointments.length
                }
              </div>

              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#2e7d32',
                }}
              >
                Completed visits
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="card p-3"
              style={{
                borderRadius:
                  '12px',
              }}
            >
              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#999',
                }}
              >
                Cancelled
              </div>

              <div
                style={{
                  fontSize:
                    '28px',
                  fontWeight:
                    'bold',
                  color:
                    '#1e4872',
                }}
              >
                {
                  cancelledAppointments.length
                }
              </div>

              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#999',
                }}
              >
                Cancelled visits
              </div>
            </div>
          </div>

        </div>

        {/* ================= UPCOMING ================= */}

        <div
          className="fw-bold mb-2"
          style={{
            fontSize:
              '15px',
            color:
              '#1e4872',
          }}
        >
          Upcoming appointments
        </div>

        {upcomingAppointments.length ===
        0 ? (
          <div
            className="card p-4 mb-4 text-center"
            style={{
              borderRadius:
                '12px',
            }}
          >
            <div
              style={{
                fontSize:
                  '35px',
              }}
            >
              📅
            </div>

            <div
              className="fw-bold mt-2"
              style={{
                color:
                  '#1e4872',
              }}
            >
              No appointments yet
            </div>

            <p
              className="text-muted mb-3"
              style={{
                fontSize:
                  '13px',
              }}
            >
              Book an appointment
              with a doctor and it
              will appear here.
            </p>

            <button
              onClick={() =>
                navigate(
                  '/doctors'
                )
              }
              className="btn"
              style={{
                background:
                  '#23517f',
                color:
                  'white',
                borderRadius:
                  '8px',
              }}
            >
              Find a Doctor
            </button>
          </div>
        ) : (
          <div className="mb-4">

            {upcomingAppointments.map(
              (appointment) => (
                <div
                  className="card p-3 mb-2"
                  key={
                    appointment._id
                  }
                  style={{
                    borderRadius:
                      '12px',
                  }}
                >
                  <div className="d-flex align-items-center gap-3">

                    <div
                      style={{
                        width:
                          '46px',
                        height:
                          '46px',
                        borderRadius:
                          '50%',
                        background:
                          '#23517f',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        color:
                          'white',
                        fontWeight:
                          'bold',
                        fontSize:
                          '11px',
                      }}
                    >
                      Dr.
                    </div>

                    <div className="flex-grow-1">

                      <div
                        className="fw-bold"
                        style={{
                          fontSize:
                            '14px',
                          color:
                            '#1e4872',
                        }}
                      >
                        {
                          appointment
                            .doctor
                            ?.name
                        }
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#185FA5',
                        }}
                      >
                        {
                          appointment
                            .doctor
                            ?.specialty
                        }
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#555',
                        }}
                      >
                        📅{' '}
                        {formatDate(
                          appointment.date
                        )}{' '}
                        ·{' '}
                        {
                          appointment.timeSlot
                        }
                      </div>

                    </div>

                    <div className="d-flex gap-2 align-items-center">

                      <span
                        style={{
                          fontSize:
                            '12px',
                          padding:
                            '4px 12px',
                          borderRadius:
                            '20px',
                          background:
                            '#d1e5f7',
                          color:
                            '#23517f',
                          fontWeight:
                            '500',
                        }}
                      >
                        {
                          appointment.status
                        }
                      </span>

                      <button
                        className="btn btn-sm"
                        disabled={
                          cancellingId ===
                          appointment._id
                        }
                        onClick={() =>
                          handleCancel(
                            appointment._id
                          )
                        }
                        style={{
                          border:
                            '1px solid #e74c3c',
                          color:
                            '#e74c3c',
                          borderRadius:
                            '8px',
                          fontSize:
                            '12px',
                        }}
                      >
                        {cancellingId ===
                        appointment._id
                          ? 'Cancelling...'
                          : 'Cancel'}
                      </button>

                    </div>

                  </div>
                </div>
              )
            )}

          </div>
        )}

        {/* ================= PAST ================= */}

        <div
          className="fw-bold mb-2"
          style={{
            fontSize:
              '15px',
            color:
              '#1e4872',
          }}
        >
          Appointment history
        </div>

        {appointments.filter(
          (appointment) =>
            appointment.status !==
            'confirmed'
        ).length === 0 ? (
          <div
            className="card p-3 text-center"
            style={{
              borderRadius:
                '12px',
              color:
                '#999',
              fontSize:
                '13px',
            }}
          >
            No appointment
            history yet.
          </div>
        ) : (
          appointments
            .filter(
              (appointment) =>
                appointment.status !==
                'confirmed'
            )
            .map(
              (appointment) => (
                <div
                  className="card p-3 mb-2"
                  key={
                    appointment._id
                  }
                  style={{
                    borderRadius:
                      '12px',
                  }}
                >
                  <div className="d-flex align-items-center gap-3">

                    <div className="flex-grow-1">

                      <div
                        className="fw-bold"
                        style={{
                          fontSize:
                            '14px',
                          color:
                            '#1e4872',
                        }}
                      >
                        {
                          appointment
                            .doctor
                            ?.name
                        }
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#555',
                        }}
                      >
                        {
                          appointment
                            .doctor
                            ?.specialty
                        }{' '}
                        ·{' '}
                        {formatDate(
                          appointment.date
                        )}{' '}
                        ·{' '}
                        {
                          appointment.timeSlot
                        }
                      </div>

                    </div>

                    <span
                      style={{
                        fontSize:
                          '12px',
                        padding:
                          '4px 12px',
                        borderRadius:
                          '20px',
                        background:
                          appointment.status ===
                          'completed'
                            ? '#e8f5e9'
                            : '#f5f5f5',
                        color:
                          appointment.status ===
                          'completed'
                            ? '#2e7d32'
                            : '#777',
                        fontWeight:
                          '500',
                      }}
                    >
                      {
                        appointment.status
                      }
                    </span>

                  </div>
                </div>
              )
            )
        )}

      </div>
    </>
  );
}

export default PatientDashboard;