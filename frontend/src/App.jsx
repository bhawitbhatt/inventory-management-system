import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/AppShell.jsx'
import Customers from './pages/Customers.jsx'
import Dashboard from './pages/Dashboard.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import OrderNew from './pages/OrderNew.jsx'
import Orders from './pages/Orders.jsx'
import Products from './pages/Products.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="customers" element={<Customers />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/new" element={<OrderNew />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
