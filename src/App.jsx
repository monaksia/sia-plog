import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminGuard from './components/AdminGuard';
import Home from './pages/Home';
import Photography from './pages/Photography';
import MovieReviews from './pages/MovieReviews';
import BookReviews from './pages/BookReviews';
import ReviewDetail from './pages/ReviewDetail';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminLogin from './pages/Admin/AdminLogin';
import Dashboard from './pages/Admin/Dashboard';
import PhotosManager from './pages/Admin/PhotosManager';
import MoviesManager from './pages/Admin/MoviesManager';
import BooksManager from './pages/Admin/BooksManager';
import ReviewEditPage from './pages/Admin/ReviewEditPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 前台 */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="photography" element={<Photography />} />
          <Route path="movies" element={<MovieReviews />} />
          <Route path="movies/:id" element={<ReviewDetail type="movie" />} />
          <Route path="books" element={<BookReviews />} />
          <Route path="books/:id" element={<ReviewDetail type="book" />} />
        </Route>

        {/* 后台 */}
        <Route path="admin/login" element={<AdminLogin />} />
        <Route
          path="admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="photos" element={<PhotosManager />} />
          <Route path="movies" element={<MoviesManager />} />
          <Route path="movies/:slug" element={<ReviewEditPage type="movie" />} />
          <Route path="books" element={<BooksManager />} />
          <Route path="books/:slug" element={<ReviewEditPage type="book" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
