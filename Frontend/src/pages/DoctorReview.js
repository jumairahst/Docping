import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { auth } from '../firebase';
import {
  signOut,
} from 'firebase/auth';

import {
  useNavigate,
} from 'react-router-dom';

import api from '../api';

import {
  useAuthProfile,
} from '../authProfile';

function DoctorReview() {
  const navigate = useNavigate();

  const {
    authUser,
    displayName,
    role,
    authLoading,
  } = useAuthProfile();

  const [doctor, setDoctor] =
    useState(null);

  const [reviews, setReviews] =
    useState([]);

  const [loadingDoctor, setLoadingDoctor] =
    useState(true);

  const [loadingReviews, setLoadingReviews] =
    useState(true);

  const [error, setError] =
    useState('');

  const [selectedStar, setSelectedStar] =
    useState(5);

  const [hoveredStar, setHoveredStar] =
    useState(0);

  const [comment, setComment] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const doctorId =
    new URLSearchParams(
      window.location.search
    ).get('doctorId');

  /*
   * Load doctor information
   */
  useEffect(() => {
    const loadDoctor =
      async () => {
        if (!doctorId) {
          setError(
            'Doctor not selected.'
          );

          setLoadingDoctor(false);
          return;
        }

        try {
          const response =
            await api.get(
              `/doctors/${doctorId}`
            );

          setDoctor(
            response.data?.doctor ||
              response.data
          );
        } catch (err) {
          console.error(err);

          setError(
            err.response?.data?.message ||
              'Unable to load doctor information.'
          );
        } finally {
          setLoadingDoctor(false);
        }
      };

    loadDoctor();
  }, [doctorId]);

  /*
   * Load reviews from MongoDB
   */
  const loadReviews =
    async () => {
      if (!doctorId) {
        return;
      }

      try {
        setLoadingReviews(true);

        const response =
          await api.get(
            `/reviews/doctor/${doctorId}`
          );

        setReviews(
          response.data?.reviews || []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            'Unable to load reviews.'
        );
      } finally {
        setLoadingReviews(false);
      }
    };

  useEffect(() => {
    loadReviews();
  }, [doctorId]);

  /*
   * Calculate rating statistics
   * from MongoDB reviews
   */
  const ratingStats =
    useMemo(() => {
      const total =
        reviews.length;

      const counts = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      reviews.forEach(
        (review) => {
          const rating =
            Number(
              review.rating
            );

          if (
            counts[rating] !==
            undefined
          ) {
            counts[rating] += 1;
          }
        }
      );

      const average =
        total > 0
          ? reviews.reduce(
              (
                sum,
                review
              ) =>
                sum +
                Number(
                  review.rating
                ),
              0
            ) / total
          : 0;

      return {
        total,
        counts,
        average:
          Math.round(
            average * 10
          ) / 10,
      };
    }, [reviews]);

  /*
   * Rating bar width
   */
  const getRatingWidth =
    (star) => {
      if (
        ratingStats.total === 0
      ) {
        return '0%';
      }

      return `${
        (ratingStats.counts[star] /
          ratingStats.total) *
        100
      }%`;
    };

  /*
   * Logout
   */
  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        window.location.href =
          '/';
      } catch (err) {
        console.error(
          'Logout failed:',
          err
        );
      }
    };

  /*
   * Submit review
   */
  const handleSubmitReview =
    async () => {
      setError('');

      if (!authUser) {
        navigate(
          '/login',
          {
            state: {
              from:
                `/reviews?doctorId=${doctorId}`,
            },
          }
        );

        return;
      }

      if (role !== 'patient') {
        setError(
          'Only patients can submit reviews.'
        );

        return;
      }

      if (!doctorId) {
        setError(
          'Doctor not selected.'
        );

        return;
      }

      try {
        setSubmitting(true);

        await api.post(
          '/reviews',
          {
            doctorId,
            rating:
              selectedStar,
            comment:
              comment.trim(),
          }
        );

        setComment('');
        setSelectedStar(5);

        await loadReviews();

        /*
         * Reload doctor so rating/count
         * also stays updated.
         */
        const doctorResponse =
          await api.get(
            `/doctors/${doctorId}`
          );

        setDoctor(
          doctorResponse.data
            ?.doctor ||
            doctorResponse.data
        );

        alert(
          'Review submitted successfully.'
        );
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            'Unable to submit review.'
        );
      } finally {
        setSubmitting(false);
      }
    };

  /*
   * Loading state
   */
  if (
    loadingDoctor
  ) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          style={{
            color: '#23517f',
          }}
        />
      </div>
    );
  }

  /*
   * Doctor missing
   */
  if (!doctor) {
    return (
      <div className="container py-5 text-center">
        <p>
          {error ||
            'Doctor not found.'}
        </p>

        <button
          className="btn"
          style={{
            background:
              '#23517f',
            color: 'white',
          }}
          onClick={() =>
            navigate(
              '/doctors'
            )
          }
        >
          Back to Doctors
        </button>
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

          <button
            type="button"
            onClick={() =>
              navigate(
                `/book?doctorId=${doctorId}`
              )
            }
            style={{
              border: 'none',
              background:
                'transparent',
              textDecoration:
                'none',
              color:
                '#020518',
              fontWeight: '500',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            ← Back to appointment
          </button>

          <div className="d-flex align-items-center gap-2">

            {authLoading ? null : authUser ? (
              <>
                <a
                  href={
                    role ===
                    'doctor'
                      ? '/doctor-dashboard'
                      : '/dashboard'
                  }
                  style={{
                    textDecoration:
                      'none',
                    fontWeight:
                      '500',
                    color:
                      '#23517f',
                    fontSize:
                      '13px',
                  }}
                >
                  {role ===
                  'doctor'
                    ? 'My Dashboard'
                    : 'My Appointments'}
                </a>

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
                  {displayName ||
                    'User'}
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
              </>
            ) : (
              <a
                href="/login"
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
                Login
              </a>
            )}

          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}

      <div className="container py-4">

        {error && (
          <div
            className="alert alert-danger"
            style={{
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* ================= DOCTOR INFO ================= */}

        <div
          className="card p-4 mb-3"
          style={{
            borderRadius: '12px',
          }}
        >
          <div className="d-flex gap-4 align-items-center">

            {/* Doctor information */}

            <div
              className="d-flex gap-3 align-items-center"
              style={{
                flex: 1,
              }}
            >

              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background:
                    '#23517f',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  color: 'white',
                  fontWeight:
                    'bold',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                Dr.
              </div>

              <div>

                <div
                  className="fw-bold"
                  style={{
                    fontSize:
                      '18px',
                    color:
                      '#1e4872',
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
                  yrs experience
                </div>

                <div className="d-flex align-items-center gap-2 mt-1">

                  <span
                    style={{
                      fontSize:
                        '28px',
                      fontWeight:
                        'bold',
                      color:
                        '#1e4872',
                    }}
                  >
                    {ratingStats.average ||
                      Number(
                        doctor.avgRating ||
                          0
                      ).toFixed(1)}
                  </span>

                  <span
                    style={{
                      color:
                        '#e6a817',
                      fontSize:
                        '18px',
                    }}
                  >
                    ★★★★★
                  </span>

                </div>

                <div
                  style={{
                    fontSize:
                      '12px',
                    color:
                      '#999',
                  }}
                >
                  {ratingStats.total ||
                    doctor.reviewCount ||
                    0}{' '}
                  reviews
                </div>

              </div>
            </div>

            {/* Rating bars */}

            <div
              style={{
                minWidth:
                  '200px',
              }}
            >
              {[5, 4, 3, 2, 1].map(
                (star) => (
                  <div
                    key={star}
                    className="d-flex align-items-center gap-2 mb-1"
                  >
                    <span
                      style={{
                        fontSize:
                          '12px',
                        color:
                          '#555',
                        width:
                          '12px',
                      }}
                    >
                      {star}
                    </span>

                    <div
                      style={{
                        flex: 1,
                        height:
                          '6px',
                        background:
                          '#eee',
                        borderRadius:
                          '3px',
                        overflow:
                          'hidden',
                      }}
                    >
                      <div
                        style={{
                          width:
                            getRatingWidth(
                              star
                            ),
                          height:
                            '100%',
                          background:
                            '#e6a817',
                          borderRadius:
                            '3px',
                        }}
                      />
                    </div>

                    <span
                      style={{
                        fontSize:
                          '12px',
                        color:
                          '#555',
                        width:
                          '24px',
                      }}
                    >
                      {
                        ratingStats
                          .counts[
                          star
                        ]
                      }
                    </span>
                  </div>
                )
              )}
            </div>

            <button
              className="btn align-self-start"
              style={{
                background:
                  '#23517f',
                color:
                  'white',
                borderRadius:
                  '8px',
                fontSize:
                  '14px',
                padding:
                  '8px 20px',
              }}
              onClick={() =>
                navigate(
                  `/book?doctorId=${doctorId}`
                )
              }
            >
              Book now
            </button>

          </div>
        </div>

        {/* ================= WRITE REVIEW ================= */}

        <div
          className="card p-4 mb-3"
          style={{
            borderRadius: '12px',
          }}
        >

          <div
            className="fw-bold mb-1"
            style={{
              color:
                '#1e4872',
              fontSize:
                '15px',
            }}
          >
            Write a review
          </div>

          <div
            style={{
              fontSize:
                '13px',
              color:
                '#999',
              marginBottom:
                '10px',
            }}
          >
            Share your experience
            with {doctor.name}
          </div>

          {/* Stars */}

          <div className="d-flex gap-1 mb-3">

            {[1, 2, 3, 4, 5].map(
              (star) => (
                <span
                  key={star}
                  onClick={() =>
                    setSelectedStar(
                      star
                    )
                  }
                  onMouseEnter={() =>
                    setHoveredStar(
                      star
                    )
                  }
                  onMouseLeave={() =>
                    setHoveredStar(0)
                  }
                  style={{
                    fontSize:
                      '28px',
                    cursor:
                      'pointer',
                    color:
                      star <=
                      (hoveredStar ||
                        selectedStar)
                        ? '#e6a817'
                        : '#ccc',
                  }}
                >
                  ★
                </span>
              )
            )}

          </div>

          <textarea
            className="form-control mb-3"
            rows="3"
            value={comment}
            onChange={(e) =>
              setComment(
                e.target.value
              )
            }
            placeholder={`Share your experience with ${doctor.name}...`}
            style={{
              borderRadius:
                '8px',
              borderColor:
                '#b0c8e0',
            }}
          />

          <button
            className="btn"
            disabled={
              submitting
            }
            onClick={
              handleSubmitReview
            }
            style={{
              background:
                '#23517f',
              color: 'white',
              borderRadius:
                '8px',
              padding:
                '8px 20px',
              opacity:
                submitting
                  ? 0.7
                  : 1,
            }}
          >
            {submitting
              ? 'Submitting...'
              : 'Submit review'}
          </button>

        </div>

        {/* ================= PATIENT REVIEWS ================= */}

        <div
          className="fw-bold mb-3"
          style={{
            fontSize:
              '15px',
            color:
              '#1e4872',
          }}
        >
          Patient reviews
        </div>

        {loadingReviews ? (
          <div className="text-center py-4">
            <div
              className="spinner-border"
              style={{
                color:
                  '#23517f',
              }}
            />
          </div>
        ) : reviews.length === 0 ? (

          <div
            className="card p-4 text-center"
            style={{
              borderRadius:
                '12px',
              color:
                '#777',
              fontSize:
                '13px',
            }}
          >
            No reviews yet for this doctor.
          </div>

        ) : (

          reviews.map(
            (review) => {

              const patientName =
                review.patient
                  ?.name ||
                'Patient';

              const initials =
                patientName
                  .split(' ')
                  .filter(Boolean)
                  .map(
                    (part) =>
                      part[0]
                  )
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

              const reviewDate =
                review.createdAt
                  ? new Date(
                      review.createdAt
                    ).toLocaleDateString(
                      'en-US',
                      {
                        month:
                          'short',
                        day:
                          'numeric',
                        year:
                          'numeric',
                      }
                    )
                  : '';

              const reviewColor =
                '#23517f';

              return (
                <div
                  key={
                    review._id
                  }
                  className="card p-3 mb-3"
                  style={{
                    borderRadius:
                      '12px',
                  }}
                >

                  <div className="d-flex align-items-center gap-2 mb-2">

                    <div
                      style={{
                        width:
                          '38px',
                        height:
                          '38px',
                        borderRadius:
                          '50%',
                        background:
                          reviewColor,
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
                          '13px',
                        flexShrink:
                          0,
                      }}
                    >
                      {initials}
                    </div>

                    <div>

                      <div
                        className="fw-bold"
                        style={{
                          fontSize:
                            '13px',
                          color:
                            '#1e4872',
                        }}
                      >
                        {patientName}
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#999',
                        }}
                      >
                        {reviewDate}
                      </div>

                    </div>

                    <div
                      style={{
                        marginLeft:
                          'auto',
                        color:
                          '#e6a817',
                        fontSize:
                          '14px',
                      }}
                    >
                      {'★'.repeat(
                        Number(
                          review.rating
                        )
                      )}
                    </div>

                  </div>

                  <div
                    style={{
                      fontSize:
                        '13px',
                      color:
                        '#444',
                      lineHeight:
                        '1.6',
                    }}
                  >
                    {review.comment ||
                      'No written comment.'}
                  </div>

                </div>
              );
            }
          )
        )}

      </div>
    </>
  );
}

export default DoctorReview;