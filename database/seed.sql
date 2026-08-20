-- =========================================================
-- Smart Event Finder — Seed Data
-- Demo credentials:
--   Admin  -> email: admin@eventfinder.com     password: Admin@123
--   Admin  -> email: admin2@eventfinder.com    password: Admin@123
--   User   -> email: rohan.mehta@example.com   password: User@123
--   (all seeded normal users share password: User@123)
-- =========================================================

USE smart_event_finder;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_interests;
TRUNCATE TABLE bookmarks;
TRUNCATE TABLE registrations;
TRUNCATE TABLE events;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- Users (2 admins + 10 normal users)
-- Password hashes below correspond to Admin@123 / User@123
-- ---------------------------------------------------------
INSERT INTO users (name, email, password, phone, city, role) VALUES
('Site Admin', 'admin@eventfinder.com', '$2b$10$gH25wj/q9I4MCM0NORORQ.lAHyc/yEbiOWoDK/Ph5Fbl3wNUlsVhu', '9800000001', 'Mumbai', 'ADMIN'),
('Operations Admin', 'admin2@eventfinder.com', '$2b$10$gH25wj/q9I4MCM0NORORQ.lAHyc/yEbiOWoDK/Ph5Fbl3wNUlsVhu', '9800000002', 'Navi Mumbai', 'ADMIN'),
('Rohan Mehta', 'rohan.mehta@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345001', 'Mumbai', 'USER'),
('Ananya Sharma', 'ananya.sharma@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345002', 'Pune', 'USER'),
('Karan Verma', 'karan.verma@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345003', 'Bengaluru', 'USER'),
('Priya Nair', 'priya.nair@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345004', 'Navi Mumbai', 'USER'),
('Aditya Rao', 'aditya.rao@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345005', 'Delhi', 'USER'),
('Sneha Iyer', 'sneha.iyer@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345006', 'Hyderabad', 'USER'),
('Vikram Singh', 'vikram.singh@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345007', 'Chennai', 'USER'),
('Neha Kulkarni', 'neha.kulkarni@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345008', 'Pune', 'USER'),
('Arjun Desai', 'arjun.desai@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345009', 'Mumbai', 'USER'),
('Ishita Bose', 'ishita.bose@example.com', '$2b$10$qNM3k9Hmn7UIFsXB4QTexe3Ln.7FGXIjVw/fKqkCorsSwBTy.WFVK', '9812345010', 'Kolkata', 'USER');

-- ---------------------------------------------------------
-- Categories (12)
-- ---------------------------------------------------------
INSERT INTO categories (name, description) VALUES
('Technology', 'Tech talks, product launches and developer meetups'),
('Music', 'Concerts, gigs and music festivals'),
('Sports', 'Tournaments, matches and fitness events'),
('Business', 'Business summits, expos and networking'),
('Education', 'Seminars, lectures and academic events'),
('Workshops', 'Hands-on learning and skill-building sessions'),
('Conferences', 'Large-scale multi-track conferences'),
('Networking', 'Meetups focused on professional connections'),
('Food & Dining', 'Food festivals and culinary experiences'),
('Arts & Culture', 'Exhibitions, theatre and cultural shows'),
('Entertainment', 'Comedy shows, movies and general entertainment'),
('Health & Fitness', 'Yoga, wellness and fitness events');

