-- Change default storybook style from 'natural' to 'cartoon'
-- Natural style is being removed; cartoon is the new default

ALTER TABLE storybooks ALTER COLUMN style SET DEFAULT 'cartoon';

-- Update existing storybooks that have 'natural' style to 'cartoon'
UPDATE storybooks SET style = 'cartoon' WHERE style = 'natural';
