# Supermarket Management System - Project Brief

## 📋 Project Overview

A comprehensive **Point of Sale (POS) and Inventory Management System** designed for supermarkets and retail stores. This full-stack application provides complete business management capabilities including sales processing, inventory tracking, order management, refunds, reporting, and multi-language support.

---

## 🎯 Key Features

### Core Functionality
- **Point of Sale (POS)**: Real-time barcode scanning, cart management, multiple payment methods (Cash/Card)
- **Inventory Management**: Product CRUD operations, stock tracking, low stock alerts, supplier management
- **Order Management**: Complete order history, filtering by cashier/date/status, order details view
- **Refund System**: Full and partial refunds, automatic stock restoration, refund tracking
- **Reporting**: Daily sales reports, Excel export, date range filtering, discount analysis
- **Dashboard**: Real-time statistics, recent activity, low stock alerts, active cashiers
- **Multi-language Support**: English and Arabic (RTL support)
- **Dark Mode**: Complete dark/light theme support

### Business Logic Highlights
- **Net Sales Calculation**: Automatically excludes fully refunded orders and subtracts refunds from partially refunded orders
- **Stock Management**: Automatic stock updates on sales and refunds
- **Order Status Tracking**: COMPLETED, REFUNDED, PARTIALLY_REFUNDED, PENDING
- **Financial Accuracy**: All calculations (sales, discounts, refunds) are accurate and consistent across all pages
- **Role-Based Access**: ADMIN and CASHIER roles with appropriate permissions

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.4.5
- **Routing**: React Router DOM 6.14.2
- **Styling**: Tailwind CSS 3.3.3
- **State Management**: 
  - React Context API (AuthContext, SettingsContext, LanguageContext, DarkModeContext)
  - Zustand 4.3.9 (optional state management)
- **HTTP Client**: Axios 1.4.0
- **Icons**: Lucide React 0.263.1
- **Date Picker**: React DatePicker 8.10.0
- **Excel Export**: XLSX 0.18.5
- **Language**: JavaScript (JSX)

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **ORM**: Prisma 5.22.0
- **Database**: MySQL (via Prisma)
- **Authentication**: JWT (jsonwebtoken 9.0.0)
- **Password Hashing**: bcryptjs 2.4.3
- **Environment**: dotenv 16.0.3
- **CORS**: cors 2.8.5
- **Language**: JavaScript (CommonJS)

### **Database**
- **Type**: MySQL
- **ORM**: Prisma Client
- **Schema Management**: Prisma Migrations

---

## 📁 Project Structure

```
supermarket-system/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── refund.controller.js
│   │   │   └── ...
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth middleware
│   │   ├── utils/           # Prisma client
│   │   └── server.js        # Express server entry point
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       └── migrations/       # Database migrations
│
└── frontend/
    └── src/
        ├── pages/           # Page components
        │   ├── AdminDashboard.jsx
        │   ├── POS.jsx
        │   ├── Inventory.jsx
        │   ├── Orders.jsx
        │   ├── Refunded.jsx
        │   ├── Reports.jsx
        │   └── ...
        ├── components/      # Reusable components
        │   ├── Modal.jsx
        │   ├── Sidebar.jsx
        │   ├── Navbar.jsx
        │   └── ...
        ├── context/         # React Context providers
        │   ├── AuthContext.jsx
        │   ├── LanguageContext.jsx
        │   ├── DarkModeContext.jsx
        │   └── SettingsContext.jsx
        └── App.jsx          # Main app component
```

---

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and user management (ADMIN/CASHIER roles)
- **Product**: Inventory items with barcode, pricing, stock levels
- **Category**: Product categorization
- **Supplier**: Supplier/vendor management
- **Order**: Sales transactions with payment method, discount, status
- **OrderItem**: Individual items within an order
- **Refund**: Refund transactions
- **RefundItem**: Individual items within a refund
- **Settings**: Store configuration (name, address, currency, printer IP)

### Key Relationships
- Order → User (cashier)
- Order → OrderItem → Product
- Refund → Order → OrderItem
- Product → Category, Supplier

---

## 🔐 Authentication & Authorization

- **JWT-based Authentication**: Secure token-based auth
- **Role-Based Access Control**: 
  - ADMIN: Full access to all features
  - CASHIER: Limited access (POS, Orders view)
