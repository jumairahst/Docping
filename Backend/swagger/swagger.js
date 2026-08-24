const swaggerJSDoc = require('swagger-jsdoc');

const bearer = { security: [{ bearerAuth: [] }] };

const errorResponses = {
  400: { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  401: { description: 'Unauthorized - missing/invalid Firebase token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  403: { description: 'Forbidden - wrong role', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DocPing API',
      version: '1.0.0',
      description:
        'RESTful backend for the DocPing doctor appointment platform. ' +
        'Authentication uses Firebase: send the Firebase ID token as `Authorization: Bearer <token>`.',
    },
    servers: [{ url: '/api', description: 'Local server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firebaseUid: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['patient', 'doctor'] },
            name: { type: 'string' },
            phone: { type: 'string' },
            age: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Doctor: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            name: { type: 'string' },
            specialty: { type: 'string' },
            qualifications: { type: 'string' },
            experienceYears: { type: 'number' },
            fee: { type: 'number' },
            bio: { type: 'string' },
            avgRating: { type: 'number' },
            reviewCount: { type: 'number' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patient: { type: 'string' },
            doctor: { type: 'string' },
            date: { type: 'string', example: '2026-08-16' },
            timeSlot: { type: 'string', example: '10:30 AM' },
            status: { type: 'string', enum: ['confirmed', 'completed', 'cancelled'] },
            active: { type: 'boolean', description: 'false when cancelled; frees the slot.' },
            notes: { type: 'string' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            doctor: { type: 'string' },
            patient: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Availability: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            doctor: { type: 'string' },
            date: { type: 'string', example: '2026-08-16' },
            timeSlots: { type: 'array', items: { type: 'string', example: '10:30 AM' } },
            bookedSlots: {
              type: 'array',
              items: { type: 'string' },
              description: 'Returned on GET; slots already booked for the date.',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        RegisterBody: {
          type: 'object',
          required: ['role', 'name'],
          properties: {
            role: { type: 'string', enum: ['patient', 'doctor'] },
            name: { type: 'string' },
            phone: { type: 'string' },
            age: { type: 'number' },
            specialty: { type: 'string', description: 'Required when role is doctor.' },
            qualifications: { type: 'string' },
            experienceYears: { type: 'number' },
            fee: { type: 'number' },
            bio: { type: 'string' },
          },
        },
        CreateAppointmentBody: {
          type: 'object',
          required: ['doctorId', 'date', 'timeSlot'],
          properties: {
            doctorId: { type: 'string' },
            date: { type: 'string', example: '2026-08-16' },
            timeSlot: { type: 'string', example: '10:30 AM' },
            notes: { type: 'string' },
          },
        },
        CreateReviewBody: {
          type: 'object',
          required: ['doctorId', 'rating'],
          properties: {
            doctorId: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
          },
        },
        AvailabilityBody: {
          type: 'object',
          required: ['date', 'timeSlots'],
          properties: {
            date: { type: 'string', example: '2026-08-16' },
            timeSlots: { type: 'array', items: { type: 'string', example: '10:30 AM' } },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register the Firebase user in DocPing',
          description:
            'Call after a successful Firebase sign-up/sign-in. The Firebase ID token is verified server-side, then a User (and Doctor profile when role=doctor) is created.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
          },
          responses: {
            201: { description: 'Registered' },
            ...errorResponses,
          },
        },
      },
      '/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Get own profile',
          ...bearer,
          responses: { 200: { description: 'Current user and doctor profile (if doctor)' }, ...errorResponses },
        },
        put: {
          tags: ['Users'],
          summary: 'Update own profile',
          ...bearer,
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, age: { type: 'number' } } },
              },
            },
          },
          responses: { 200: { description: 'Updated profile' }, ...errorResponses },
        },
      },
      '/doctors': {
        get: {
          tags: ['Doctors'],
          summary: 'List doctors',
          parameters: [
            { name: 'specialty', in: 'query', schema: { type: 'string' }, description: 'Filter by specialty.' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or specialty.' },
            { name: 'minRating', in: 'query', schema: { type: 'number' }, description: 'Minimum average rating.' },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['rating', 'fee', '-fee', 'newest'] }, description: 'Sort order.' },
            { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Page size (max 100).' },
            { name: 'skip', in: 'query', schema: { type: 'integer' }, description: 'Offset for pagination.' },
          ],
          responses: { 200: { description: 'List of doctors' }, ...errorResponses },
        },
      },
      '/doctors/{id}': {
        get: {
          tags: ['Doctors'],
          summary: 'Get a doctor by id',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Doctor profile' }, ...errorResponses },
        },
      },
      '/doctors/me': {
        put: {
          tags: ['Doctors'],
          summary: 'Update own doctor profile (doctor only)',
          ...bearer,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    specialty: { type: 'string' },
                    qualifications: { type: 'string' },
                    experienceYears: { type: 'number' },
                    fee: { type: 'number' },
                    bio: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated doctor profile' }, ...errorResponses },
        },
        delete: {
          tags: ['Doctors'],
          summary: 'Delete own doctor profile (doctor only)',
          ...bearer,
          responses: { 200: { description: 'Deleted' }, ...errorResponses },
        },
      },
      '/appointments': {
        post: {
          tags: ['Appointments'],
          summary: 'Book an appointment (patient only)',
          ...bearer,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAppointmentBody' } } },
          },
          responses: { 201: { description: 'Booked' }, ...errorResponses },
        },
      },
      '/appointments/my': {
        get: {
          tags: ['Appointments'],
          summary: 'List own appointments (patient only)',
          ...bearer,
          responses: { 200: { description: 'Appointments' }, ...errorResponses },
        },
      },
      '/appointments/doctor': {
        get: {
          tags: ['Appointments'],
          summary: 'List assigned appointments (doctor only)',
          ...bearer,
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['confirmed', 'completed', 'cancelled'] } }],
          responses: { 200: { description: 'Appointments' }, ...errorResponses },
        },
      },
      '/appointments/{id}/status': {
        put: {
          tags: ['Appointments'],
          summary: 'Update appointment status (doctor only)',
          ...bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['confirmed', 'completed', 'cancelled'] } } },
              },
            },
          },
          responses: { 200: { description: 'Updated' }, ...errorResponses },
        },
      },
      '/appointments/{id}/cancel': {
        put: {
          tags: ['Appointments'],
          summary: 'Cancel own appointment (patient only)',
          ...bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Cancelled' }, ...errorResponses },
        },
      },
      '/reviews/doctor/{doctorId}': {
        get: {
          tags: ['Reviews'],
          summary: 'List reviews for a doctor',
          parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Reviews' }, ...errorResponses },
        },
      },
      '/reviews': {
        post: {
          tags: ['Reviews'],
          summary: 'Create a review (patient only, requires a completed appointment)',
          ...bearer,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReviewBody' } } },
          },
          responses: { 201: { description: 'Created' }, ...errorResponses },
        },
      },
      '/reviews/{id}': {
        put: {
          tags: ['Reviews'],
          summary: 'Update own review (patient only)',
          ...bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { rating: { type: 'number' }, comment: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Updated' }, ...errorResponses },
        },
        delete: {
          tags: ['Reviews'],
          summary: 'Delete own review (patient only)',
          ...bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' }, ...errorResponses },
        },
      },
      '/availability/doctor/{doctorId}': {
        get: {
          tags: ['Availability'],
          summary: 'List availability for a doctor (optionally filtered by date)',
          parameters: [
            { name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', schema: { type: 'string', example: '2026-08-16' } },
          ],
          responses: { 200: { description: 'Availability with booked slots' }, ...errorResponses },
        },
      },
      '/availability': {
        post: {
          tags: ['Availability'],
          summary: 'Create or update availability for a date (doctor only)',
          ...bearer,
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AvailabilityBody' } } },
          },
          responses: { 201: { description: 'Created' }, ...errorResponses },
        },
      },
      '/availability/{id}': {
        put: {
          tags: ['Availability'],
          summary: 'Update availability entry (doctor only)',
          ...bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AvailabilityBody' } } },
          },
          responses: { 200: { description: 'Updated' }, ...errorResponses },
        },
        delete: {
          tags: ['Availability'],
          summary: 'Delete availability entry (doctor only)',
          ...bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' }, ...errorResponses },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
