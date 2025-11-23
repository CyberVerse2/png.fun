-- Create function to award XP to photo owner when their submission receives votes
CREATE OR REPLACE FUNCTION award_xp_to_photo_owner()
RETURNS TRIGGER AS $$
DECLARE
  photo_owner_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the user_id (photo owner) from the submission
    SELECT user_id INTO photo_owner_id
    FROM submissions
    WHERE id = NEW.submission_id;
    
    -- Award XP to the photo owner
    UPDATE users
    SET total_wld_earned = total_wld_earned + NEW.wld_amount
    WHERE id = photo_owner_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the user_id (photo owner) from the submission
    SELECT user_id INTO photo_owner_id
    FROM submissions
    WHERE id = OLD.submission_id;
    
    -- Remove XP from the photo owner (if vote is deleted)
    UPDATE users
    SET total_wld_earned = total_wld_earned - OLD.wld_amount
    WHERE id = photo_owner_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to award XP when votes are created/deleted
CREATE TRIGGER award_xp_on_vote_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION award_xp_to_photo_owner();

-- Comment explaining the trigger
COMMENT ON TRIGGER award_xp_on_vote_trigger ON votes IS 
'Automatically awards XP (total_wld_earned) to photo owners when their submissions receive votes. Higher XP leads to higher leaderboard position.';