-- ---------------------------------------------------------
-- Events (30) — dates spread across upcoming months of 2026
-- ---------------------------------------------------------
INSERT INTO events
(title, description, category_id, organizer_name, organizer_email, venue, address, city, latitude, longitude, event_date, start_time, end_time, price, capacity, available_seats, event_type, image_url, status) VALUES
('AI & Machine Learning Summit', 'A full-day summit covering the latest in AI, ML and applied deep learning with industry speakers.', 1, 'TechCircle India', 'contact@techcircle.in', 'Jio World Convention Centre', 'Bandra Kurla Complex', 'Mumbai', 19.0660, 72.8683, '2026-09-12', '09:00:00', '18:00:00', 999.00, 300, 300, 'OFFLINE', 'https://picsum.photos/seed/ai-summit/600/400', 'PUBLISHED'),
('Web Development Bootcamp', 'Intensive 2-day bootcamp on modern web development with hands-on projects.', 6, 'CodeCamp India', 'hello@codecamp.in', 'WeWork Chromium', 'Powai', 'Mumbai', 19.1176, 72.9060, '2026-09-20', '10:00:00', '17:00:00', 499.00, 80, 80, 'OFFLINE', 'https://picsum.photos/seed/webdev-boot/600/400', 'PUBLISHED'),
('Mumbai Startup Networking Meetup', 'Monthly meetup for founders, investors and startup enthusiasts.', 8, 'StartupHub Mumbai', 'team@startuphub.in', 'The Executive Centre', 'Lower Parel', 'Mumbai', 18.9960, 72.8300, '2026-08-30', '18:30:00', '21:00:00', 0.00, 120, 120, 'OFFLINE', 'https://picsum.photos/seed/startup-meetup/600/400', 'PUBLISHED'),
('Indie Music Festival', 'A celebration of independent artists across genres, live on two stages.', 2, 'SoundWave Productions', 'info@soundwave.in', 'Mahalaxmi Race Course', 'Mahalaxmi', 'Mumbai', 18.9821, 72.8190, '2026-10-05', '16:00:00', '23:00:00', 1499.00, 2000, 2000, 'OFFLINE', 'https://picsum.photos/seed/indie-fest/600/400', 'PUBLISHED'),
('Tech Career Workshop', 'Resume reviews, mock interviews and career guidance for engineering students.', 6, 'CareerLaunch', 'support@careerlaunch.in', 'APSIT Campus', 'Thane', 'Navi Mumbai', 19.1863, 73.0169, '2026-09-05', '11:00:00', '15:00:00', 0.00, 150, 150, 'OFFLINE', 'https://picsum.photos/seed/career-workshop/600/400', 'PUBLISHED'),
('Startup Pitch Night', 'Early-stage startups pitch to a live panel of angel investors.', 4, 'Founders Guild', 'pitch@foundersguild.in', 'T-Hub', 'Madhapur', 'Hyderabad', 17.4485, 78.3908, '2026-09-18', '17:00:00', '20:30:00', 299.00, 200, 200, 'OFFLINE', 'https://picsum.photos/seed/pitch-night/600/400', 'PUBLISHED'),
('Data Science Conference', 'Two-track conference on data engineering, analytics and applied statistics.', 7, 'DataMinds', 'events@dataminds.in', 'HICC', 'Hitech City', 'Hyderabad', 17.4126, 78.3833, '2026-10-10', '09:30:00', '18:30:00', 1299.00, 500, 500, 'OFFLINE', 'https://picsum.photos/seed/data-sci-conf/600/400', 'PUBLISHED'),
('Photography Workshop', 'Learn composition, lighting and editing from professional photographers.', 6, 'FrameWorks Studio', 'hello@frameworks.in', 'Prithvi Theatre Complex', 'Juhu', 'Mumbai', 19.1075, 72.8263, '2026-09-14', '10:00:00', '13:00:00', 799.00, 40, 40, 'OFFLINE', 'https://picsum.photos/seed/photo-workshop/600/400', 'PUBLISHED'),
('Football Tournament', 'Inter-college five-a-side football tournament with cash prizes.', 3, 'Navi Mumbai Sports Council', 'sports@nmsc.in', 'DY Patil Sports Academy', 'Nerul', 'Navi Mumbai', 19.0330, 73.0297, '2026-09-27', '08:00:00', '18:00:00', 200.00, 320, 320, 'OFFLINE', 'https://picsum.photos/seed/football-tourney/600/400', 'PUBLISHED'),
('Digital Marketing Masterclass', 'Practical session on SEO, paid ads and growth marketing strategy.', 4, 'GrowthLabs', 'contact@growthlabs.in', 'Bombay Exhibition Centre', 'Goregaon', 'Mumbai', 19.1614, 72.8493, '2026-09-08', '10:00:00', '16:00:00', 599.00, 150, 150, 'OFFLINE', 'https://picsum.photos/seed/digi-marketing/600/400', 'PUBLISHED'),
('Cloud & DevOps Conclave', 'Deep dives into CI/CD, Kubernetes and cloud-native architecture.', 1, 'CloudNative India', 'info@cloudnative.in', 'NIMHANS Convention Centre', 'Hebbal', 'Bengaluru', 13.0358, 77.5970, '2026-10-02', '09:00:00', '18:00:00', 899.00, 400, 400, 'OFFLINE', 'https://picsum.photos/seed/cloud-devops/600/400', 'PUBLISHED'),
('Yoga & Wellness Retreat', 'A day of guided yoga, meditation and wellness talks by certified instructors.', 12, 'ZenSpace', 'namaste@zenspace.in', 'Sanjay Gandhi National Park', 'Borivali', 'Mumbai', 19.2147, 72.9106, '2026-09-21', '06:30:00', '10:30:00', 349.00, 100, 100, 'OFFLINE', 'https://picsum.photos/seed/yoga-retreat/600/400', 'PUBLISHED'),
('Stand-up Comedy Night', 'An evening of laughs with rising stand-up comedians from across the city.', 11, 'LaughRiot Productions', 'book@laughriot.in', 'Canvas Laugh Club', 'Lower Parel', 'Mumbai', 18.9930, 72.8280, '2026-09-06', '20:00:00', '22:00:00', 599.00, 180, 180, 'OFFLINE', 'https://picsum.photos/seed/comedy-night/600/400', 'PUBLISHED'),
('Mumbai Food Festival', 'A weekend food carnival with 100+ stalls from across India.', 9, 'FoodieFest', 'hello@foodiefest.in', 'MMRDA Grounds', 'BKC', 'Mumbai', 19.0654, 72.8656, '2026-10-17', '12:00:00', '22:00:00', 99.00, 5000, 5000, 'OFFLINE', 'https://picsum.photos/seed/food-fest/600/400', 'PUBLISHED'),
('Art & Culture Exhibition', 'A curated exhibition of contemporary Indian art and installations.', 10, 'ArtSpace Gallery', 'curator@artspace.in', 'Jehangir Art Gallery', 'Kala Ghoda', 'Mumbai', 18.9280, 72.8330, '2026-09-25', '11:00:00', '19:00:00', 0.00, 250, 250, 'OFFLINE', 'https://picsum.photos/seed/art-exhibit/600/400', 'PUBLISHED'),
('Product Management Summit', 'Sessions from PM leaders on roadmaps, discovery and product strategy.', 4, 'PM Circle', 'events@pmcircle.in', 'Taj Lands End', 'Bandra', 'Mumbai', 19.0435, 72.8202, '2026-10-24', '09:00:00', '17:00:00', 1499.00, 220, 220, 'OFFLINE', 'https://picsum.photos/seed/pm-summit', 'PUBLISHED'),
('React & Frontend Meetup', 'Community meetup discussing React patterns, performance and tooling.', 1, 'Frontend Guild', 'guild@frontend.in', 'Amazon Development Centre', 'Whitefield', 'Bengaluru', 12.9698, 77.7500, '2026-09-16', '18:00:00', '20:30:00', 0.00, 100, 100, 'ONLINE', 'https://picsum.photos/seed/react-meetup/600/400', 'PUBLISHED'),
('Delhi Business Expo', 'A large-scale expo connecting SMEs, investors and enterprise buyers.', 4, 'ExpoIndia', 'contact@expoindia.in', 'Pragati Maidan', 'ITO', 'Delhi', 28.6139, 77.2450, '2026-10-08', '10:00:00', '19:00:00', 199.00, 3000, 3000, 'OFFLINE', 'https://picsum.photos/seed/delhi-expo/600/400', 'PUBLISHED'),
('Chennai Music Carnival', 'Classical and fusion music performances by acclaimed artists.', 2, 'Carnatica Live', 'info@carnaticalive.in', 'Music Academy', 'Nungambakkam', 'Chennai', 13.0569, 80.2425, '2026-10-15', '18:00:00', '21:30:00', 699.00, 600, 600, 'OFFLINE', 'https://picsum.photos/seed/chennai-music/600/400', 'PUBLISHED'),
('Kolkata Book & Literature Fair', 'Author talks, book launches and panel discussions on literature.', 5, 'ReadersCircle', 'hello@readerscircle.in', 'Milan Mela Ground', 'Science City', 'Kolkata', 22.5390, 88.3960, '2026-10-22', '11:00:00', '20:00:00', 0.00, 4000, 4000, 'OFFLINE', 'https://picsum.photos/seed/book-fair/600/400', 'PUBLISHED'),
('Hyderabad Hackathon 2026', '24-hour hackathon for developers to build and ship real products.', 1, 'HackHouse', 'run@hackhouse.in', 'T-Hub 2.0', 'Hitech City', 'Hyderabad', 17.4400, 78.3800, '2026-09-19', '09:00:00', '09:00:00', 0.00, 300, 300, 'OFFLINE', 'https://picsum.photos/seed/hackathon/600/400', 'PUBLISHED'),
('Pune Startup Conclave', 'Regional startup conclave with investor speed-networking sessions.', 8, 'Deccan Founders', 'team@deccanfounders.in', 'Pune International Centre', 'Sr. No. 39', 'Pune', 18.5204, 73.8567, '2026-09-29', '10:00:00', '18:00:00', 399.00, 350, 350, 'OFFLINE', 'https://picsum.photos/seed/pune-conclave/600/400', 'PUBLISHED'),
('UI/UX Design Sprint', 'Two-day workshop on design thinking, wireframing and prototyping.', 6, 'DesignForge', 'studio@designforge.in', 'Innov8 Coworking', 'Andheri East', 'Mumbai', 19.1197, 72.8697, '2026-09-13', '10:00:00', '17:00:00', 699.00, 60, 60, 'OFFLINE', 'https://picsum.photos/seed/ux-sprint/600/400', 'PUBLISHED'),
('Bengaluru Marathon', 'City-wide marathon with 5K, 10K and full marathon categories.', 3, 'RunIndia', 'race@runindia.in', 'Kanteerava Stadium', 'Kasturba Road', 'Bengaluru', 12.9784, 77.5964, '2026-11-01', '05:30:00', '11:00:00', 499.00, 10000, 10000, 'OFFLINE', 'https://picsum.photos/seed/blr-marathon/600/400', 'PUBLISHED'),
('Fintech Innovation Forum', 'Panel discussions on digital payments, lending and regtech innovation.', 4, 'FinTech Circle', 'forum@fintechcircle.in', 'ITC Grand Central', 'Parel', 'Mumbai', 19.0027, 72.8367, '2026-10-29', '09:30:00', '17:30:00', 1199.00, 250, 250, 'OFFLINE', 'https://picsum.photos/seed/fintech-forum/600/400', 'PUBLISHED'),
('Navi Mumbai Cultural Fest', 'A three-day cultural fest with dance, drama and music performances.', 10, 'NMMC Cultural Wing', 'culture@nmmc.gov.in', 'Vashi Plaza Ground', 'Vashi', 'Navi Mumbai', 19.0771, 72.9986, '2026-11-06', '16:00:00', '22:00:00', 0.00, 8000, 8000, 'OFFLINE', 'https://picsum.photos/seed/cultural-fest/600/400', 'PUBLISHED'),
('DevOps & SRE Workshop', 'Hands-on session covering observability, incident response and reliability.', 6, 'ReliabilityHub', 'contact@reliabilityhub.in', 'Salarpuria Sattva Knowledge City', 'Kondapur', 'Hyderabad', 17.4700, 78.3600, '2026-09-23', '10:00:00', '17:00:00', 599.00, 90, 90, 'OFFLINE', 'https://picsum.photos/seed/devops-workshop/600/400', 'PUBLISHED'),
('Delhi Comic Con', 'India''s largest pop culture convention with cosplay and artist alley.', 11, 'Comic Con India', 'info@comicconindia.com', 'NSIC Exhibition Grounds', 'Okhla', 'Delhi', 28.5493, 77.2670, '2026-11-14', '10:00:00', '20:00:00', 399.00, 15000, 15000, 'OFFLINE', 'https://picsum.photos/seed/comic-con/600/400', 'PUBLISHED'),
('AI in Healthcare Summit', 'Exploring applications of AI and ML in diagnostics and patient care.', 1, 'MedTech Alliance', 'summit@medtechalliance.in', 'Renaissance Hotel', 'Powai', 'Mumbai', 19.1170, 72.9050, '2026-10-31', '09:00:00', '17:00:00', 1099.00, 200, 200, 'OFFLINE', 'https://picsum.photos/seed/ai-health/600/400', 'PUBLISHED'),
('Weekend Coding Contest', 'Competitive programming contest open to students and professionals.', 1, 'CodeArena', 'contest@codearena.in', 'Online', 'Online', 'Mumbai', 19.0760, 72.8777, '2026-08-24', '11:00:00', '14:00:00', 0.00, 1000, 1000, 'ONLINE', 'https://picsum.photos/seed/coding-contest/600/400', 'PUBLISHED');

