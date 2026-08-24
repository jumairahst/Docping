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

const SLOT_OPTIONS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

function DoctorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [appointments, setAppointments] =
    useState([]);

  const [myAvailability, setMyAvailability] =
    useState([]);

  const [newDate, setNewDate] =
    useState('');

  const [newSlots, setNewSlots] =
    useState([]);

  const [savingAvailability, setSavingAvailability] =
    useState(false);

  const [deletingAvailabilityId, setDeletingAvailabilityId] =
    useState(null);

  const [availabilityError, setAvailabilityError] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * Load doctor dashboard
   */
  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const profileResponse =
        await api.get(
          '/users/me'
        );

      const currentUser =
        profileResponse.data
          ?.user;

      if (!currentUser) {
        await signOut(auth);

        navigate('/login', {
          replace: true,
        });

        return;
      }

      /*
       * Patient must not access
       * doctor dashboard.
       */
      if (
        currentUser.role !==
        'doctor'
      ) {
        navigate('/dashboard', {
          replace: true,
        });

        return;
      }

      setProfile(
        profileResponse.data
      );

      /*
       * Actual doctor appointments
       */
      const appointmentResponse =
        await api.get(
          '/appointments/doctor'
        );

      setAppointments(
        appointmentResponse.data
          ?.appointments || []
      );

      /*
       * Doctor's own availability
       * (real, from MongoDB)
       */
      const doctorId =
        profileResponse.data
          ?.doctor?._id;

      if (doctorId) {
        const availabilityResponse =
          await api.get(
            `/availability/doctor/${doctorId}`
          );

        setMyAvailability(
          availabilityResponse.data
            ?.availability || []
        );
      }
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
          'Unable to load doctor dashboard.'
      );
    }

    setLoading(false);
  };

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
   * Update appointment status
   */
  const updateStatus = async (
    appointmentId,
    status
  ) => {
    try {
      await api.put(
        `/appointments/${appointmentId}/status`,
        {
          status,
        }
      );

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          'Unable to update appointment.'
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);

    navigate('/', {
      replace: true,
    });
  };

  /*
   * Toggle a time slot for the
   * "add availability" form
   */
  const toggleNewSlot = (slot) => {
    setNewSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  /*
   * Add / update availability for a date
   * (real write to MongoDB)
   */
  const handleAddAvailability = async () => {
    setAvailabilityError('');

    if (!newDate) {
      setAvailabilityError(
        'Please pick a date.'
      );
      return;
    }

    if (newSlots.length === 0) {
      setAvailabilityError(
        'Please select at least one time slot.'
      );
      return;
    }

    setSavingAvailability(true);

    try {
      await api.post('/availability', {
        date: newDate,
        timeSlots: newSlots,
      });

      setNewDate('');
      setNewSlots([]);

      await loadDashboard();
    } catch (err) {
      setAvailabilityError(
        err.response?.data?.message ||
          'Unable to save availability.'
      );
    }

    setSavingAvailability(false);
  };

  /*
   * Remove an availability entry
   * (real delete from MongoDB)
   */
  const handleDeleteAvailability = async (id) => {
    const confirmed = window.confirm(
      'Remove this availability date? Patients will no longer be able to book these slots.'
    );

    if (!confirmed) return;

    setDeletingAvailabilityId(id);

    try {
      await api.delete(`/availability/${id}`);
      await loadDashboard();
    } catch (err) {
      setAvailabilityError(
        err.response?.data?.message ||
          'Unable to remove availability.'
      );
    }

    setDeletingAvailabilityId(null);
  };

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

  const confirmed =
    appointments.filter(
      (a) =>
        a.status ===
        'confirmed'
    );

  const completed =
    appointments.filter(
      (a) =>
        a.status ===
        'completed'
    );

  const cancelled =
    appointments.filter(
      (a) =>
        a.status ===
        'cancelled'
    );

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
      {/* Navbar */}
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
                color:
                  '#555',
              }}
            >
              Home
            </a>

            <a
              href="/doctors"
              style={{
                textDecoration:
                  'none',
                color:
                  '#555',
              }}
            >
              Doctors
            </a>

            <a
              href="/doctor-dashboard"
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
              My Dashboard
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
              {
                profile?.user
                  ?.name
              }
            </span>

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

      <div className="container py-4">

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Stats */}
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
                {
                  appointments.length
                }
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
                  confirmed.length
                }
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
                  completed.length
                }
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
                  cancelled.length
                }
              </div>
            </div>
          </div>

        </div>

        {/* ================= MANAGE AVAILABILITY ================= */}
        <div
          className="card p-3 mb-4"
          style={{ borderRadius: '12px' }}
        >
          <div
            className="fw-bold mb-2"
            style={{
              color: '#1e4872',
              fontSize: '15px',
            }}
          >
            Manage your availability
          </div>

          <p
            className="text-muted mb-3"
            style={{ fontSize: '13px' }}
          >
            Add the dates and time slots
            you're available. Patients can
            only book appointments on slots
            you add here.
          </p>

          {availabilityError && (
            <div className="alert alert-danger py-2" style={{ fontSize: '13px' }}>
              {availabilityError}
            </div>
          )}

          <div className="row g-2 align-items-end mb-3">
            <div className="col-12 col-md-4">
              <label
                className="form-label"
                style={{ fontSize: '12px', color: '#555' }}
              >
                Date
              </label>
              <input
                type="date"
                className="form-control"
                value={newDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>

          <div
            className="d-flex flex-wrap gap-2 mb-3"
          >
            {SLOT_OPTIONS.map((slot) => {
              const selected = newSlots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleNewSlot(slot)}
                  className="btn btn-sm"
                  style={{
                    border: '1px solid #23517f',
                    background: selected ? '#23517f' : 'white',
                    color: selected ? 'white' : '#23517f',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          <button
            className="btn"
            disabled={savingAvailability}
            onClick={handleAddAvailability}
            style={{
              background: '#23517f',
              color: 'white',
              borderRadius: '8px',
            }}
          >
            {savingAvailability
              ? 'Saving...'
              : 'Add availability'}
          </button>

          {myAvailability.length > 0 && (
            <div className="mt-4">
              <div
                className="fw-bold mb-2"
                style={{ fontSize: '13px', color: '#1e4872' }}
              >
                Your upcoming availability
              </div>

              {myAvailability.map((entry) => (
                <div
                  key={entry._id}
                  className="d-flex align-items-center justify-content-between border-bottom py-2"
                >
                  <div>
                    <div
                      className="fw-bold"
                      style={{ fontSize: '13px', color: '#1e4872' }}
                    >
                      {formatDate(entry.date)}
                    </div>
                    <div
                      style={{ fontSize: '12px', color: '#777' }}
                    >
                      {entry.timeSlots.length} slot(s) ·{' '}
                      {(entry.bookedSlots || []).length} booked
                    </div>
                  </div>

                  <button
                    className="btn btn-sm"
                    disabled={
                      deletingAvailabilityId === entry._id
                    }
                    onClick={() =>
                      handleDeleteAvailability(entry._id)
                    }
                    style={{
                      border: '1px solid #e74c3c',
                      color: '#e74c3c',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  >
                    {deletingAvailabilityId === entry._id
                      ? 'Removing...'
                      : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actual appointments */}
        <div
          className="fw-bold mb-2"
          style={{
            color:
              '#1e4872',
            fontSize:
              '15px',
          }}
        >
          Patient appointments
        </div>

        {appointments.length ===
        0 ? (
          <div
            className="card p-5 text-center"
            style={{
              borderRadius:
                '12px',
            }}
          >
            <div
              style={{
                fontSize:
                  '40px',
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

            <div
              style={{
                fontSize:
                  '13px',
                color:
                  '#999',
              }}
            >
              Patient bookings will
              appear here.
            </div>
          </div>
        ) : (
          appointments.map(
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
                        '44px',
                      height:
                        '44px',
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
                    }}
                  >
                    👤
                  </div>

                  <div className="flex-grow-1">

                    <div
                      className="fw-bold"
                      style={{
                        color:
                          '#1e4872',
                        fontSize:
                          '14px',
                      }}
                    >
                      {
                        appointment
                          .patient
                          ?.name
                      }
                    </div>

                    <div
                      style={{
                        color:
                          '#555',
                        fontSize:
                          '12px',
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

                    <div
                      style={{
                        color:
                          '#555',
                        fontSize:
                          '12px',
                      }}
                    >
                      📞{' '}
                      {
                        appointment
                          .patient
                          ?.phone
                      }
                      {' · Age: '}
                      {
                        appointment
                          .patient
                          ?.age
                      }
                    </div>

                    {appointment.notes && (
                      <div
                        style={{
                          color:
                            '#777',
                          fontSize:
                            '12px',
                          marginTop:
                            '3px',
                        }}
                      >
                        Note:{' '}
                        {
                          appointment.notes
                        }
                      </div>
                    )}

                  </div>

                  <div className="d-flex align-items-center gap-2">

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
                          'confirmed'
                            ? '#d1e5f7'
                            : appointment.status ===
                              'completed'
                            ? '#e8f5e9'
                            : '#f5f5f5',
                        color:
                          appointment.status ===
                          'confirmed'
                            ? '#23517f'
                            : appointment.status ===
                              'completed'
                            ? '#2e7d32'
                            : '#777',
                      }}
                    >
                      {
                        appointment.status
                      }
                    </span>

                    {appointment.status ===
                      'confirmed' && (
                      <>
                        <button
                          className="btn btn-sm"
                          onClick={() =>
                            updateStatus(
                              appointment._id,
                              'completed'
                            )
                          }
                          style={{
                            border:
                              '1px solid #2e7d32',
                            color:
                              '#2e7d32',
                            borderRadius:
                              '8px',
                          }}
                        >
                          Complete
                        </button>

                        <button
                          className="btn btn-sm"
                          onClick={() =>
                            updateStatus(
                              appointment._id,
                              'cancelled'
                            )
                          }
                          style={{
                            border:
                              '1px solid #e74c3c',
                            color:
                              '#e74c3c',
                            borderRadius:
                              '8px',
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                  </div>

                </div>

              </div>
            )
          )
        )}

      </div>
    </>
  );
}

export default DoctorDashboard;