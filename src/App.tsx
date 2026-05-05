/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FormPage from './pages/FormPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/avaliacao-nutec" element={<FormPage sector="NUTEC" />} />
          <Route path="/avaliacao-mac" element={<FormPage sector="MAC" />} />
          <Route path="/avaliacao-aps" element={<FormPage sector="APS" />} />
          <Route path="/nutec" element={<FormPage sector="NUTEC" />} />
          <Route path="/mac" element={<FormPage sector="MAC" />} />
          <Route path="/aps" element={<FormPage sector="APS" />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
