import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import UserPage from './pages/UserPage'
import StorePage from './pages/StorePage'

const App = (): JSX.Element => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path='/' element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path='login' element={<LoginPage />} />
          <Route path='user' element={<UserPage />} />
          <Route path='*' element={<NotFoundPage />} />
          <Route path='store' element={<StorePage />} />
        </Route>
      </>
    )
  )

  return <RouterProvider router={router} />
}

export default App
