import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RSVPProvider } from './context/RSVPContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RSVPProvider>
            <Home />
          </RSVPProvider>
        }
      />
      <Route
        path="/rsvp/:groupId"
        element={
          <RSVPProvider>
            <Home />
          </RSVPProvider>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
