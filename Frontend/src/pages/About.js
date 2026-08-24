import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  signOut,
} from 'firebase/auth';

import { auth } from '../firebase';
import api from '../api';

import {
  useAuthProfile,
} from '../authProfile';

function About() {
  const navigate = useNavigate();

  const {
    authUser: user,
    profileName,
    authLoading,
  } = useAuthProfile();

  const missionRef =
    useRef(null);

  const [missionHighlight, setMissionHighlight] =
    useState(false);

  const [aboutData, setAboutData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * About page is only for logged-out users.
   */
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', {
        replace: true,
      });
    }
  }, [
    authLoading,
    user,
    navigate,
  ]);

  /*
   * Load About content from backend.
   */
  useEffect(() => {
    const loadAbout =
      async () => {
        try {
          const response =
            await api.get(
              '/about'
            );

          setAboutData(
            response.data
          );
        } catch (err) {
          console.error(
            'Unable to load About page:',
            err
          );

          setError(
            'Unable to load About information.'
          );
        } finally {
          setLoading(false);
        }
      };

    if (
      !authLoading &&
      !user
    ) {
      loadAbout();
    }
  }, [
    authLoading,
    user,
  ]);

  /*
   * Our Mission button
   */
  const handleMissionClick =
    () => {
      missionRef.current?.scrollIntoView(
        {
          behavior: 'smooth',
          block: 'center',
        }
      );

      setMissionHighlight(
        true
      );

      window.setTimeout(() => {
        setMissionHighlight(
          false
        );
      }, 2200);
    };

  /*
   * Logout
   */
  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        navigate('/', {
          replace: true,
        });
      } catch (err) {
        console.error(
          'Logout failed:',
          err
        );
      }
    };

  /*
   * Authentication loading
   */
  if (authLoading) {
    return (
      <div
        style={{
          minHeight:
            '100vh',
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
          background:
            '#f7fbff',
        }}
      >
        <div
          className="spinner-border"
          style={{
            color:
              '#23517f',
          }}
        />
      </div>
    );
  }

  /*
   * Logged-in users are redirected to Home.
   */
  if (user) {
    return null;
  }

  /*
   * Loading About content
   */
  if (loading) {
    return (
      <div
        style={{
          minHeight:
            '100vh',
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
          background:
            '#f7fbff',
        }}
      >
        <div
          className="spinner-border"
          style={{
            color:
              '#23517f',
          }}
        />
      </div>
    );
  }

  const data =
    aboutData || {
      hero: {
        eyebrow:
          'ABOUT DOCPING',
        title:
          'Better Doctors. Better Care. Anytime.',
        description:
          'DocPing connects patients with trusted doctors and makes healthcare simple, accessible, and convenient.',
      },
      values: [],
      mission: {
        title:
          'OUR MISSION',
        text:
          'To make quality healthcare accessible to everyone by connecting patients with trusted doctors through technology and compassion.',
      },
      vision: {
        title:
          'OUR VISION',
        text:
          'A healthier world where everyone has easy access to the right care at the right time.',
      },
      stats: [],
    };

  return (
    <div
      style={{
        background:
          '#ffffff',
        color:
          '#13233a',
        minHeight:
          '100vh',
      }}
    >
      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav
        className="navbar navbar-expand-lg bg-white border-bottom"
        style={{
          position:
            'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow:
            '0 2px 14px rgba(20,60,100,0.06)',
        }}
      >
        <div className="container py-2">

          {/* Logo */}

          <a
            href="/"
            className="navbar-brand fw-bold"
            style={{
              textDecoration:
                'none',
              fontSize:
                '30px',
              color:
                '#074481',
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

          {/* Navigation */}

          <div className="d-flex align-items-center gap-4">

            <a
              href="/"
              style={{
                textDecoration:
                  'none',
                color:
                  '#666',
                fontWeight:
                  500,
                fontSize:
                  '15px',
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
                  '#666',
                fontWeight:
                  500,
                fontSize:
                  '15px',
              }}
            >
              Doctors
            </a>

            <a
              href="/about"
              style={{
                textDecoration:
                  'none',
                color:
                  '#23517f',
                fontWeight:
                  700,
                fontSize:
                  '15px',
                paddingBottom:
                  '5px',
                borderBottom:
                  '2px solid #23517f',
              }}
            >
              About
            </a>

            <a
              href="/login"
              className="btn"
              style={{
                border:
                  '1px solid #b9cde2',
                color:
                  '#164c82',
                borderRadius:
                  '9px',
                padding:
                  '9px 22px',
                fontWeight:
                  600,
              }}
            >
              Login
            </a>

            <a
              href="/signup"
              className="btn"
              style={{
                background:
                  '#23517f',
                color:
                  '#fff',
                borderRadius:
                  '9px',
                padding:
                  '9px 22px',
                fontWeight:
                  600,
              }}
            >
              Sign Up
            </a>

          </div>
        </div>
      </nav>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="container pt-3">
          <div className="alert alert-danger">
            {error}
          </div>
        </div>
      )}

      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        style={{
          background:
            'linear-gradient(135deg, #edf7ff 0%, #d8ebff 100%)',
          overflow:
            'hidden',
        }}
      >
        <div
          className="container"
          style={{
            padding:
              '85px 0 90px',
          }}
        >
          <div className="row align-items-center g-5">

            {/* Left */}

            <div className="col-lg-6">

              <div
                style={{
                  color:
                    '#3775b9',
                  fontWeight:
                    800,
                  letterSpacing:
                    '1.6px',
                  fontSize:
                    '14px',
                  marginBottom:
                    '15px',
                }}
              >
                {data.hero.eyebrow}
              </div>

              <h1
                style={{
                  fontSize:
                    '56px',
                  lineHeight:
                    '1.08',
                  fontWeight:
                    800,
                  color:
                    '#112c4b',
                  maxWidth:
                    '650px',
                  marginBottom:
                    '22px',
                }}
              >
                Better Doctors.
                <br />
                Better Care.
                <br />
                Anytime.
              </h1>

              <p
                style={{
                  fontSize:
                    '17px',
                  lineHeight:
                    '1.8',
                  color:
                    '#53677e',
                  maxWidth:
                    '560px',
                  marginBottom:
                    '28px',
                }}
              >
                {data.hero.description}
              </p>

              <button
                type="button"
                onClick={
                  handleMissionClick
                }
                style={{
                  border:
                    'none',
                  background:
                    '#23517f',
                  color:
                    'white',
                  borderRadius:
                    '9px',
                  padding:
                    '13px 23px',
                  fontWeight:
                    700,
                  fontSize:
                    '15px',
                  boxShadow:
                    '0 8px 20px rgba(35,81,127,0.18)',
                }}
              >
                Our Mission
                <span
                  style={{
                    marginLeft:
                      '10px',
                    fontSize:
                      '18px',
                  }}
                >
                  →
                </span>
              </button>

            </div>

            {/* Right visual */}

            <div className="col-lg-6">

              <div
                style={{
                  position:
                    'relative',
                  minHeight:
                    '430px',
                }}
              >

                {/* Main visual card */}

                <div
                  style={{
                    position:
                      'absolute',
                    inset:
                      '20px 0 20px 40px',
                    borderRadius:
                      '28px',
                    background:
                      'linear-gradient(145deg, #c7def2, #edf6ff)',
                    boxShadow:
                      '0 25px 55px rgba(40,90,130,0.14)',
                    overflow:
                      'hidden',
                  }}
                >

                  <div
                    style={{
                      position:
                        'absolute',
                      width:
                        '240px',
                      height:
                        '240px',
                      borderRadius:
                        '50%',
                      background:
                        'rgba(255,255,255,0.55)',
                      top:
                        '30px',
                      right:
                        '-45px',
                    }}
                  />

                  <div
                    style={{
                      position:
                        'absolute',
                      width:
                        '210px',
                      height:
                        '210px',
                      borderRadius:
                        '50%',
                      background:
                        'rgba(35,81,127,0.10)',
                      bottom:
                        '-40px',
                      left:
                        '-35px',
                    }}
                  />

                  <div
                    style={{
                      position:
                        'absolute',
                      top:
                        '75px',
                      left:
                        '70px',
                      fontSize:
                        '115px',
                    }}
                  >
                    👩‍⚕️
                  </div>

                  <div
                    style={{
                      position:
                        'absolute',
                      top:
                        '125px',
                      right:
                        '78px',
                      fontSize:
                        '100px',
                    }}
                  >
                    👩🏻
                  </div>

                  <div
                    style={{
                      position:
                        'absolute',
                      bottom:
                        '72px',
                      left:
                        '90px',
                      width:
                        '230px',
                      height:
                        '125px',
                      borderRadius:
                        '28px 28px 0 0',
                      background:
                        '#ffffff',
                      opacity:
                        0.85,
                    }}
                  />

                  <div
                    style={{
                      position:
                        'absolute',
                      bottom:
                        '40px',
                      left:
                        '115px',
                      width:
                        '180px',
                      height:
                        '88px',
                      borderRadius:
                        '18px',
                      background:
                        '#edf6ff',
                      boxShadow:
                        '0 10px 25px rgba(40,90,130,0.08)',
                    }}
                  >
                    <div
                      style={{
                        padding:
                          '18px',
                        textAlign:
                          'center',
                        color:
                          '#23517f',
                        fontWeight:
                          700,
                        fontSize:
                          '14px',
                      }}
                    >
                      Easy healthcare
                      <br />
                      for everyone
                    </div>
                  </div>

                </div>

                {/* Trust badge */}

                <div
                  style={{
                    position:
                      'absolute',
                    right:
                      '-5px',
                    bottom:
                      '35px',
                    background:
                      'rgba(255,255,255,0.96)',
                    borderRadius:
                      '18px',
                    padding:
                      '18px 20px',
                    textAlign:
                      'center',
                    boxShadow:
                      '0 12px 35px rgba(30,80,120,0.14)',
                    minWidth:
                      '150px',
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        '25px',
                      marginBottom:
                        '5px',
                    }}
                  >
                    🛡️
                  </div>

                  <div
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#708095',
                    }}
                  >
                    Trusted by
                  </div>

                  <div
                    style={{
                      color:
                        '#173d65',
                      fontWeight:
                        800,
                      fontSize:
                        '14px',
                    }}
                  >
                    Thousands
                  </div>

                  <div
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#708095',
                    }}
                  >
                    of Patients
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY DOCPING
      ====================================================== */}

      <section
        style={{
          background:
            '#fff',
          padding:
            '72px 0 58px',
        }}
      >
        <div className="container">

          <div
            className="text-center"
            style={{
              marginBottom:
                '38px',
            }}
          >

            <div
              style={{
                color:
                  '#3b78ba',
                fontWeight:
                  800,
                letterSpacing:
                  '1.4px',
                fontSize:
                  '13px',
              }}
            >
              WHY DOCPING?
            </div>

            <h2
              style={{
                color:
                  '#1b3757',
                fontWeight:
                  800,
                fontSize:
                  '31px',
                maxWidth:
                  '700px',
                margin:
                  '12px auto 0',
              }}
            >
              We are here to make your
              healthcare journey
              <br />
              smoother and more convenient.
            </h2>

          </div>

          <div className="row g-3">

            {data.values.map(
              (value, index) => (
                <div
                  className="col-md-6 col-lg-3"
                  key={index}
                >
                  <div
                    style={{
                      height:
                        '100%',
                      padding:
                        '24px',
                      border:
                        '1px solid #dce9f4',
                      borderRadius:
                        '18px',
                      background:
                        '#fff',
                      boxShadow:
                        '0 7px 22px rgba(38,89,130,0.05)',
                    }}
                  >

                    <div
                      style={{
                        width:
                          '56px',
                        height:
                          '56px',
                        borderRadius:
                          '18px',
                        background:
                          value.iconBg ||
                          '#eaf4ff',
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        fontSize:
                          '27px',
                        marginBottom:
                          '18px',
                      }}
                    >
                      {value.icon}
                    </div>

                    <h5
                      style={{
                        color:
                          '#14385e',
                        fontWeight:
                          800,
                        fontSize:
                          '17px',
                      }}
                    >
                      {value.title}
                    </h5>

                    <p
                      style={{
                        color:
                          '#6b7c90',
                        fontSize:
                          '13px',
                        lineHeight:
                          '1.75',
                        marginBottom:
                          0,
                      }}
                    >
                      {value.text}
                    </p>

                  </div>
                </div>
              )
            )}

          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION + VISION
      ====================================================== */}

      <section
        ref={missionRef}
        style={{
          background:
            missionHighlight
              ? '#e0efff'
              : '#f3f8fd',
          padding:
            '50px 0',
          transition:
            'all 0.45s ease',
          scrollMarginTop:
            '90px',
          boxShadow:
            missionHighlight
              ? 'inset 0 0 0 3px rgba(35,81,127,0.22), 0 0 35px rgba(35,81,127,0.10)'
              : 'none',
        }}
      >
        <div className="container">

          <div
            style={{
              background:
                '#eef6ff',
              borderRadius:
                '22px',
              padding:
                '42px',
                boxShadow:
                missionHighlight
                  ? '0 18px 55px rgba(35,81,127,0.12)'
                  : 'none',
              transition:
                'all 0.45s ease',
            }}
          >

            <div className="row align-items-center g-4">

              {/* Mission */}

              <div className="col-lg-4">

                <div className="d-flex gap-3">

                  <div
                    style={{
                      width:
                        '56px',
                      height:
                        '56px',
                      borderRadius:
                        '50%',
                      background:
                        '#3d78d0',
                      color:
                        '#fff',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      fontSize:
                        '24px',
                      flexShrink:
                        0,
                    }}
                  >
                    🚀
                  </div>

                  <div>
                    <div
                      style={{
                        color:
                          '#23517f',
                        fontWeight:
                          800,
                        fontSize:
                          '13px',
                        letterSpacing:
                          '0.8px',
                        marginBottom:
                          '9px',
                      }}
                    >
                      {data.mission.title}
                    </div>

                    <p
                      style={{
                        color:
                          '#607289',
                        fontSize:
                          '13px',
                        lineHeight:
                          '1.75',
                        marginBottom:
                          0,
                      }}
                    >
                      {data.mission.text}
                    </p>
                  </div>

                </div>

              </div>

              {/* Center visual */}

              <div className="col-lg-4 text-center">

                <div
                  style={{
                    fontSize:
                      '110px',
                    lineHeight:
                      1,
                    filter:
                      'drop-shadow(0 10px 16px rgba(47,109,165,0.14))',
                  }}
                >
                  🩺
                </div>

                <div
                  style={{
                    color:
                      '#7090ad',
                    fontSize:
                      '11px',
                    marginTop:
                      '8px',
                    letterSpacing:
                      '1px',
                  }}
                >
                  CARE • TRUST • CONNECTION
                </div>

              </div>

              {/* Vision */}

              <div className="col-lg-4">

                <div className="d-flex gap-3">

                  <div
                    style={{
                      width:
                        '56px',
                      height:
                        '56px',
                      borderRadius:
                        '50%',
                      background:
                        '#3d78d0',
                      color:
                        '#fff',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      fontSize:
                        '24px',
                      flexShrink:
                        0,
                    }}
                  >
                    👁️
                  </div>

                  <div>
                    <div
                      style={{
                        color:
                          '#23517f',
                        fontWeight:
                          800,
                        fontSize:
                          '13px',
                        letterSpacing:
                          '0.8px',
                        marginBottom:
                          '9px',
                      }}
                    >
                      {data.vision.title}
                    </div>

                    <p
                      style={{
                        color:
                          '#607289',
                        fontSize:
                          '13px',
                        lineHeight:
                          '1.75',
                        marginBottom:
                          0,
                      }}
                    >
                      {data.vision.text}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}

      <section
        style={{
          padding:
            '30px 0 60px',
          background:
            '#fff',
        }}
      >
        <div className="container">

          <div
            style={{
              borderRadius:
                '20px',
              background:
                '#23579b',
              padding:
                '28px 25px',
              color:
                '#fff',
              boxShadow:
                '0 18px 40px rgba(35,81,127,0.18)',
            }}
          >

            <div className="row g-4">

              {data.stats.map(
                (stat, index) => (
                  <div
                    className="col-6 col-lg-3"
                    key={index}
                  >
                    <div
                      className="d-flex align-items-center gap-3"
                    >

                      <div
                        style={{
                          width:
                            '48px',
                          height:
                            '48px',
                          borderRadius:
                            '14px',
                          background:
                            'rgba(255,255,255,0.13)',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          fontSize:
                            '22px',
                        }}
                      >
                        {stat.icon}
                      </div>

                      <div>

                        <div
                          style={{
                            fontSize:
                              '26px',
                            fontWeight:
                              800,
                            lineHeight:
                              1,
                          }}
                        >
                          {stat.number}
                        </div>

                        <div
                          style={{
                            fontSize:
                              '12px',
                            opacity:
                              0.9,
                            marginTop:
                              '5px',
                          }}
                        >
                          {stat.label}
                        </div>

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        style={{
          borderTop:
            '1px solid #e4edf5',
          padding:
            '22px 0',
          background:
            '#fbfdff',
        }}
      >
        <div
          className="container d-flex justify-content-between align-items-center"
        >
          <div
            style={{
              fontWeight:
                800,
              color:
                '#23517f',
            }}
          >
            🩺 DocPing
          </div>

          <div
            style={{
              color:
                '#8392a3',
              fontSize:
                '12px',
            }}
          >
            Better care. Better connection.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default About;