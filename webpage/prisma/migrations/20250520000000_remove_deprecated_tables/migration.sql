-- This migration removes the deprecated Favorite and RecentlyUsed tables
-- as they have been replaced by UserFavorite and UserRecentlyUsed tables

-- Drop the tables
DROP TABLE IF EXISTS "Favorite";
DROP TABLE IF EXISTS "RecentlyUsed";

-- Remove the relation fields from the Prompt model
-- (These will be removed automatically when running prisma db push or generate)