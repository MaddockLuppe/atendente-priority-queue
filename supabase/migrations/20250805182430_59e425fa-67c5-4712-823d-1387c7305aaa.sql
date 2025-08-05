-- Corrigir hash da senha usando bcrypt correto
UPDATE profiles 
SET password_hash = '$2b$10$UO9K6p8E6xE9K.8TN5L5ReGW6yfKl8QH9sGJZxCzHD4FYVQD3QYqW'
WHERE username = 'abassa';