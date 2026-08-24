import React from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Home from './pages/Home';
import DoctorList from './pages/DoctorList';
import Login from './pages/login';
import BookAppointment from './pages/BookAppointment';
import PatientDashboard from './pages/PatientDashboard';
import DoctorReview from './pages/DoctorReview';
import DoctorDashboard from './pages/DoctorDashboard';
import About from './pages/About';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Doctors */}
        <Route
          path="/doctors"
          element={<DoctorList />}
        />

        {/* About - logged out only */}
        <Route
          path="/about"
          element={<About />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Login />}
        />

        <Route
          path="/forgot"
          element={<Login />}
        />

        {/* Booking */}
        <Route
          path="/book"
          element={
            <BookAppointment />
          }
        />

        {/* Patient Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PatientDashboard />
          }
        />

        {/* Reviews */}
        <Route
          path="/reviews"
          element={
            <DoctorReview />
          }
        />

        {/* Doctor Dashboard */}
        <Route
          path="/doctor-dashboard"
          element={
            <DoctorDashboard />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;