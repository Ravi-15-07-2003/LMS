A Modern Learning Management System
Full-stack Learning Management System (LMS) designed to facilitate seamless content creation by Educators and provide an engaging, secure learning environment for Students. It is built on the MERN stack and features comprehensive course/lecture management, secure user authentication, and integrated payment processing with Razorpay.

Core Features:
| Category      | Feature                     | Description |
|--------------|-----------------------------|-------------|
| Security     | Secure Auth & Session       | **Bcrypt.js** for password hashing (salt: 10), **JWT** for 7-day, `httpOnly`, `SameSite: strict` sessions. |
| Content      | Full Course/Lecture CRUD    | Complete course lifecycle management including video and thumbnail uploads via **Cloudinary** and **Multer**. |
| Commerce     | Integrated Payments         | Seamless course enrollment via **Razorpay SDK** integration, handling order creation and payment verification. |
| Enrollment   | Bi-directional Tracking     | Atomic updates linking users to courses (**enrolledCourses**) and courses to users (**enrolledStudents**) after successful payment. |
| Feedback     | Review System               | Users can submit ratings and comments. Prevents multiple reviews from the same user for a course. |
| Architecture | Redux Toolkit State         | Centralized & predictable state management on the frontend for core resources (User, Course, Lecture, Review). |


Technology Stack:
| Category  | Technology | Usage Details |
|----------|------------|---------------|
| Frontend | React, Redux Toolkit, Vite | Component-based UI with **Redux Slices** (`userSlice.js`, `courseSlice.js`, etc.) for efficient global state management. Includes custom hooks for data fetching. |
| Backend  | Node.js, Express, Mongoose | RESTful API built with **Express** for routing and **Mongoose** for MongoDB object modeling. |
| Database | MongoDB | Persistent storage for User, Course, Lecture, Review, and Order data. |
| Storage  | Cloudinary | External storage for media files: **thumbnail** (Course), **videoUrl** (Lecture), and **photoUrl** (User). |
| Payments | Razorpay SDK | Used in `orderController.js` to handle payment initiation and webhook-like verification. |
| Email    | Mail Utility (`Mail.js`) | Dedicated module for sending One-Time Passwords (OTPs). |


📂 Project Structure
Backend Architecture
The backend implements a clear separation of concerns, managed via dedicated configuration, middleware, and controller logic.
/backend
├── configs/             # Core configurations (DB connection, Cloudinary, Mailer, JWT)
│   ├── cloudinary.js
│   ├── db.js            
│   ├── Mail.js          # Handles OTP email sending
│   └── token.js         # JWT generation
├── controllers/         # Business Logic Layer
│   ├── authController.js
│   ├── courseController.js
│   └── orderController.js
├── middlewares/         # Shared logic
│   ├── isAuth.js        # JWT verification and user extraction
│   └── multer.js        # File handling (uploads to temp storage)
├── models/              # Mongoose Schemas (defining data structure)
├── routes/              # API Route Definitions
└── index.js             # Server Entry Point


Frontend Architecture
The frontend is structured for scalability, leveraging React with Redux for state management.
/frontend/src
├── components/          # Reusable UI elements (Card, Nav, VideoPlayer, ReviewCard)
├── customHooks/         # Data fetching and side effect logic (e.g., getAllReviews.jsx)
├── pages/               # Top-level views
│   ├── admin/           # Pages restricted to Educators (AddCourses, CreateLecture, etc.)
│   └── ...
├── redux/               # Redux Toolkit Slices and Store
│   ├── courseSlice.js
│   ├── lectureSlice.js
│   ├── userSlice.js     # Manages user session and profile data
│   └── store.js         
└── App.jsx / Main.jsx


Data Modeling and Entity Relationships
The core data model centers around five primary entities, with strict relationships defined by Mongoose ObjectId references.

User Model (Role: 'educator' or 'student')
| Field            | Type              | Details                                              | Relationships |
|------------------|------------------|------------------------------------------------------|--------------|
| email            | String           | **Required, Unique**                                 | -            |
| role             | String           | **Required**, Enum (`educator`, `student`)           | -            |
| enrolledCourses  | Array of ObjectId | Array of purchased/enrolled courses                  | `ref: Course` |
| resetOtp         | String           | Stores 4-digit OTP                                   | -            |


