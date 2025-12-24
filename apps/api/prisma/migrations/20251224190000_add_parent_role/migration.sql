-- Add PARENT role for self-registered parent accounts
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PARENT';
