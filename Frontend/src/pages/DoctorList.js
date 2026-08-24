import React, { useEffect, useState } from 'react';
import api from '../api';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuthProfile } from '../authProfile';

function DoctorList() {
  const {
    authUser,
    displayName,
    role,
    authLoading
  } = useAuthProfile();

  const [doctors, setDoctors] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const INITIAL_COUNT = 8;
  const LOAD_MORE_COUNT = 8;

  const specialtyLimits = {
    Cardiologist: 24,
    Neurologist: 18,
    Dentist: 32,
    'Eye Care': 15,
    Pediatrician: 20,
    Orthopedic: 12,
    Dermatologist: 22,
    General: 45
  };

  const TOTAL_DOCTORS = 188;

  const [visibleCount, setVisibleCount] =
    useState(INITIAL_COUNT);

  const specialtyFilters = [
    'All',
    'Cardiologist',
    'Neurologist',
    'Dentist',
    'Eye Care',
    'Pediatrician',
    'Orthopedic',
    'Dermatologist',
    'General'
  ];

  /* ================= READ URL SPECIALTY ================= */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const specialty = params.get('specialty');

    if (
      specialty &&
      specialtyFilters.includes(specialty)
    ) {
      setActiveFilter(specialty);
    } else {
      setActiveFilter('All');
    }
  }, []);

  /* ================= FETCH DOCTORS ================= */

  useEffect(() => {
    setLoading(true);

    api
      .get('/doctors?limit=500')
      .then((res) => {
        console.log(
          'Doctor API Response:',
          res.data
        );

        const doctorData = Array.isArray(res.data)
          ? res.data
          : res.data?.doctors || [];

        setDoctors(doctorData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(
          'Error loading doctors:',
          err
        );

        setDoctors([]);
        setLoading(false);
      });
  }, []);

  /* ================= FILTER DOCTORS ================= */

  const filtered = doctors.filter((doctor) => {
    const matchFilter =
      activeFilter === 'All' ||
      doctor.specialty === activeFilter;

    const searchText =
      search.toLowerCase();

    const matchSearch =
      doctor.name
        ?.toLowerCase()
        .includes(searchText) ||
      doctor.specialty
        ?.toLowerCase()
        .includes(searchText);

    const matchRating =
      ratingFilter === null ||
      Number(doctor.avgRating || 0) >=
        ratingFilter;

    return (
      matchFilter &&
      matchSearch &&
      matchRating
    );
  });

  /* ================= LIMIT BY SPECIALTY ================= */

  let limitedDoctors;

  if (activeFilter === 'All') {
    limitedDoctors = filtered.slice(
      0,
      TOTAL_DOCTORS
    );
  } else {
    const limit =
      specialtyLimits[activeFilter];

    limitedDoctors = limit
      ? filtered.slice(0, limit)
      : filtered;
  }

  /* ================= RESET MORE ================= */

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [
    activeFilter,
    search,
    ratingFilter
  ]);

  const visibleDoctors =
    limitedDoctors.slice(
      0,
      visibleCount
    );

  /* ================= LOAD MORE ================= */

  const handleLoadMore = () => {
    setVisibleCount(
      (prev) => prev + LOAD_MORE_COUNT
    );
  };

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    }
  };

  return (
    <div>

      {/* ================= NAVBAR ================= */}

      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container">

          <a
            className="navbar-brand fw-bold fs-3"
            href="/"
            style={{
              textDecoration: 'none'
            }}
          >
            🩺
            <span
              style={{
                color: '#074481'
              }}
            >
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
                    color: '#555'
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
                    color: '#23517f',
                    borderBottom:
                      '2px solid #23517f',
                    paddingBottom: '4px'
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
              {authLoading ? null : authUser ? (
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

            {/* ================= AUTH AREA ================= */}

            <div className="d-flex gap-2 align-items-center">

              {authUser ? (
                <>
                  <span
                    style={{
                      fontSize: '13px',
                      color: '#23517f',
                      fontWeight: '500'
                    }}
                  >
                    👤{' '}
                    {displayName || 'User'}
                  </span>

                  <button
                    className="btn px-4"
                    onClick={handleLogout}
                    style={{
                      border:
                        '1px solid #23517f',
                      color: '#23517f',
                      borderRadius: '8px'
                    }}
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
                      border:
                        '1px solid #23517f',
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
                      background:
                        '#23517f',
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

      {/* ================= MAIN ================= */}

      <div className="container py-4">

        {/* ================= SEARCH ================= */}

        <div
          className="input-group mb-4"
          style={{
            maxWidth: '500px'
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search doctors, specialties..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              borderRadius:
                '8px 0 0 8px',
              borderColor: '#0C447C'
            }}
          />

          <button
            className="btn"
            style={{
              background: '#0C447C',
              color: 'white',
              borderRadius:
                '0 8px 8px 0'
            }}
          >
            🔍
          </button>
        </div>

        {/* ================= SPECIALTY FILTER ================= */}

        <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">

          <span
            className="fw-medium me-1"
            style={{
              color: '#0C447C'
            }}
          >
            Filter:
          </span>

          {specialtyFilters.map(
            (filter) => (
              <button
                key={filter}
                onClick={() =>
                  setActiveFilter(filter)
                }
                className="btn btn-sm"
                style={{
                  borderRadius: '20px',
                  border:
                    '1.5px solid #0C447C',
                  background:
                    activeFilter === filter
                      ? '#0C447C'
                      : 'transparent',
                  color:
                    activeFilter === filter
                      ? 'white'
                      : '#0C447C',
                  fontWeight:
                    activeFilter === filter
                      ? 'bold'
                      : 'normal',
                  padding: '5px 14px'
                }}
              >
                {filter}
              </button>
            )
          )}

        </div>

        {/* ================= RATING FILTER ================= */}

        <div className="d-flex gap-2 flex-wrap mb-3 justify-content-end">

          <button
            onClick={() =>
              setRatingFilter(
                ratingFilter === 4
                  ? null
                  : 4
              )
            }
            className="btn btn-sm"
            style={{
              borderRadius: '20px',
              border:
                '1.5px solid #0C447C',
              color:
                ratingFilter === 4
                  ? 'white'
                  : '#0C447C',
              background:
                ratingFilter === 4
                  ? '#0C447C'
                  : 'transparent',
              padding: '5px 14px'
            }}
          >
            ⭐ 4+ Rating
          </button>

          <button
            onClick={() =>
              setRatingFilter(
                ratingFilter === 4.5
                  ? null
                  : 4.5
              )
            }
            className="btn btn-sm"
            style={{
              borderRadius: '20px',
              border:
                '1.5px solid #0C447C',
              color:
                ratingFilter === 4.5
                  ? 'white'
                  : '#0C447C',
              background:
                ratingFilter === 4.5
                  ? '#0C447C'
                  : 'transparent',
              padding: '5px 14px'
            }}
          >
            ⭐ 4.5+ Rating
          </button>

        </div>

        {/* ================= COUNT ================= */}

        <p
          style={{
            color: '#555',
            fontSize: '14px'
          }}
          className="mb-3"
        >
          Showing{' '}
          <strong>
            {limitedDoctors.length}{' '}
            doctors
          </strong>
        </p>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="text-center py-5">

            <div
              className="spinner-border"
              style={{
                color: '#23517f'
              }}
            ></div>

            <p
              className="mt-2"
              style={{
                color: '#555'
              }}
            >
              Loading doctors...
            </p>

          </div>
        )}

        {/* ================= DOCTOR CARDS ================= */}

        {!loading &&
          visibleDoctors.length > 0 && (
            <div className="row g-3">

              {visibleDoctors.map(
                (doctor) => (
                  <div
                    className="col-md-6"
                    key={doctor._id}
                  >

                    <div
                      className="card p-3 h-100"
                      style={{
                        borderRadius:
                          '12px',
                        border:
                          '1px solid #dee2e6'
                      }}
                    >

                      <div className="d-flex gap-3">

                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius:
                              '50%',
                            background:
                              '#0C447C',
                            display: 'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            fontWeight:
                              'bold',
                            color:
                              'white',
                            flexShrink: 0,
                            fontSize:
                              '13px'
                          }}
                        >
                          Dr.
                        </div>

                        <div className="flex-grow-1">

                          <div
                            className="fw-bold"
                            style={{
                              color:
                                '#0C447C',
                              fontSize:
                                '15px'
                            }}
                          >
                            {doctor.name}
                          </div>

                          <div
                            style={{
                              fontSize:
                                '13px',
                              color:
                                '#185FA5'
                            }}
                          >
                            {
                              doctor.specialty
                            }
                          </div>

                          <div
                            style={{
                              fontSize:
                                '12px',
                              color:
                                '#555'
                            }}
                          >
                            ৳
                            {
                              doctor.fee
                            }
                            /visit
                          </div>

                          <div
                            style={{
                              fontSize:
                                '12px',
                              color:
                                '#e6a817'
                            }}
                          >
                            ⭐{' '}
                            {
                              doctor.avgRating
                            }{' '}
                            ·{' '}
                            {
                              doctor.reviewCount
                            }{' '}
                            reviews
                          </div>

                          <div
                            style={{
                              fontSize:
                                '12px',
                              color:
                                '#555',
                              marginTop:
                                '2px'
                            }}
                          >
                            {
                              doctor.qualifications
                            }{' '}
                            ·{' '}
                            {
                              doctor.experienceYears
                            }{' '}
                            yrs
                          </div>

                          <button
                            className="btn btn-sm w-100 mt-2 fw-medium"
                            style={{
                              background:
                                '#0C447C',
                              color:
                                'white',
                              borderRadius:
                                '8px',
                              padding:
                                '7px'
                            }}
                            onClick={() =>
                              window.location.href =
                                `/book?doctorId=${doctor._id}`
                            }
                          >
                            Book Appointment
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        {/* ================= MORE ================= */}

        {!loading &&
          visibleCount <
            limitedDoctors.length && (
            <div className="text-center mt-4 mb-4">

              <button
                onClick={
                  handleLoadMore
                }
                className="btn px-5 py-2 fw-medium"
                style={{
                  background:
                    '#0C447C',
                  color: 'white',
                  borderRadius:
                    '8px'
                }}
              >
                More
              </button>

            </div>
          )}

        {/* ================= NO RESULTS ================= */}

        {!loading &&
          limitedDoctors.length === 0 && (
            <div className="text-center py-5">

              <p
                style={{
                  color: '#555'
                }}
              >
                No doctors found.
              </p>

            </div>
          )}

      </div>
    </div>
  );
}

export default DoctorList;