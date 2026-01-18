-- Seed Data for TamilPSLE
-- Sample questions for all 6 sections

-- Note: Run this after applying all migrations
-- This creates sample published questions for testing

-- First, we need an admin user to be the creator
-- In production, this would be a real admin user ID
-- For seeding, we'll use a placeholder that should be replaced with actual admin user ID

-- Create a helper function to insert questions with options
DO $$
DECLARE
    admin_id uuid;
    q_id uuid;
    p_id uuid;
BEGIN
    -- Get the first admin user, or first user if no admin exists
    SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM profiles LIMIT 1;
    END IF;

    -- If still no user, we can't seed (need at least one user)
    IF admin_id IS NULL THEN
        RAISE NOTICE 'No users found. Please create a user first, then run this seed.';
        RETURN;
    END IF;

    -- =========================================================================
    -- SECTION 1: Vetrumai (வேற்றுமை) - Case markers
    -- =========================================================================

    -- Question 1
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('vetrumai', 'கீழே உள்ள வாக்கியத்தில் வேற்றுமை உருபைக் கண்டறிக: "ராமன் பள்ளிக்கு சென்றான்"', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'ஐ', false),
    (q_id, 'B', 'கு', true),
    (q_id, 'C', 'ஆல்', false),
    (q_id, 'D', 'இல்', false);

    -- Question 2
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('vetrumai', '"அவன் கத்தியால் பழத்தை வெட்டினான்" - இவ்வாக்கியத்தில் உள்ள வேற்றுமை உருபு எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'ஐ', false),
    (q_id, 'B', 'கு', false),
    (q_id, 'C', 'ஆல்', true),
    (q_id, 'D', 'இன்', false);

    -- Question 3
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('vetrumai', '"நான் புத்தகத்தை படித்தேன்" - இதில் எந்த வேற்றுமை உள்ளது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'இரண்டாம் வேற்றுமை', true),
    (q_id, 'B', 'மூன்றாம் வேற்றுமை', false),
    (q_id, 'C', 'நான்காம் வேற்றுமை', false),
    (q_id, 'D', 'ஐந்தாம் வேற்றுமை', false);

    -- Question 4
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('vetrumai', '"மரத்திலிருந்து பழம் விழுந்தது" - வேற்றுமை உருபு எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'இல்', false),
    (q_id, 'B', 'இன்', false),
    (q_id, 'C', 'இருந்து', true),
    (q_id, 'D', 'கு', false);

    -- Question 5
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('vetrumai', 'ஐந்தாம் வேற்றுமை உருபு எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'கு', false),
    (q_id, 'B', 'ஆல்', false),
    (q_id, 'C', 'இன்', true),
    (q_id, 'D', 'அது', false);

    -- =========================================================================
    -- SECTION 2: Seyyul Pazhamozhi (செய்யுள்/பழமொழி) - Poetry/Proverbs
    -- =========================================================================

    -- Question 1
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('seyyul_pazhamozhi', '"கற்றது கைமண் அளவு, கல்லாதது உலகளவு" - இப்பழமொழியின் பொருள் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'படிப்பது மிக எளிது', false),
    (q_id, 'B', 'நாம் அறிந்தது மிகக் குறைவு, அறியாதது மிக அதிகம்', true),
    (q_id, 'C', 'கற்றவர் சிறந்தவர்', false),
    (q_id, 'D', 'உலகம் மிகப் பெரியது', false);

    -- Question 2
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('seyyul_pazhamozhi', '"அகர முதல எழுத்தெல்லாம்" - இது யாருடைய வரிகள்?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'கம்பர்', false),
    (q_id, 'B', 'திருவள்ளுவர்', true),
    (q_id, 'C', 'பாரதியார்', false),
    (q_id, 'D', 'இளங்கோவடிகள்', false);

    -- Question 3
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('seyyul_pazhamozhi', '"ஆத்திசூடி" என்னும் நூலை எழுதியவர் யார்?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'ஔவையார்', true),
    (q_id, 'B', 'திருவள்ளுவர்', false),
    (q_id, 'C', 'கம்பர்', false),
    (q_id, 'D', 'பாரதியார்', false);

    -- Question 4
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('seyyul_pazhamozhi', '"விடியலுக்கு முன் இருள் அதிகம்" - இப்பழமொழியின் பொருள் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'இரவு நீண்டது', false),
    (q_id, 'B', 'வெற்றிக்கு முன் கஷ்டம் அதிகம் இருக்கும்', true),
    (q_id, 'C', 'சூரியன் தாமதமாக உதிக்கும்', false),
    (q_id, 'D', 'இருள் பயமானது', false);

    -- Question 5
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('seyyul_pazhamozhi', '"யாதும் ஊரே யாவரும் கேளிர்" - இவ்வரிகள் எந்த நூலில் உள்ளன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'திருக்குறள்', false),
    (q_id, 'B', 'புறநானூறு', true),
    (q_id, 'C', 'சிலப்பதிகாரம்', false),
    (q_id, 'D', 'கம்பராமாயணம்', false);

    -- =========================================================================
    -- SECTION 3: Adaimozhi Echcham (அடைமொழி/எச்சம்) - Adjectives/Participles
    -- =========================================================================

    -- Question 1
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('adaimozhi_echcham', '"பெரிய மரம்" - இதில் அடைமொழி எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'மரம்', false),
    (q_id, 'B', 'பெரிய', true),
    (q_id, 'C', 'பெரிய மரம்', false),
    (q_id, 'D', 'ஒன்றும் இல்லை', false);

    -- Question 2
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('adaimozhi_echcham', '"ஓடி வந்தான்" - இதில் எச்சம் எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'வந்தான்', false),
    (q_id, 'B', 'ஓடி', true),
    (q_id, 'C', 'ஓடி வந்தான்', false),
    (q_id, 'D', 'ஒன்றும் இல்லை', false);

    -- Question 3
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('adaimozhi_echcham', '"அழகான பூ" - இதில் உள்ள அடைமொழி வகை என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'பண்பு அடைமொழி', true),
    (q_id, 'B', 'தொழில் அடைமொழி', false),
    (q_id, 'C', 'எண் அடைமொழி', false),
    (q_id, 'D', 'சுட்டு அடைமொழி', false);

    -- Question 4
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('adaimozhi_echcham', '"படித்து முடித்தான்" - இதில் வினையெச்சம் எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'முடித்தான்', false),
    (q_id, 'B', 'படித்து', true),
    (q_id, 'C', 'படித்து முடித்தான்', false),
    (q_id, 'D', 'தான்', false);

    -- Question 5
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('adaimozhi_echcham', '"சிவந்த கண்கள்" - இதில் பெயரெச்சம் எது?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'கண்கள்', false),
    (q_id, 'B', 'சிவந்த', true),
    (q_id, 'C', 'சிவந்த கண்கள்', false),
    (q_id, 'D', 'ஒன்றும் இல்லை', false);

    -- =========================================================================
    -- SECTION 4: Comprehension (படிப்புணர்வு)
    -- =========================================================================

    -- Create a passage first
    INSERT INTO passages (title, content, status, created_by)
    VALUES (
        'சிங்கப்பூர்',
        'சிங்கப்பூர் ஒரு சிறிய நாடு. ஆனால் மிகவும் வளர்ச்சி அடைந்த நாடு. இங்கு பல இனத்தவர் வாழ்கின்றனர். சீனர், மலாய்க்காரர், இந்தியர், மற்றும் பிற இனத்தவர் ஒற்றுமையாக வாழ்கின்றனர். சிங்கப்பூரின் தலைநகரம் சிங்கப்பூர் நகரம் ஆகும்.',
        'published',
        admin_id
    ) RETURNING id INTO p_id;

    -- Question 1 with passage
    INSERT INTO questions (section, passage_id, question_text, status, created_by)
    VALUES ('comprehension', p_id, 'சிங்கப்பூர் எப்படிப்பட்ட நாடு?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'பெரிய நாடு', false),
    (q_id, 'B', 'சிறிய ஆனால் வளர்ச்சி அடைந்த நாடு', true),
    (q_id, 'C', 'ஏழ்மையான நாடு', false),
    (q_id, 'D', 'தனிமையான நாடு', false);

    -- Question 2 with passage
    INSERT INTO questions (section, passage_id, question_text, status, created_by)
    VALUES ('comprehension', p_id, 'சிங்கப்பூரில் யார் யார் வாழ்கின்றனர்?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'சீனர் மட்டும்', false),
    (q_id, 'B', 'இந்தியர் மட்டும்', false),
    (q_id, 'C', 'பல இனத்தவர்', true),
    (q_id, 'D', 'மலாய்க்காரர் மட்டும்', false);

    -- Create another passage
    INSERT INTO passages (title, content, status, created_by)
    VALUES (
        'புத்தகங்கள்',
        'புத்தகங்கள் நமது நல்ல நண்பர்கள். அவை நமக்கு அறிவை தருகின்றன. படிக்க படிக்க அறிவு வளரும். தினமும் புத்தகம் படிக்க வேண்டும். புத்தகக் கண்காட்சிக்குச் செல்ல வேண்டும்.',
        'published',
        admin_id
    ) RETURNING id INTO p_id;

    -- Question 3 with passage
    INSERT INTO questions (section, passage_id, question_text, status, created_by)
    VALUES ('comprehension', p_id, 'புத்தகங்களை எதற்கு ஒப்பிட்டுள்ளனர்?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'ஆசிரியர்கள்', false),
    (q_id, 'B', 'நண்பர்கள்', true),
    (q_id, 'C', 'பெற்றோர்கள்', false),
    (q_id, 'D', 'மாணவர்கள்', false);

    -- Question 4 with passage
    INSERT INTO questions (section, passage_id, question_text, status, created_by)
    VALUES ('comprehension', p_id, 'புத்தகங்கள் நமக்கு என்ன தருகின்றன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'பணம்', false),
    (q_id, 'B', 'உணவு', false),
    (q_id, 'C', 'அறிவு', true),
    (q_id, 'D', 'விளையாட்டு', false);

    -- Question 5 without passage
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('comprehension', 'படிப்புணர்வுப் பகுதியில் நாம் என்ன செய்ய வேண்டும்?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'பத்தியைப் படிக்காமல் பதில் எழுத வேண்டும்', false),
    (q_id, 'B', 'பத்தியை நன்கு படித்து புரிந்து பதில் எழுத வேண்டும்', true),
    (q_id, 'C', 'விடைகளை மட்டும் பார்க்க வேண்டும்', false),
    (q_id, 'D', 'சீக்கிரம் எழுத வேண்டும்', false);

    -- =========================================================================
    -- SECTION 5: Sorporul (சொற்பொருள்) - Word Meanings
    -- =========================================================================

    -- Question 1
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('sorporul', '"வானம்" என்ற சொல்லின் பொருள் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'நிலம்', false),
    (q_id, 'B', 'ஆகாயம்', true),
    (q_id, 'C', 'நீர்', false),
    (q_id, 'D', 'நெருப்பு', false);

    -- Question 2
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('sorporul', '"கனி" என்ற சொல்லின் பொருள் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'காய்', false),
    (q_id, 'B', 'பூ', false),
    (q_id, 'C', 'பழம்', true),
    (q_id, 'D', 'இலை', false);

    -- Question 3
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('sorporul', '"மாலை" என்ற சொல்லுக்கு எத்தனை பொருள்கள் உள்ளன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'ஒன்று (பூமாலை மட்டும்)', false),
    (q_id, 'B', 'இரண்டு (பூமாலை, மாலை நேரம்)', true),
    (q_id, 'C', 'மூன்று', false),
    (q_id, 'D', 'நான்கு', false);

    -- Question 4
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('sorporul', '"அன்பு" என்ற சொல்லின் எதிர்ச்சொல் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'வெறுப்பு', true),
    (q_id, 'B', 'மகிழ்ச்சி', false),
    (q_id, 'C', 'துன்பம்', false),
    (q_id, 'D', 'பாசம்', false);

    -- Question 5
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('sorporul', '"இல்லம்" என்ற சொல்லின் வேறு சொல் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'பள்ளி', false),
    (q_id, 'B', 'கடை', false),
    (q_id, 'C', 'வீடு', true),
    (q_id, 'D', 'கோயில்', false);

    -- =========================================================================
    -- SECTION 6: Oli Verupaadu (ஒலி வேறுபாடு) - Sound Differentiation
    -- =========================================================================

    -- Question 1
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('oli_verupaadu', '"அரசன்" - "அரசு" இரண்டு சொற்களுக்கும் உள்ள வேறுபாடு என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'ஒரே பொருள்', false),
    (q_id, 'B', 'அரசன் = மன்னன், அரசு = ஆட்சி', true),
    (q_id, 'C', 'வேறுபாடு இல்லை', false),
    (q_id, 'D', 'இரண்டும் தவறு', false);

    -- Question 2
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('oli_verupaadu', '"பனி" - "பணி" இவற்றின் பொருள் வேறுபாடு என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'பனி = தூறல், பணி = வேலை', true),
    (q_id, 'B', 'இரண்டும் ஒன்றே', false),
    (q_id, 'C', 'பனி = வேலை, பணி = தூறல்', false),
    (q_id, 'D', 'வேறுபாடு இல்லை', false);

    -- Question 3
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('oli_verupaadu', '"மரம்" - "மறம்" இவற்றின் வேறுபாடு என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'இரண்டும் ஒன்றே', false),
    (q_id, 'B', 'மரம் = தாவரம், மறம் = வீரம்', true),
    (q_id, 'C', 'மரம் = வீரம், மறம் = தாவரம்', false),
    (q_id, 'D', 'வேறுபாடு இல்லை', false);

    -- Question 4
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('oli_verupaadu', '"அகம்" - "அகம்" இவற்றின் பொருள் என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'வீடு மட்டும்', false),
    (q_id, 'B', 'உள்ளம், வீடு என இரு பொருள்கள்', true),
    (q_id, 'C', 'உள்ளம் மட்டும்', false),
    (q_id, 'D', 'பொருள் இல்லை', false);

    -- Question 5
    INSERT INTO questions (section, question_text, status, created_by)
    VALUES ('oli_verupaadu', '"கலை" - "களை" இவற்றின் வேறுபாடு என்ன?', 'published', admin_id)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_label, option_text, is_correct) VALUES
    (q_id, 'A', 'கலை = art, களை = weed', true),
    (q_id, 'B', 'இரண்டும் ஒன்றே', false),
    (q_id, 'C', 'கலை = weed, களை = art', false),
    (q_id, 'D', 'வேறுபாடு இல்லை', false);

    RAISE NOTICE 'Seed data inserted successfully!';
END $$;

-- Summary of seeded data
SELECT
    section,
    COUNT(*) as question_count
FROM questions
WHERE status = 'published'
GROUP BY section
ORDER BY section;
