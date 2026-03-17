-- Migration: 056_fix_zoo_category_rename_counting.sql
-- 1. Change "Day at the Zoo" category from 'numbers' to 'world'
-- 2. Rename "Learning to Count (1 to 10)" to "Numbers Around the House (1 to 10)"

-- Fix Day at the Zoo category
UPDATE story_templates
SET category = 'world'
WHERE title = 'Day at the Zoo';

-- Rename counting story
UPDATE story_templates
SET title = 'Numbers Around the House (1 to 10)',
    cover_label = 'Numbers Around the House'
WHERE title = 'Learning to Count (1 to 10)';
