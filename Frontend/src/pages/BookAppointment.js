import React, {
  useState,
  useEffect,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import api from '../api';
import {
  auth,
} from '../firebase';
import { useAuthProfile } from '../authProfile';

function BookAppointment() {
  const navigate = useNavigate();

  const {
    authUser,
    role,
    authLoading,
  } = useAuthProfile();

  const [doctor, setDoctor] =
    useState(null);

  const [availability, setAvailability] =
    useState([]);

  const [selectedDate, setSelectedDate] =
    useState(null);

  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [hoveredSlot, setHoveredSlot] =
    useState(null);

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date().getMonth()
    );

  const [currentYear, setCurrentYear] =
    useState(
      new Date().getFullYear()
    );

  const [loading, setLoading] =
    useState(true);

  const [booking, setBooking] =
    useState(false);

  const [success, setSuccess] =
    useState('');

  const [error, setError] =
    useState('');

  const [form, setForm] =
    useState({
      name: '',
      age: '',
      phone: '',
      notes: '',
    });

  const doctorId =
    new URLSearchParams(
      window.location.search
    ).get('doctorId');

  /*
   * Load doctor, availability and
   * logged-in patient's profile.
   */
  useEffect(() => {
    const loadData = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }

      try {
        const doctorResponse =
          await api.get(
            `/doctors/${doctorId}`
          );

        setDoctor(
          doctorResponse.data
            ?.doctor ||
            doctorResponse.data
        );

        /*
         * DO NOT CHANGE CALENDAR AVAILABILITY
         */
        const availabilityResponse =
          await api.get(
            `/availability/doctor/${doctorId}`
          );

        setAvailability(
          availabilityResponse.data
            ?.availability || []
        );

        /*
         * If patient is logged in,
         * prefill their saved profile.
         */
        if (auth.currentUser) {
          try {
            const profileResponse =
              await api.get(
                '/users/me'
              );

            if (
              profileResponse.data
                ?.user?.role ===
              'patient'
            ) {
              const patient =
                profileResponse
                  .data.user;

              setForm((prev) => ({
                ...prev,
                name:
                  patient.name ||
                  '',
                age:
                  patient.age ||
                  '',
                phone:
                  patient.phone ||
                  '',
              }));
            }
          } catch (profileError) {
            console.error(
              'Profile loading failed:',
              profileError
            );
          }
        }
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data
            ?.message ||
            'Unable to load booking information.'
        );
      }

      setLoading(false);
    };

    loadData();
  }, [doctorId]);

  const availableDates =
    availability.map(
      (a) => a.date
    );

  const getAvailabilityForDate = (
    date
  ) => {
    return availability.find(
      (a) => a.date === date
    );
  };

  const selectedAvailability =
    selectedDate
      ? getAvailabilityForDate(
          selectedDate
        )
      : null;

  const bookedSlots =
    selectedAvailability
      ?.bookedSlots || [];

  const timeSlots =
    selectedAvailability
      ?.timeSlots || [];

  const morningSlots =
    timeSlots.filter((slot) =>
      slot.includes('AM')
    );

  const afternoonSlots =
    timeSlots.filter((slot) =>
      slot.includes('PM')
    );

  const getDaysInMonth = (
    month,
    year
  ) =>
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const getFirstDayOfMonth = (
    month,
    year
  ) =>
    new Date(
      year,
      month,
      1
    ).getDay();

  const formatDate = (
    year,
    month,
    day
  ) => {
    const m = String(
      month + 1
    ).padStart(2, '0');

    const d = String(
      day
    ).padStart(2, '0');

    return `${year}-${m}-${d}`;
  };

  const slotStyle = (
    slot
  ) => {
    const isBooked =
      bookedSlots.includes(
        slot
      );

    const isSelected =
      selectedSlot === slot;

    const isHovered =
      hoveredSlot === slot;

    if (isBooked) {
      return {
        padding: '8px',
        borderRadius: '6px',
        border:
          '1px solid #ccc',
        background: '#eee',
        color: '#999',
        cursor:
          'not-allowed',
        textDecoration:
          'line-through',
        fontSize: '13px',
        textAlign: 'center',
      };
    }

    if (isSelected) {
      return {
        padding: '8px',
        borderRadius: '6px',
        border:
          '1px solid #23517f',
        background:
          '#23517f',
        color: 'white',
        cursor: 'pointer',
        fontSize: '13px',
        textAlign: 'center',
      };
    }

    if (isHovered) {
      return {
        padding: '8px',
        borderRadius: '6px',
        border:
          '1px solid #23517f',
        background:
          '#eef4fb',
        color:
          '#23517f',
        cursor: 'pointer',
        fontSize: '13px',
        textAlign: 'center',
      };
    }

    return {
      padding: '8px',
      borderRadius: '6px',
      border:
        '1px solid #ccc',
      background: 'white',
      color: '#333',
      cursor: 'pointer',
      fontSize: '13px',
      textAlign: 'center',
    };
  };

  /*
   * ACTUAL booking
   */
  const handleBooking =
    async () => {
      setError('');
      setSuccess('');

      /*
       * Must be logged in
       */
      if (!auth.currentUser) {
        navigate(
          '/login',
          {
            state: {
              from: `/book?doctorId=${doctorId}`,
            },
          }
        );

        return;
      }

      if (
        !selectedDate ||
        !selectedSlot
      ) {
        setError(
          'Please select a date and time slot.'
        );

        return;
      }

      if (
        !form.name.trim() ||
        !form.phone.trim()
      ) {
        setError(
          'Please fill in your name and phone number.'
        );

        return;
      }

      setBooking(true);

      try {
        /*
         * Backend gets patient from
         * Firebase token automatically.
         */
        await api.post(
          '/appointments',
          {
            doctorId,
            date: selectedDate,
            timeSlot: selectedSlot,
            notes: form.notes,
          }
        );

        setSuccess(
          'Appointment booked successfully! 🎉'
        );

        setSelectedSlot(null);

        /*
         * Go to patient's actual dashboard
         * after booking.
         */
        setTimeout(() => {
          navigate(
            '/dashboard',
            {
              replace: true,
            }
          );
        }, 800);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data
            ?.message ||
            'Booking failed. Please try again.'
        );
      }

      setBooking(false);
    };

  if (!doctorId) {
    return (
      <div className="container py-5 text-center">
        <p>
          No doctor selected.{' '}
          <a href="/doctors">
            Browse doctors
          </a>
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container">

          <a
            href="/doctors"
            style={{
              textDecoration:
                'none',
              color:
                '#23517f',
              fontSize:
                '15px',
              fontWeight:
                '500',
            }}
          >
            ← Back to Doctors
          </a>

          <a
            className="navbar-brand fw-bold fs-3 mx-auto"
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

          {/* Always visible while logged in */}
          {authLoading ? null : authUser && (
            <a
              href={
                role === 'doctor'
                  ? '/doctor-dashboard'
                  : '/dashboard'
              }
              style={{
                textDecoration:
                  'none',
                color:
                  '#23517f',
                fontSize:
                  '13px',
                fontWeight:
                  '500',
              }}
            >
              {role === 'doctor'
                ? 'My Dashboard'
                : 'My Appointments'}
            </a>
          )}

        </div>
      </nav>

      {/* Doctor Info */}
      {doctor && (
        <div
          style={{
            background:
              '#f8f9fa',
            borderBottom:
              '1px solid #dee2e6',
            padding:
              '14px 0',
          }}
        >
          <div className="container d-flex align-items-center gap-3">

            <div
  onClick={() => {
    window.location.href =
      `/reviews?doctorId=${doctor._id}`;
  }}
  title="View doctor reviews"
  style={{
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#23517f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    flexShrink: 0,
  }}
>
  Dr.
</div>

            <div>

              <div
                className="fw-bold"
                style={{
                  color:
                    '#1e4872',
                  fontSize:
                    '15px',
                }}
              >
                {doctor.name}
              </div>

              <div
                style={{
                  fontSize:
                    '13px',
                  color:
                    '#185FA5',
                }}
              >
                {doctor.specialty}
                {' · '}
                {doctor.qualifications}
                {' · '}
                {
                  doctor.experienceYears
                }{' '}
                yrs
              </div>

              <div
                style={{
                  fontSize:
                    '12px',
                  color:
                    '#555',
                }}
              >
                ৳
                {doctor.fee}
                {' per consultation · '}
                ⭐
                {doctor.avgRating}
              </div>

            </div>

          </div>
        </div>
      )}

      <div className="container py-4">

        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              style={{
                color:
                  '#23517f',
              }}
            />
          </div>
        ) : (
          <div className="row g-4">

            {/* ================= CALENDAR ================= */}

            <div className="col-md-6">

              <div
                className="card p-3 mb-3"
                style={{
                  borderRadius:
                    '12px',
                }}
              >

                <div
                  className="fw-medium mb-2"
                  style={{
                    color:
                      '#23517f',
                  }}
                >
                  📅 Select date
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <button
                    onClick={() => {
                      if (
                        currentMonth ===
                        0
                      ) {
                        setCurrentMonth(
                          11
                        );
                        setCurrentYear(
                          (y) =>
                            y - 1
                        );
                      } else {
                        setCurrentMonth(
                          (m) =>
                            m - 1
                        );
                      }
                    }}
                    style={{
                      border:
                        'none',
                      background:
                        'none',
                      color:
                        '#23517f',
                      fontSize:
                        '18px',
                      cursor:
                        'pointer',
                    }}
                  >
                    ‹
                  </button>

                  <span
                    style={{
                      fontSize:
                        '14px',
                      fontWeight:
                        '500',
                      color:
                        '#1e4872',
                    }}
                  >
                    {new Date(
                      currentYear,
                      currentMonth
                    ).toLocaleString(
                      'default',
                      {
                        month:
                          'long',
                      }
                    )}{' '}
                    {
                      currentYear
                    }
                  </span>

                  <button
                    onClick={() => {
                      if (
                        currentMonth ===
                        11
                      ) {
                        setCurrentMonth(
                          0
                        );
                        setCurrentYear(
                          (y) =>
                            y + 1
                        );
                      } else {
                        setCurrentMonth(
                          (m) =>
                            m + 1
                        );
                      }
                    }}
                    style={{
                      border:
                        'none',
                      background:
                        'none',
                      color:
                        '#23517f',
                      fontSize:
                        '18px',
                      cursor:
                        'pointer',
                    }}
                  >
                    ›
                  </button>

                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(7, 1fr)',
                    gap: '4px',
                    textAlign:
                      'center',
                  }}
                >

                  {[
                    'Sun',
                    'Mon',
                    'Tue',
                    'Wed',
                    'Thu',
                    'Fri',
                    'Sat',
                  ].map(
                    (d) => (
                      <div
                        key={d}
                        style={{
                          fontSize:
                            '11px',
                          color:
                            '#999',
                          paddingBottom:
                            '4px',
                        }}
                      >
                        {d}
                      </div>
                    )
                  )}

                  {[
                    ...Array(
                      getFirstDayOfMonth(
                        currentMonth,
                        currentYear
                      )
                    ),
                  ].map(
                    (_, i) => (
                      <div
                        key={i}
                      />
                    )
                  )}

                  {[
                    ...Array(
                      getDaysInMonth(
                        currentMonth,
                        currentYear
                      )
                    ),
                  ].map(
                    (_, i) => {
                      const date =
                        i + 1;

                      const dateStr =
                        formatDate(
                          currentYear,
                          currentMonth,
                          date
                        );

                      const isAvailable =
                        availableDates.includes(
                          dateStr
                        );

                      const isFriday =
                        new Date(
                          currentYear,
                          currentMonth,
                          date
                        ).getDay() ===
                        5;

                      const isSelected =
                        selectedDate ===
                        dateStr;

                      return (
                        <div
                          key={
                            date
                          }
                          onClick={() => {
                            if (
                              isAvailable &&
                              !isFriday
                            ) {
                              setSelectedDate(
                                dateStr
                              );

                              setSelectedSlot(
                                null
                              );
                            }
                          }}
                          style={{
                            fontSize:
                              '13px',
                            padding:
                              '6px 3px',
                            borderRadius:
                              '6px',
                            cursor:
                              isAvailable &&
                              !isFriday
                                ? 'pointer'
                                : 'not-allowed',
                            background:
                              isSelected
                                ? '#23517f'
                                : 'transparent',
                            color:
                              isSelected
                                ? 'white'
                                : isAvailable &&
                                  !isFriday
                                ? '#333'
                                : '#ccc',
                            fontWeight:
                              isAvailable &&
                              !isFriday
                                ? '500'
                                : 'normal',
                          }}
                        >
                          {date}
                        </div>
                      );
                    }
                  )}

                </div>
              </div>

              {/* Slots */}
              {selectedDate && (
                <div
                  className="card p-3"
                  style={{
                    borderRadius:
                      '12px',
                  }}
                >

                  <div
                    className="fw-medium mb-2"
                    style={{
                      color:
                        '#23517f',
                    }}
                  >
                    🕐 Available slots —
                    {' '}
                    {selectedDate}
                  </div>

                  {morningSlots.length >
                    0 && (
                    <>
                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#999',
                          marginBottom:
                            '8px',
                        }}
                      >
                        Morning
                      </div>

                      <div
                        style={{
                          display:
                            'grid',
                          gridTemplateColumns:
                            'repeat(3, 1fr)',
                          gap: '6px',
                          marginBottom:
                            '12px',
                        }}
                      >
                        {morningSlots.map(
                          (slot) => (
                            <div
                              key={
                                slot
                              }
                              style={slotStyle(
                                slot
                              )}
                              onClick={() =>
                                !bookedSlots.includes(
                                  slot
                                ) &&
                                setSelectedSlot(
                                  slot
                                )
                              }
                              onMouseEnter={() =>
                                !bookedSlots.includes(
                                  slot
                                ) &&
                                setHoveredSlot(
                                  slot
                                )
                              }
                              onMouseLeave={() =>
                                setHoveredSlot(
                                  null
                                )
                              }
                            >
                              {slot}
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}

                  {afternoonSlots.length >
                    0 && (
                    <>
                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#999',
                          marginBottom:
                            '8px',
                        }}
                      >
                        Afternoon
                      </div>

                      <div
                        style={{
                          display:
                            'grid',
                          gridTemplateColumns:
                            'repeat(3, 1fr)',
                          gap: '6px',
                        }}
                      >
                        {afternoonSlots.map(
                          (slot) => (
                            <div
                              key={
                                slot
                              }
                              style={slotStyle(
                                slot
                              )}
                              onClick={() =>
                                !bookedSlots.includes(
                                  slot
                                ) &&
                                setSelectedSlot(
                                  slot
                                )
                              }
                              onMouseEnter={() =>
                                !bookedSlots.includes(
                                  slot
                                ) &&
                                setHoveredSlot(
                                  slot
                                )
                              }
                              onMouseLeave={() =>
                                setHoveredSlot(
                                  null
                                )
                              }
                            >
                              {slot}
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}

                  <div
                    className="d-flex gap-3 mt-3"
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#999',
                    }}
                  >
                    <span>
                      ⬜ Available
                    </span>

                    <span
                      style={{
                        color:
                          '#23517f',
                      }}
                    >
                      🟦 Selected
                    </span>

                    <span>
                      ⬛ Booked
                    </span>
                  </div>

                </div>
              )}

            </div>

            {/* ================= PATIENT DETAILS ================= */}

            <div className="col-md-6">

              <div
                className="card p-3 mb-3"
                style={{
                  borderRadius:
                    '12px',
                }}
              >

                <div
                  className="fw-medium mb-3"
                  style={{
                    color:
                      '#23517f',
                  }}
                >
                  👤 Patient details
                </div>

                <label
                  style={{
                    fontSize:
                      '13px',
                    color:
                      '#555',
                  }}
                >
                  Full name *
                </label>

                <input
                  className="form-control mb-2"
                  placeholder="Your name"
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target
                          .value,
                    })
                  }
                  style={{
                    borderRadius:
                      '8px',
                  }}
                />

                <label
                  style={{
                    fontSize:
                      '13px',
                    color:
                      '#555',
                  }}
                >
                  Age
                </label>

                <input
                  className="form-control mb-2"
                  placeholder="28"
                  value={
                    form.age
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      age:
                        e.target
                          .value,
                    })
                  }
                  style={{
                    borderRadius:
                      '8px',
                  }}
                />

                <label
                  style={{
                    fontSize:
                      '13px',
                    color:
                      '#555',
                  }}
                >
                  Phone *
                </label>

                <input
                  className="form-control mb-2"
                  placeholder="01XXXXXXXXX"
                  value={
                    form.phone
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target
                          .value,
                    })
                  }
                  style={{
                    borderRadius:
                      '8px',
                  }}
                />

                <label
                  style={{
                    fontSize:
                      '13px',
                    color:
                      '#555',
                  }}
                >
                  Symptoms / notes
                </label>

                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe your issue briefly..."
                  value={
                    form.notes
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target
                          .value,
                    })
                  }
                  style={{
                    borderRadius:
                      '8px',
                  }}
                />

              </div>

              {/* Booking summary */}
              <div
                className="card p-3"
                style={{
                  borderRadius:
                    '12px',
                }}
              >

                <div
                  className="fw-medium mb-3"
                  style={{
                    color:
                      '#23517f',
                  }}
                >
                  📋 Booking summary
                </div>

                <div
                  style={{
                    fontSize:
                      '13px',
                    color:
                      '#555',
                  }}
                >

                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      Doctor
                    </span>

                    <span
                      style={{
                        color:
                          '#1e4872',
                        fontWeight:
                          '500',
                      }}
                    >
                      {
                        doctor?.name
                      }
                    </span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      Date
                    </span>

                    <span
                      style={{
                        color:
                          '#1e4872',
                      }}
                    >
                      {selectedDate ||
                        '—'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span>
                      Time
                    </span>

                    <span
                      style={{
                        color:
                          '#1e4872',
                      }}
                    >
                      {selectedSlot ||
                        '—'}
                    </span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between">

                    <span>
                      Fee
                    </span>

                    <span
                      style={{
                        color:
                          '#1e4872',
                        fontWeight:
                          'bold',
                      }}
                    >
                      ৳{' '}
                      {
                        doctor?.fee
                      }
                    </span>

                  </div>

                </div>

                {error && (
                  <div
                    className="alert alert-danger py-2 mt-2"
                    style={{
                      fontSize:
                        '13px',
                    }}
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    className="alert alert-success py-2 mt-2"
                    style={{
                      fontSize:
                        '13px',
                    }}
                  >
                    {success}
                  </div>
                )}

                <button
                  onClick={
                    handleBooking
                  }
                  disabled={
                    booking
                  }
                  className="btn w-100 mt-3 fw-medium"
                  style={{
                    background:
                      '#23517f',
                    color:
                      'white',
                    borderRadius:
                      '8px',
                    padding:
                      '10px',
                  }}
                >
                  {booking
                    ? 'Booking...'
                    : 'Confirm Booking →'}
                </button>

              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}

export default BookAppointment;