Course Model (The core content)
| Field            | Type              | Details                                        | Relationships |
|------------------|------------------|------------------------------------------------|--------------|
| creator          | ObjectId         | **Required**                                   | `ref: User`  |
| price            | Number           | Monetary cost of the course                    | -            |
| lectures         | Array of ObjectId| List of all lectures in the course             | `ref: Lecture` |
| enrolledStudents | Array of ObjectId| List of users who purchased/enrolled in course | `ref: User`  |


Payment (Order Model):
| Field             | Type      | Details          | Relationships |
|------------------|-----------|------------------|--------------|
| razorpay_order_id| String    | **Required**     | -            |
| isPaid           | Boolean   | default: `false` | -            |
| course           | ObjectId  | **Required**     | `ref: Course`|
| student          | ObjectId  | **Required**     | `ref: User`  |


 Detailed API Endpoints and Controller Logic
1. 🔑 Auth Controller (authController.js)
Manages the security and session lifecycle.
  signUp: Validates input, hashes password (Bcrypt), creates user, and sets a secure JWT cookie.
  Password Reset Flow:
    sendOtp: Generates a 4-digit OTP, stores it with a 5-minute expiry, and sends it via email (Mail.js).
    verifyOtp: Checks OTP validity and expiry, setting the isOtpVerifed flag to true.
    resetPassword: Only proceeds if isOtpVerifed is true; hashes and updates the new password.

2. 📚 Course Controller (courseController.js)
Manages CRUD operations for content, often requiring the isAuth middleware to ensure the user is an educator/creator.
### Course Routes & Data Flow

| Action              | Route                        | Role      | Data Flow Notes                                                                 |
|--------------------|------------------------------|-----------|----------------------------------------------------------------------------------|
| createCourse       | **POST** `/create`           | Educator  | Writes new document; sets `creator` to `req.userId`.                             |
| editCourse         | **POST** `/editcourse/:id`   | Educator  | Updates course; handles thumbnail file upload.                                   |
| createLecture      | **POST** `/createlecture/:id`| Educator  | Creates Lecture, then uses `$push` to add Lecture ID to Course `lectures` array. |
| removeLecture      | **DELETE** `/removelecture/:id` | Educator | Deletes Lecture, then uses `$pull` to remove Lecture from Course.                |
| getPublishedCourses| **GET** `/getpublishedcourses` | Public  | Fetches `isPublished: true` courses, populating `reviews` and `lectures`.        |


3. 💰 Order Controller (orderController.js)
Critical module for payment processing and enrollment.

 createOrder (POST /create-order):
  Reads course.price from the database.
  Converts amount to Paisa (multiplies by 100).
  Calls Razorpay API to create a new order ID.
verifyPayment (POST /verify-payment):
  Receives payment data (Razorpay IDs).
  CRITICAL STEP: If order status is 'paid', performs bi-directional enrollment:
    Pushes courseId to User.enrolledCourses.
    Pushes userId to Course.enrolledStudents.


4. 📝 Review Controller (reviewController.js)
Handles user feedback.

  addReview (POST /givereview): Requires isAuth. Ensures the user has not already reviewed the course before creating the review and pushing the review ID to Course.reviews.

  getAllReviews (GET /allReview): Public access. Fetches all reviews, using Mongoose populate('user', 'name photoUrl role') to embed creator data for rich display.    

  🚀 Getting Started
To run locally, ensure you have the necessary environment variables and services configured.

Prerequisites
  Node.js (v18+)
  MongoDB (Local or Cloud-hosted)
  Cloudinary Account (Credentials for media handling)
  Razorpay Account (Key ID and Secret for payments)


1. Backend Setup
  Navigate to the backend directory and install dependencies:   npm install

  Create a .env file and configure the environment variables:
  # DB & Server
MONGO_URI=your_mongodb_connection_string
PORT=5000

# Security
JWT_SECRET=a_very_secure_secret_key

# Cloudinary (Cloud-based storage)
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Service (for OTP)
MAIL_USER=your_email@service.com
MAIL_PASS=your_email_app_password

Start the backend server: npm start

2. Frontend Setup
Navigate to the frontend directory and install dependencies: npm install
Start the React application using Vite: npm run dev

The frontend will typically run on http://localhost:5173.

Deployed Frontend Url : https://lms-1-c9j2.onrender.com
Deployed Backend Url  : https://lms-cy3c.onrender.com
