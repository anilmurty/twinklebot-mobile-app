-- Add style column to storybooks table
-- Supported values: natural, storybook, comic-book, cartoon
ALTER TABLE storybooks ADD COLUMN style VARCHAR(20) DEFAULT 'natural' NOT NULL;
