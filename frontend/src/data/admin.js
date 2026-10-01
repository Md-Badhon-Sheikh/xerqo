// Static demo data for the admin panel. Replace with Laravel REST API calls.
import { products, tk } from './store'
export { products, tk }

export const orders = [
  { id: 'XQ-24817', customer: 'Rahim Uddin', phone: '01712-XXXXXX', city: 'Dhaka', items: 2, total: 2600, pay: 'COD', status: 'Pending', courier: 'Steadfast', date: '1 Oct 2026, 2:14 AM', image: products[0].image },
  { id: 'XQ-24816', customer: 'Nusrat Jahan', phone: '01815-XXXXXX', city: 'Chattogram', items: 1, total: 3180, pay: 'bKash', status: 'Confirmed', courier: 'Pathao', date: '30 Sep 2026', image: products[11].image },
  { id: 'XQ-24815', customer: 'Tanvir Ahmed', phone: '01911-XXXXXX', city: 'Sylhet', items: 1, total: 1450, pay: 'Nagad', status: 'Packed', courier: 'Steadfast', date: '30 Sep 2026', image: products[5].image },
  { id: 'XQ-24812', customer: 'Farzana Akter', phone: '01556-XXXXXX', city: 'Dhaka', items: 3, total: 4390, pay: 'COD', status: 'Shipped', courier: 'Pathao', date: '29 Sep 2026', image: products[20].image },
  { id: 'XQ-24809', customer: 'Imran Hasan', phone: '01688-XXXXXX', city: 'Khulna', items: 1, total: 5900, pay: 'Card', status: 'Delivered', courier: 'RedX', date: '28 Sep 2026', image: products[25].image },
  { id: 'XQ-24802', customer: 'Sabbir Rahman', phone: '01799-XXXXXX', city: 'Rajshahi', items: 1, total: 1990, pay: 'COD', status: 'Delivered', courier: 'Steadfast', date: '27 Sep 2026', image: products[6].image },
  { id: 'XQ-24798', customer: 'Mitu Akter', phone: '01822-XXXXXX', city: 'Gazipur', items: 2, total: 2840, pay: 'bKash', status: 'Cancelled', courier: '—', date: '26 Sep 2026', image: products[15].image },
  { id: 'XQ-24790', customer: 'Karim Sheikh', phone: '01933-XXXXXX', city: 'Cumilla', items: 1, total: 2450, pay: 'COD', status: 'Returned', courier: 'Pathao', date: '25 Sep 2026', image: products[5].image },
]

export const customers = [
  { id: 1, name: 'Rahim Uddin', email: 'rahim@email.com', phone: '01712-XXXXXX', city: 'Dhaka', orders: 3, spent: 7230, last: '1 Oct 2026', tag: 'VIP' },
  { id: 2, name: 'Nusrat Jahan', email: 'nusrat@email.com', phone: '01815-XXXXXX', city: 'Chattogram', orders: 5, spent: 11240, last: '30 Sep 2026', tag: 'VIP' },
  { id: 3, name: 'Tanvir Ahmed', email: 'tanvir@email.com', phone: '01911-XXXXXX', city: 'Sylhet', orders: 1, spent: 1450, last: '30 Sep 2026', tag: 'New' },
  { id: 4, name: 'Farzana Akter', email: 'farzana@email.com', phone: '01556-XXXXXX', city: 'Dhaka', orders: 2, spent: 6120, last: '29 Sep 2026' },
  { id: 5, name: 'Imran Hasan', email: 'imran@email.com', phone: '01688-XXXXXX', city: 'Khulna', orders: 4, spent: 15800, last: '28 Sep 2026', tag: 'VIP' },
  { id: 6, name: 'Mitu Akter', email: 'mitu@email.com', phone: '01822-XXXXXX', city: 'Gazipur', orders: 1, spent: 0, last: '26 Sep 2026', tag: 'Risk' },
]

export const staff = [
  { name: 'Dip Hossain', email: 'dip@xerqo.com', role: 'Super Admin', last: 'Online now', status: 'Active' },
  { name: 'Rakib Hasan', email: 'rakib@xerqo.com', role: 'Order Manager', last: '12 min ago', status: 'Active' },
  { name: 'Nasir Ahmed', email: 'nasir@xerqo.com', role: 'Inventory', last: '1 h ago', status: 'Active' },
  { name: 'Sumaiya Khan', email: 'sumaiya@xerqo.com', role: 'Support', last: 'Yesterday', status: 'Active' },
  { name: 'Arif Chowdhury', email: 'arif@xerqo.com', role: 'Content Editor', last: 'Invited', status: 'Pending' },
]

export const roles = [
  { id: 'super-admin', name: 'Super Admin', users: 1, desc: 'Full access to everything, including billing and ownership' },
  { id: 'order-manager', name: 'Order Manager', users: 2, desc: 'Orders, returns, shipments, customers (view)' },
  { id: 'inventory', name: 'Inventory', users: 1, desc: 'Products, categories, stock adjustments' },
  { id: 'support', name: 'Support', users: 1, desc: 'Customers, reviews, returns' },
  { id: 'content-editor', name: 'Content Editor', users: 1, desc: 'Banners, pages, blog, SEO' },
]

export const PERMISSIONS = ['Dashboard', 'Orders', 'Returns', 'Shipments', 'Products', 'Categories', 'Inventory', 'Customers', 'Reviews', 'Coupons', 'Content & Banners', 'Payments & COD', 'Reports', 'Staff & Roles', 'Settings']
