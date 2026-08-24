const getAbout = async (req, res) => {
  res.json({
    hero: {
      eyebrow: 'ABOUT DOCPING',
      title: 'Better Doctors. Better Care. Anytime.',
      description:
        'DocPing is your trusted healthcare platform to connect with experienced doctors and book appointments instantly. We make healthcare simple, accessible, and reliable.',
    },

    values: [
      {
        title: 'Expert Doctors',
        icon: '👨‍⚕️',
        iconBg: '#e9f3ff',
        text:
          'Connect with verified and experienced doctors across a wide range of specialties.',
      },
      {
        title: 'Easy Appointments',
        icon: '📅',
        iconBg: '#e9fbf3',
        text:
          'Book appointments instantly and manage your schedule with ease.',
      },
      {
        title: 'Secure & Private',
        icon: '🔒',
        iconBg: '#f0edff',
        text:
          'Your personal healthcare information stays safe and confidential.',
      },
      {
        title: 'Patient First',
        icon: '🤲',
        iconBg: '#fff0e8',
        text:
          'We put your health first and focus on providing a smooth experience.',
      },
    ],

    mission: {
      title: 'OUR MISSION',
      text:
        'To make quality healthcare accessible to everyone by connecting patients with trusted doctors through technology and compassion.',
    },

    vision: {
      title: 'OUR VISION',
      text:
        'A healthier world where everyone has easy access to the right care, at the right time.',
    },

    stats: [
      {
        number: '10K+',
        label: 'Happy Patients',
        icon: '☺',
      },
      {
        number: '200+',
        label: 'Expert Doctors',
        icon: '👨‍⚕️',
      },
      {
        number: '50K+',
        label: 'Appointments Booked',
        icon: '📅',
      },
      {
        number: '100%',
        label: 'Secure & Reliable',
        icon: '🛡️',
      },
    ],
  });
};

module.exports = {
  getAbout,
};