-- =========================================================
-- Smart Event Finder — Database Schema
-- =========================================================

CREATE DATABASE IF NOT EXISTS smart_event_finder
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_event_finder;

-- ---------------------------------------------------------
-- Table: users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  profile_image VARCHAR(255) DEFAULT NULL,
  role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: categories
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: events
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  organizer_name VARCHAR(150) DEFAULT NULL,
  organizer_email VARCHAR(190) DEFAULT NULL,
  venue VARCHAR(200) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) DEFAULT NULL,
  longitude DECIMAL(10, 7) DEFAULT NULL,
  event_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 0,
  available_seats INT NOT NULL DEFAULT 0,
  event_type ENUM('ONLINE', 'OFFLINE', 'HYBRID') NOT NULL DEFAULT 'OFFLINE',
  image_url VARCHAR(255) DEFAULT NULL,
  status ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_events_city (city),
  INDEX idx_events_date (event_date),
  INDEX idx_events_category (category_id),
  INDEX idx_events_status (status),
  INDEX idx_events_price (price)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: registrations
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  ticket_quantity INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_event UNIQUE (user_id, event_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: bookmarks
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmark_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_bookmark_event UNIQUE (user_id, event_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: user_interests
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  CONSTRAINT fk_interest_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_interest_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_category UNIQUE (user_id, category_id)
) ENGINE=InnoDB;
