import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import StoreLayout from './components/store/StoreLayout'
import AdminLayout from './components/admin/AdminLayout'
import { AdminAuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/common/guards'
import { PageLoader } from './components/common/feedback'

const S = (name) => lazy(() => import(`./pages/store/${name}.jsx`))
const A = (name) => lazy(() => import(`./pages/admin/${name}.jsx`))

// Storefront
const Home = S('Home'), Shop = S('Shop'), Product = S('Product'), Cart = S('Cart'), Checkout = S('Checkout'), OrderSuccess = S('OrderSuccess')
const Login = S('Login'), Register = S('Register'), ForgotPassword = S('ForgotPassword'), Account = S('Account'), WriteReview = S('WriteReview')
const MyReviews = S('MyReviews'), Wishlist = S('Wishlist'), TrackOrder = S('TrackOrder'), Profile = S('Profile'), About = S('About')
const Contact = S('Contact'), Faq = S('Faq'), Policy = S('Policy'), Search = S('Search'), NotFound = S('NotFound'), DesignIndex = S('DesignIndex')
const Compare = S('Compare')

// Admin
const ALogin = A('Login'), AForgot = A('ForgotPassword'), Dashboard = A('Dashboard'), Orders = A('Orders'), OrderDetail = A('OrderDetail')
const Invoice = A('Invoice'), Products = A('Products'), ProductForm = A('ProductForm'), Categories = A('Categories'), Inventory = A('Inventory')
const Customers = A('Customers'), CustomerDetail = A('CustomerDetail'), Reviews = A('Reviews'), Coupons = A('Coupons'), Content = A('Content')
const Returns = A('Returns'), Shipments = A('Shipments'), Payments = A('Payments'), Reports = A('Reports'), Staff = A('Staff'), RoleEdit = A('RoleEdit')
const Settings = A('Settings'), SettingsGeneral = A('SettingsGeneral'), SettingsSms = A('SettingsSms'), SettingsSecurity = A('SettingsSecurity')
const Notifications = A('Notifications'), AProfile = A('Profile')

// Admin session lives only under /admin so the storefront never loads it
const AdminScope = () => <AdminAuthProvider><Outlet /></AdminAuthProvider>

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route element={<RequireAuth />}>
            <Route path="account" element={<Account />} />
            <Route path="account/review/:orderId" element={<WriteReview />} />
            <Route path="account/reviews" element={<MyReviews />} />
            <Route path="account/wishlist" element={<Wishlist />} />
            <Route path="account/profile" element={<Profile />} />
          </Route>
          <Route path="track" element={<TrackOrder />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
          <Route path="policy" element={<Policy />} />
          <Route path="search" element={<Search />} />
          <Route path="compare" element={<Compare />} />
          <Route path="design" element={<DesignIndex />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AdminScope />}>
          <Route path="admin/login" element={<ALogin />} />
          <Route path="admin/forgot-password" element={<AForgot />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="invoice/:id" element={<Invoice />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="content" element={<Content />} />
            <Route path="returns" element={<Returns />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="staff" element={<Staff />} />
            <Route path="staff/roles/:id" element={<RoleEdit />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/general" element={<SettingsGeneral />} />
            <Route path="settings/sms" element={<SettingsSms />} />
            <Route path="settings/security" element={<SettingsSecurity />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<AProfile />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
