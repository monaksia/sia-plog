import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminGuard from './components/AdminGuard';
import Home from './pages/Home';
const Photography = lazy(() => import('./pages/Photography'));
const MovieReviews = lazy(() => import('./pages/MovieReviews'));
const BookReviews = lazy(() => import('./pages/BookReviews'));
const ReviewDetail = lazy(() => import('./pages/ReviewDetail'));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const PhotosManager = lazy(() => import('./pages/Admin/PhotosManager'));
const MoviesManager = lazy(() => import('./pages/Admin/MoviesManager'));
const BooksManager = lazy(() => import('./pages/Admin/BooksManager'));
const ReviewEditPage = lazy(() => import('./pages/Admin/ReviewEditPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="container" role="status"><p>加载中…</p></div>}>
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
        <Route path="*" element={<div className="container"><h1>页面不存在</h1><a href="/">返回首页</a></div>} />
      </Routes>
    </Suspense>
    </BrowserRouter>
  );
}

export default App;