-- ---------------------------------------------------------
-- Registrations (20+)
-- ---------------------------------------------------------
INSERT INTO registrations (user_id, event_id, status, ticket_quantity) VALUES
(3, 1, 'CONFIRMED', 1),
(3, 5, 'CONFIRMED', 2),
(3, 20, 'CONFIRMED', 1),
(4, 2, 'CONFIRMED', 1),
(4, 11, 'CONFIRMED', 1),
(4, 24, 'CONFIRMED', 3),
(5, 11, 'CONFIRMED', 1),
(5, 17, 'CONFIRMED', 1),
(5, 20, 'CONFIRMED', 2),
(6, 1, 'CONFIRMED', 1),
(6, 3, 'CONFIRMED', 1),
(6, 9, 'CONFIRMED', 4),
(7, 18, 'CONFIRMED', 1),
(7, 28, 'CONFIRMED', 1),
(8, 6, 'CONFIRMED', 1),
(8, 7, 'CONFIRMED', 2),
(8, 29, 'CONFIRMED', 1),
(9, 19, 'CONFIRMED', 2),
(9, 24, 'CONFIRMED', 1),
(10, 2, 'CONFIRMED', 1),
(10, 22, 'CONFIRMED', 1),
(11, 1, 'CANCELLED', 1),
(11, 4, 'CONFIRMED', 2),
(12, 19, 'CONFIRMED', 1),
(12, 27, 'CONFIRMED', 1);