- **Protected Routes**: Middleware protection on all API endpoints

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products (with search/pagination)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders (with filters: date, cashier, status, pagination)
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/daily-report` - Daily sales report
- `GET /api/orders/dashboard-stats` - Dashboard statistics
- `POST /api/pos/checkout` - Create new order (POS)

### Refunds
- `POST /api/refunds` - Create refund
- `GET /api/refunds` - List all refunds
- `GET /api/refunds/:id` - Get refund details
- `GET /api/refunds/order/:orderId` - Get refunds for an order

### Categories & Suppliers
- Full CRUD operations for both entities

### Settings
- `GET /api/settings` - Get store settings
- `PUT /api/settings` - Update store settings

---

## 💼 Business Logic Details

### Sales Calculation
- **Net Sales** = Order Total - Refunded Amount
- Fully refunded orders are excluded from sales totals
- Partially refunded orders show net amount (original - refunded)

### Refund Logic
- Supports **full refunds** (all items) and **partial refunds** (selected items)
- Validates refund quantities against available (non-refunded) quantities
- Automatically restores stock when refunding
- Updates order status: REFUNDED or PARTIALLY_REFUNDED
- Prevents double-refunding of already refunded items

### Stock Management
- Stock decreases on sale (order creation)
- Stock increases on refund
- Low stock alerts based on minQuantity threshold

### Order Status Flow
- **COMPLETED**: Normal completed order
- **PARTIALLY_REFUNDED**: Some items refunded
- **REFUNDED**: All items refunded
- **PENDING**: Order in progress (if applicable)

---

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-friendly layout
- **Dark Mode**: Complete dark/light theme support
- **RTL Support**: Full Arabic right-to-left layout support
- **Real-time Updates**: Live data refresh on actions
- **Excel Export**: Export reports and refunded orders to Excel
- **Pagination**: Efficient data loading with pagination
- **Search & Filters**: Order ID search, cashier filter, date range filter
- **Custom Notifications**: Toast notifications for user feedback
- **Modal Dialogs**: Custom modal components for confirmations and details

---

## 📊 Reporting Features

- **Daily Sales Report**: Date range selection, multiple date support
- **Excel Export**: Formatted Excel files with summary and detailed data
- **Statistics Cards**: Total sales, orders, discounts, averages
- **Refund Tracking**: Dedicated refunded orders page with statistics
- **Cashier Performance**: Filter orders by cashier with totals

---

## 🔧 Development Setup

### Backend
```bash
cd backend
npm install
# Configure .env with DATABASE_URL
npx prisma migrate dev
npx prisma generate
npm run dev  # Starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Starts on port 5173 (Vite default)
```

### Database
- MySQL database required
- Prisma migrations handle schema creation
- Seed script available for initial data

---

## 🌍 Internationalization

- **Languages**: English (en), Arabic (ar)
- **RTL Support**: Automatic layout direction switching
- **Translation Keys**: Centralized in LanguageContext
- **Date Formatting**: Locale-aware date formatting

---

## 📈 Key Metrics & Statistics

The system tracks and displays:
- Daily Sales (net after refunds)
- Total Orders (excluding fully refunded)
- Total Discounts
- Low Stock Items Count
- Active Cashiers
- Average Order Value
- Total Refunded Amount
- Refund Statistics

---

## ✅ Quality Assurance

- **Data Consistency**: All calculations verified and consistent
- **Error Handling**: Comprehensive error handling throughout
- **Input Validation**: Backend validation for all inputs
- **Security**: JWT authentication, password hashing, protected routes
- **Performance**: Efficient queries with pagination, indexed database fields

---

## 🚀 Future Enhancements (Potential)

- Receipt printing integration
- Barcode scanner hardware integration
- Advanced analytics and charts
- Multi-store support
- Customer management
- Loyalty programs
- Email notifications
- Mobile app version

---

## 📝 Notes

- All financial calculations are accurate and verified
- Refund system prevents double-refunding
- Stock management is automatic and consistent
- All translations are complete (English/Arabic)
- Dark mode is fully implemented across all pages
- Excel exports include proper formatting and calculations

---

**Project Status**: ✅ Production Ready
**Last Updated**: December 2024