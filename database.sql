-- HostelIMS Database Schema
-- Run this in MySQL Workbench or phpMyAdmin

CREATE DATABASE IF NOT EXISTS hostelims;
USE hostelims;

-- Admins Table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    course VARCHAR(100),
    year VARCHAR(20),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    room_id INT DEFAULT NULL,
    status ENUM('active','pending','inactive') DEFAULT 'pending',
    join_date DATE DEFAULT (CURDATE()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    floor INT NOT NULL,
    type ENUM('Single','Double','Triple','Dormitory') NOT NULL,
    capacity INT NOT NULL,
    occupied INT DEFAULT 0,
    rent DECIMAL(10,2) NOT NULL,
    amenities TEXT,
    status ENUM('available','occupied','maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(15),
    salary DECIMAL(10,2),
    join_date DATE,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    amount DECIMAL(10,2) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    mode ENUM('Cash','UPI','Bank Transfer','Card') DEFAULT 'Cash',
    due_date DATE,
    paid_date DATE DEFAULT NULL,
    status ENUM('paid','pending','overdue') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- Complaints Table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('Maintenance','Food','Noise','Security','Other') DEFAULT 'Maintenance',
    priority ENUM('Low','Medium','High') DEFAULT 'Medium',
    status ENUM('open','in_progress','resolved') DEFAULT 'open',
    assigned_to INT DEFAULT NULL,
    resolved_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL
);

-- Activity Log Table
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for student room
ALTER TABLE students ADD CONSTRAINT fk_student_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- =====================
-- SEED DATA
-- =====================

-- Default Admin (password: admin123)
INSERT INTO admins (username, password, name) VALUES 
('admin', '$2b$10$YourHashedPasswordHere', 'Admin User');

UPDATE admins 
SET password = '$2a$10$ChDj.8AVuE2bZ35unkQDgeDyuebIRlRy65Q0CkZ7werYdWz9Q0hmy'
WHERE username = 'admin';

-- Rooms
INSERT INTO rooms (room_number, floor, type, capacity, occupied, rent, amenities, status) VALUES
('101', 1, 'Single', 1, 0, 2000.00, 'Fan, Shared Bathroom', 'available'),
('102', 1, 'Double', 2, 0, 2500.00, 'Fan, Shared Bathroom', 'available'),
('103', 1, 'Double', 2, 1, 2500.00, 'AC, Shared Bathroom, WiFi', 'occupied'),
('201', 2, 'Single', 1, 1, 4000.00, 'AC, Attached Bathroom, WiFi, Study Table', 'occupied'),
('202', 2, 'Triple', 3, 1, 2000.00, 'Fan, Shared Bathroom', 'available'),
('203', 2, 'Dormitory', 6, 0, 1500.00, 'Fan, Common Bathroom', 'available'),
('301', 3, 'Single', 1, 1, 4500.00, 'AC, Attached Bathroom, WiFi, Balcony', 'occupied'),
('302', 3, 'Double', 2, 0, 3000.00, 'AC, Shared Bathroom, WiFi', 'available'),
('303', 3, 'Triple', 3, 0, 2200.00, 'Fan, Shared Bathroom', 'maintenance'),
('401', 4, 'Single', 1, 0, 4500.00, 'AC,Wifi,Attached Washroom,Study Table,Board', 'available');

-- Staff
INSERT INTO staff (name, role, department, email, phone, salary, join_date, status) VALUES
('Mr. Ravi Gupta', 'Warden', 'Administration', 'ravi@hostel.com', '9111222333', 45000.00, '2020-01-01', 'active'),
('Mrs. Meena Singh', 'Assistant Warden', 'Administration', 'meena@hostel.com', '9111222334', 35000.00, '2021-03-15', 'active'),
('Mr. Suresh Babu', 'Security Guard', 'Security', 'suresh@hostel.com', '9111222335', 20000.00, '2019-06-01', 'active'),
('Mrs. Lakshmi Devi', 'Housekeeper', 'Housekeeping', 'lakshmi@hostel.com', '9111222336', 18000.00, '2020-09-01', 'active'),
('Mr. Ashok Kumar', 'Cook', 'Mess', 'ashok@hostel.com', '9111222337', 22000.00, '2018-11-15', 'active');

-- Students (passwords will be set via the app)
INSERT INTO students (roll_number, name, email, phone, address, course, year, guardian_name, guardian_phone, password, room_id, status) VALUES
('S001', 'Amit Kumar', 'amit@example.com', '9876543210', 'Delhi', 'B.Tech Computer Science', 'Year 2', 'Ramesh Kumar', '9876540001', '$2b$10$placeholder', NULL, 'active'),
('S002', 'Priya Patel', 'priya@example.com', '9876543211', 'Mumbai', 'B.Tech Electronics', 'Year 1', 'Suresh Patel', '9876540002', '$2b$10$placeholder', 3, 'active'),
('S004', 'Sunita Reddy', 'sunita@example.com', '9876543213', 'Hyderabad', 'MBA', 'Year 1', 'Venkat Reddy', '9876540004', '$2b$10$placeholder', NULL, 'pending'),
('S005', 'Karthik Nair', 'karthik@example.com', '9876543214', 'Kerala', 'B.Tech Mechanical', 'Year 2', 'Sunil Nair', '9876540005', '$2b$10$placeholder', 5, 'active');

-- Payments
INSERT INTO payments (student_id, amount, month, year, mode, due_date, paid_date, status) VALUES
(2, 2500.00, 1, 2025, 'UPI', '2025-01-05', '2025-01-03', 'paid'),
(2, 2500.00, 2, 2025, NULL, '2025-02-05', NULL, 'overdue'),
(4, 2500.00, 1, 2025, 'Cash', '2025-01-05', '2025-01-04', 'paid');

-- Complaints
INSERT INTO complaints (student_id, title, description, category, priority, status, assigned_to) VALUES
(NULL, 'Food quality issue', 'The food quality in the mess has deteriorated significantly this month', 'Food', 'High', 'resolved', 5),
(NULL, 'WiFi not working', 'WiFi connectivity is very poor in room 103 area', 'Maintenance', 'Medium', 'open', NULL),
(4, 'Broken chair in room', 'One of the chairs in room 202 is broken and needs replacement', 'Maintenance', 'Low', 'open', NULL),
(NULL, 'Water leakage in bathroom', 'There is water leakage from the ceiling of the bathroom in room 103', 'Maintenance', 'High', 'resolved', 3),
(NULL, 'Noisy neighbors at night', 'Students in room 302 are very noisy after midnight', 'Noise', 'Medium', 'open', NULL);

-- Add to your existing hostelims database
USE hostelims;

CREATE TABLE IF NOT EXISTS mess_menu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_name ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    meal_type ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
    items TEXT NOT NULL,
    timing VARCHAR(30),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_day_meal (day_name, meal_type)
);

