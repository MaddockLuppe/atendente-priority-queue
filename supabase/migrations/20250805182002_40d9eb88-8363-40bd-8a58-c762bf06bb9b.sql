-- Corrigir senha do usuário abassa
UPDATE profiles 
SET password_hash = '$2b$10$A7DhzFZJOi.Zj9QQPNr9i.k6J7iP4/A6SQB1DQHV9sEQ/YpkOzR8e'
WHERE username = 'abassa';