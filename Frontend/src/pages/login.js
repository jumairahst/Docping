import React, { useState, useEffect } from 'react';
import {
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  auth,
  googleProvider,
} from '../firebase';

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';

import api from '../api';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('patient');

  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');

  const [specialty, setSpecialty] =
    useState('Cardiologist');

  const [qualifications, setQualifications] =
    useState('');

  const [experienceYears, setExperienceYears] =
    useState('');

  const [fee, setFee] = useState('');

  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /*
   * Get user's MongoDB profile
   */
  const getUserProfile = async () => {
    try {
      const response = await api.get('/users/me');

      return response.data;
    } catch (error) {
      console.error(
        'Unable to load user profile:',
        error
      );

      return null;
    }
  };

  /*
   * Redirect according to actual backend role
   */
  const redirectUser = async () => {
    const profile = await getUserProfile();

    if (!profile?.user) {
      await signOut(auth);

      setError(
        'Your account profile was not found. Please register again.'
      );

      return;
    }

    if (profile.user.role === 'doctor') {
      navigate('/doctor-dashboard', {
        replace: true,
      });
    } else {
      navigate('/dashboard', {
        replace: true,
      });
    }
  };

  /*
   * If user is already logged in,
   * don't keep them on login page.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) return;

        // Do not redirect while user is actively
        // creating an account from this page.
        if (!isLogin) return;

        await redirectUser();
      }
    );

    return () => unsubscribe();
  }, [navigate, isLogin]);

  /*
   * Detect current auth page
   */
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsLogin(false);
      setIsForgot(false);
    } else if (
      location.pathname === '/forgot'
    ) {
      setIsForgot(true);
      setIsLogin(true);
    } else {
      setIsLogin(true);
      setIsForgot(false);
    }

    setError('');
    setSuccess('');
  }, [location.pathname]);

  /*
   * Email login
   */
  const handleLogin = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      setSuccess('Login successful!');

      await redirectUser();
    } catch (err) {
      console.error(err);

      if (
        err.code === 'auth/user-not-found'
      ) {
        setError(
          'No account found with this email.'
        );
      } else if (
        err.code === 'auth/wrong-password'
      ) {
        setError('Incorrect password.');
      } else if (
        err.code === 'auth/invalid-credential'
      ) {
        setError(
          'Invalid email or password.'
        );
      } else if (
        err.code === 'auth/invalid-email'
      ) {
        setError(
          'Please enter a valid email.'
        );
      } else {
        setError(
          'Login failed. Please try again.'
        );
      }
    }

    setLoading(false);
  };

  /*
   * Signup
   */
  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError(
        'Password should be at least 6 characters.'
      );
      return;
    }

    if (role === 'doctor' && !specialty) {
      setError(
        'Please select your specialty.'
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * Step 1:
       * Create Firebase account
       */
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      /*
       * Step 2:
       * Create MongoDB/DocPing account
       */
      await api.post('/auth/register', {
        role,
        name: name.trim(),
        phone,
        age,
        specialty:
          role === 'doctor'
            ? specialty
            : undefined,
        qualifications:
          role === 'doctor'
            ? qualifications
            : undefined,
        experienceYears:
          role === 'doctor'
            ? experienceYears
            : undefined,
        fee:
          role === 'doctor'
            ? fee
            : undefined,
        bio:
          role === 'doctor'
            ? bio
            : undefined,
      });

      setSuccess(
        'Account created successfully!'
      );

      /*
       * Step 3:
       * Go to correct dashboard
       */
      if (role === 'doctor') {
        navigate('/doctor-dashboard', {
          replace: true,
        });
      } else {
        navigate('/dashboard', {
          replace: true,
        });
      }

      return;
    } catch (err) {
      console.error(
        'Signup error:',
        err
      );

      /*
       * If Firebase account was created
       * but backend registration failed,
       * sign out so user doesn't remain
       * half-registered.
       */
      if (auth.currentUser) {
        try {
          await signOut(auth);
        } catch (logoutError) {
          console.error(logoutError);
        }
      }

      if (
        err.code ===
        'auth/email-already-in-use'
      ) {
        setError(
          'An account already exists with this email. Please login.'
        );
      } else if (
        err.code ===
        'auth/weak-password'
      ) {
        setError(
          'Password should be at least 6 characters.'
        );
      } else if (
        err.code === 'auth/invalid-email'
      ) {
        setError(
          'Please enter a valid email.'
        );
      } else if (
        err.response?.data?.message
      ) {
        setError(
          err.response.data.message
        );
      } else {
        setError(
          'Account creation failed. Please try again.'
        );
      }
    }

    setLoading(false);
  };

  /*
   * Google login
   *
   * Existing account:
   *   role is loaded from backend.
   *
   * New Google account:
   *   create patient account by default.
   */
  const handleGoogle = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const credential =
        await signInWithPopup(
          auth,
          googleProvider
        );

      /*
       * Check whether backend account already exists
       */
      const profile =
        await getUserProfile();

      if (profile?.user) {
        await redirectUser();
        return;
      }

      /*
       * New Google account
       */
      const googleName =
        credential.user.displayName ||
        'DocPing User';

      await api.post('/auth/register', {
        role: role || 'patient',
        name: googleName,
        phone: '',
        age: '',
        specialty:
          role === 'doctor'
            ? specialty
            : undefined,
      });

      if (role === 'doctor') {
        navigate('/doctor-dashboard', {
          replace: true,
        });
      } else {
        navigate('/dashboard', {
          replace: true,
        });
      }
    } catch (err) {
      console.error(err);

      if (
        err.code ===
        'auth/popup-closed-by-user'
      ) {
        setError(
          'Google sign-in was cancelled.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Google sign-in failed.'
        );
      }
    }

    setLoading(false);
  };

  /*
   * Forgot password
   */
  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError(
        'Please enter your email.'
      );
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setSuccess(
        'Password reset link sent! Check your inbox.'
      );
    } catch (err) {
      if (
        err.code ===
        'auth/user-not-found'
      ) {
        setError(
          'No account found with this email.'
        );
      } else {
        setError(
          'Unable to send reset email.'
        );
      }
    }

    setLoading(false);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container">

          <a
            href="/"
            style={{
              textDecoration: 'none',
              color: '#23517f',
              fontSize: '20px',
            }}
          >
            ←
          </a>

          <a
            className="navbar-brand fw-bold fs-3 mx-auto"
            href="/"
            style={{
              textDecoration: 'none',
            }}
          >
            🩺{' '}
            <span
              style={{
                color: '#074481',
              }}
            >
              Doc
            </span>
            <span
              style={{
                color: '#2c64a0',
                fontStyle: 'italic',
              }}
            >
              Ping
            </span>
          </a>

          <div
            style={{
              width: '40px',
            }}
          />
        </div>
      </nav>

      {/* Main */}
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          minHeight: '85vh',
          background: '#f0f6fb',
          paddingTop: '40px',
          paddingBottom: '40px',
        }}
      >
        <div
          className="card p-4 shadow-sm"
          style={{
            width: '440px',
            borderRadius: '16px',
          }}
        >

          {/* Forgot password */}
          {isForgot ? (
            <>
              <h4
                className="fw-bold mb-1"
                style={{
                  color: '#1e4872',
                }}
              >
                Forgot password?
              </h4>

              <p
                className="text-muted mb-4"
                style={{
                  fontSize: '14px',
                }}
              >
                Enter your email and
                we'll send a reset link.
              </p>

              <div className="mb-3">
                <label
                  className="form-label fw-medium"
                  style={{
                    fontSize: '13px',
                    color: '#555',
                  }}
                >
                  Email
                </label>

                <input
                  type="email"
                  className="form-control"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  style={{
                    borderRadius: '8px',
                  }}
                />
              </div>

              {error && (
                <div
                  className="alert alert-danger py-2"
                  style={{
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="alert alert-success py-2"
                  style={{
                    fontSize: '13px',
                  }}
                >
                  {success}
                </div>
              )}

              <button
                onClick={
                  handleForgotPassword
                }
                disabled={loading}
                className="btn w-100 py-2 mb-3"
                style={{
                  background:
                    '#23517f',
                  color: 'white',
                  borderRadius:
                    '8px',
                }}
              >
                {loading
                  ? 'Sending...'
                  : 'Send reset link'}
              </button>

              <div
                className="text-center"
                style={{
                  fontSize: '13px',
                }}
              >
                <span
                  onClick={() =>
                    navigate('/login')
                  }
                  style={{
                    color: '#23517f',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ← Back to login
                </span>
              </div>
            </>
          ) : (
            <>
              <h4
                className="fw-bold mb-1"
                style={{
                  color: '#1e4872',
                }}
              >
                {isLogin
                  ? 'Welcome back'
                  : 'Create account'}
              </h4>

              <p
                className="text-muted mb-3"
                style={{
                  fontSize: '14px',
                }}
              >
                {isLogin
                  ? 'Login to continue to DocPing'
                  : 'Create your DocPing account'}
              </p>

              {/* Role selector ONLY on signup */}
              {!isLogin && (
                <>
                  <p
                    className="fw-medium mb-2"
                    style={{
                      fontSize: '13px',
                      color: '#555',
                    }}
                  >
                    I am a...
                  </p>

                  <div className="d-flex gap-2 mb-3">

                    <button
                      onClick={() =>
                        setRole(
                          'patient'
                        )
                      }
                      className="btn flex-fill py-2"
                      style={{
                        border:
                          role ===
                          'patient'
                            ? '2px solid #23517f'
                            : '1px solid #dee2e6',
                        background:
                          role ===
                          'patient'
                            ? '#eef4fb'
                            : 'white',
                        borderRadius:
                          '10px',
                        color:
                          '#23517f',
                        fontWeight:
                          role ===
                          'patient'
                            ? 'bold'
                            : 'normal',
                      }}
                    >
                      👤 Patient
                    </button>

                    <button
                      onClick={() =>
                        setRole(
                          'doctor'
                        )
                      }
                      className="btn flex-fill py-2"
                      style={{
                        border:
                          role ===
                          'doctor'
                            ? '2px solid #23517f'
                            : '1px solid #dee2e6',
                        background:
                          role ===
                          'doctor'
                            ? '#eef4fb'
                            : 'white',
                        borderRadius:
                          '10px',
                        color:
                          '#23517f',
                        fontWeight:
                          role ===
                          'doctor'
                            ? 'bold'
                            : 'normal',
                      }}
                    >
                      🩺 Doctor
                    </button>

                  </div>
                </>
              )}

              {/* Signup fields */}
              {!isLogin && (
                <>
                  <div className="mb-3">
                    <label
                      className="form-label"
                      style={{
                        fontSize: '13px',
                      }}
                    >
                      Full name *
                    </label>

                    <input
                      className="form-control"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="row">

                    <div className="col-6 mb-3">
                      <label
                        className="form-label"
                        style={{
                          fontSize:
                            '13px',
                        }}
                      >
                        Phone
                      </label>

                      <input
                        className="form-control"
                        placeholder="01XXXXXXXXX"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="col-6 mb-3">
                      <label
                        className="form-label"
                        style={{
                          fontSize:
                            '13px',
                        }}
                      >
                        Age
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        placeholder="25"
                        value={age}
                        onChange={(e) =>
                          setAge(
                            e.target.value
                          )
                        }
                      />
                    </div>

                  </div>

                  {/* Doctor fields */}
                  {role === 'doctor' && (
                    <>
                      <div className="mb-3">
                        <label
                          className="form-label"
                          style={{
                            fontSize:
                              '13px',
                          }}
                        >
                          Specialty *
                        </label>

                        <select
                          className="form-select"
                          value={
                            specialty
                          }
                          onChange={(e) =>
                            setSpecialty(
                              e.target.value
                            )
                          }
                        >
                          <option>
                            Cardiologist
                          </option>
                          <option>
                            Neurologist
                          </option>
                          <option>
                            Dentist
                          </option>
                          <option>
                            Eye Care
                          </option>
                          <option>
                            Pediatrician
                          </option>
                          <option>
                            Orthopedic
                          </option>
                          <option>
                            Dermatologist
                          </option>
                          <option>
                            General
                          </option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label
                          className="form-label"
                          style={{
                            fontSize:
                              '13px',
                          }}
                        >
                          Qualifications
                        </label>

                        <input
                          className="form-control"
                          placeholder="MBBS, FCPS..."
                          value={
                            qualifications
                          }
                          onChange={(e) =>
                            setQualifications(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>

                      <div className="row">

                        <div className="col-6 mb-3">
                          <label
                            className="form-label"
                            style={{
                              fontSize:
                                '13px',
                            }}
                          >
                            Experience
                          </label>

                          <input
                            type="number"
                            className="form-control"
                            placeholder="5"
                            value={
                              experienceYears
                            }
                            onChange={(
                              e
                            ) =>
                              setExperienceYears(
                                e.target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div className="col-6 mb-3">
                          <label
                            className="form-label"
                            style={{
                              fontSize:
                                '13px',
                            }}
                          >
                            Fee
                          </label>

                          <input
                            type="number"
                            className="form-control"
                            placeholder="1000"
                            value={fee}
                            onChange={(e) =>
                              setFee(
                                e.target
                                  .value
                              )
                            }
                          />
                        </div>

                      </div>

                      <div className="mb-3">
                        <label
                          className="form-label"
                          style={{
                            fontSize:
                              '13px',
                          }}
                        >
                          Bio
                        </label>

                        <textarea
                          className="form-control"
                          rows="2"
                          value={bio}
                          onChange={(e) =>
                            setBio(
                              e.target
                                .value
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Email */}
              <div className="mb-3">
                <label
                  className="form-label"
                  style={{
                    fontSize: '13px',
                  }}
                >
                  Email
                </label>

                <input
                  type="email"
                  className="form-control"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                />
              </div>

              {/* Password */}
              <div className="mb-3">
                <label
                  className="form-label"
                  style={{
                    fontSize: '13px',
                  }}
                >
                  Password
                </label>

                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />
              </div>

              {error && (
                <div
                  className="alert alert-danger py-2"
                  style={{
                    fontSize: '13px',
                  }}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="alert alert-success py-2"
                  style={{
                    fontSize: '13px',
                  }}
                >
                  {success}
                </div>
              )}

              {isLogin && (
                <div className="text-end mb-3">
                  <span
                    onClick={() =>
                      navigate(
                        '/forgot'
                      )
                    }
                    style={{
                      fontSize: '13px',
                      color:
                        '#23517f',
                      cursor:
                        'pointer',
                    }}
                  >
                    Forgot password?
                  </span>
                </div>
              )}

              <button
                onClick={
                  isLogin
                    ? handleLogin
                    : handleSignup
                }
                disabled={loading}
                className="btn w-100 py-2 mb-3"
                style={{
                  background:
                    '#23517f',
                  color: 'white',
                  borderRadius:
                    '8px',
                }}
              >
                {loading
                  ? 'Please wait...'
                  : isLogin
                  ? 'Login'
                  : 'Create Account'}
              </button>

              <div className="d-flex align-items-center gap-2 mb-3">
                <hr className="flex-grow-1" />

                <span
                  style={{
                    fontSize: '13px',
                    color: '#999',
                  }}
                >
                  or
                </span>

                <hr className="flex-grow-1" />
              </div>

              <button
                onClick={
                  handleGoogle
                }
                disabled={loading}
                className="btn w-100 py-2 mb-3"
                style={{
                  border:
                    '1px solid #dee2e6',
                  borderRadius:
                    '8px',
                  background:
                    'white',
                }}
              >
                Continue with Google
              </button>

              <p
                className="text-center mb-0"
                style={{
                  fontSize: '13px',
                  color: '#555',
                }}
              >
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}

                <span
                  onClick={() =>
                    navigate(
                      isLogin
                        ? '/signup'
                        : '/login'
                    )
                  }
                  style={{
                    color:
                      '#23517f',
                    cursor:
                      'pointer',
                    fontWeight:
                      'bold',
                  }}
                >
                  {isLogin
                    ? 'Sign up'
                    : 'Login'}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Login;