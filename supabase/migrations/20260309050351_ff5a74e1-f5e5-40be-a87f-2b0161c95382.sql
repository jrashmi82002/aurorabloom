-- Add krishna_chat to therapy_type enum
ALTER TYPE public.therapy_type ADD VALUE IF NOT EXISTS 'krishna_chat';