INSERT INTO mess_menu (day_name, meal_type, items, timing) VALUES
('Monday','Breakfast','Idli, Sambar, Coconut Chutney, Tea/Coffee','7:00 AM - 9:00 AM'),
('Monday','Lunch','Rice, Dal Tadka, Aloo Gobi, Roti, Salad','12:00 PM - 2:00 PM'),
('Monday','Snacks','Bread Pakoda, Chai','5:00 PM - 6:00 PM'),
('Monday','Dinner','Chapati, Paneer Butter Masala, Dal, Rice, Curd','7:30 PM - 9:30 PM'),
('Tuesday','Breakfast','Poha, Boiled Eggs, Tea/Coffee','7:00 AM - 9:00 AM'),
('Tuesday','Lunch','Rice, Rajma, Jeera Aloo, Roti, Salad','12:00 PM - 2:00 PM'),
('Tuesday','Snacks','Samosa, Chai','5:00 PM - 6:00 PM'),
('Tuesday','Dinner','Chapati, Dal Makhani, Mixed Veg, Rice','7:30 PM - 9:30 PM'),
('Wednesday','Breakfast','Dosa, Sambar, Chutney, Tea/Coffee','7:00 AM - 9:00 AM'),
('Wednesday','Lunch','Rice, Chole, Bhindi Fry, Roti, Raita','12:00 PM - 2:00 PM'),
('Wednesday','Snacks','Veg Cutlet, Chai','5:00 PM - 6:00 PM'),
('Wednesday','Dinner','Chapati, Egg Curry, Dal, Rice, Salad','7:30 PM - 9:30 PM'),
('Thursday','Breakfast','Upma, Banana, Tea/Coffee','7:00 AM - 9:00 AM'),
('Thursday','Lunch','Rice, Sambar, Potato Fry, Roti, Pickle','12:00 PM - 2:00 PM'),
('Thursday','Snacks','Corn Chaat, Chai','5:00 PM - 6:00 PM'),
('Thursday','Dinner','Chapati, Palak Paneer, Dal Fry, Rice','7:30 PM - 9:30 PM'),
('Friday','Breakfast','Puri, Aloo Sabzi, Tea/Coffee','7:00 AM - 9:00 AM'),
('Friday','Lunch','Rice, Fish Curry / Veg Kofta, Dal, Roti, Salad','12:00 PM - 2:00 PM'),
('Friday','Snacks','Pav Bhaji, Chai','5:00 PM - 6:00 PM'),
('Friday','Dinner','Chapati, Chicken Curry / Paneer Masala, Rice, Curd','7:30 PM - 9:30 PM'),
('Saturday','Breakfast','Paratha, Curd, Pickle, Tea/Coffee','7:00 AM - 9:00 AM'),
('Saturday','Lunch','Biryani (Veg/Non-Veg), Raita, Salad','12:00 PM - 2:00 PM'),
('Saturday','Snacks','Maggi / Noodles, Chai','5:00 PM - 6:00 PM'),
('Saturday','Dinner','Chapati, Dal, Aloo Matar, Rice, Kheer','7:30 PM - 9:30 PM'),
('Sunday','Breakfast','Chole Bhature, Tea/Coffee','7:00 AM - 9:00 AM'),
('Sunday','Lunch','Special Rice, Mutton Curry / Veg Pulao, Raita, Salad','12:00 PM - 2:00 PM'),
('Sunday','Snacks','Ice Cream / Fruit Chaat','5:00 PM - 6:00 PM'),
('Sunday','Dinner','Chapati, Paneer / Chicken Tikka Masala, Dal, Rice','7:30 PM - 9:30 PM');