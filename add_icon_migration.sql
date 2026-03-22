-- Migration: Add icon column to financial entities
-- Run this in the Supabase SQL Editor

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;

ALTER TABLE public.debts
  ADD COLUMN IF NOT EXISTS icon text DEFAULT NULL;