-- Reflect the confirmed registrations above in available_seats
UPDATE events e
SET available_seats = e.capacity - (
  SELECT COALESCE(SUM(r.ticket_quantity), 0)
  FROM registrations r
  WHERE r.event_id = e.id AND r.status = 'CONFIRMED'
);

-- ---------------------------------------------------------
-- Bookmarks (15+)
-- ---------------------------------------------------------
INSERT INTO bookmarks (user_id, event_id) VALUES
(3, 2), (3, 7), (3, 11), (3, 24),
(4, 1), (4, 15), (4, 20),
(5, 4), (5, 9), (5, 22),
(6, 8), (6, 13),
(7, 6), (7, 19), (7, 27),
(8, 1), (8, 29),
(9, 5), (9, 24),
(10, 11), (10, 17),
(11, 3), (11, 9),
(12, 19), (12, 27);

-- ---------------------------------------------------------
-- User Interests
-- ---------------------------------------------------------
INSERT INTO user_interests (user_id, category_id) VALUES
(3, 1), (3, 6), (3, 4),
(4, 1), (4, 7), (4, 6),
(5, 1), (5, 8), (5, 4),
(6, 2), (6, 11), (6, 9),
(7, 4), (7, 8), (7, 7),
(8, 1), (8, 7), (8, 12),
(9, 4), (9, 8),
(10, 6), (10, 1),
(11, 2), (11, 3),
(12, 4), (12, 10);
