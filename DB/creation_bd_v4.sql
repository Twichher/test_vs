-------------------------------------------------------------------------------

-- Table: user_table_1 (PostgreSQL)

	CREATE TABLE IF NOT EXISTS user_table_1 (
	  user_id BIGSERIAL PRIMARY KEY,
	
	  first_name   VARCHAR(100) NOT NULL,
	  last_name    VARCHAR(100) NOT NULL,
	  middle_name  VARCHAR(100),
	  birth_date   DATE,
	
	  gender       CHAR(1) CHECK (gender IN ('M','F')),
	
	  email         VARCHAR(255) NOT NULL UNIQUE,
	  password_hash TEXT NOT NULL,
	
	  city      VARCHAR(120),
	  district  VARCHAR(120),
	  
	  is_organizer BOOLEAN NOT NULL DEFAULT FALSE,
	  is_admin     BOOLEAN NOT NULL DEFAULT FALSE,
	
	  created_at   TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
	
	  is_registration_completed BOOLEAN NOT NULL DEFAULT FALSE,
	  registration_completed_at TIMESTAMP WITHOUT TIME ZONE,
	
	  is_blocked   BOOLEAN NOT NULL DEFAULT FALSE,
	  blocked_at   TIMESTAMP WITHOUT TIME ZONE,
	
	  CONSTRAINT chk_registration_completed_at CHECK (
	    (is_registration_completed = FALSE AND registration_completed_at IS NULL)
	    OR
	    (is_registration_completed = TRUE  AND registration_completed_at IS NOT NULL)
	  ),
	  CONSTRAINT chk_blocked_at CHECK (
	    (is_blocked = FALSE AND blocked_at IS NULL)
	    OR
	    (is_blocked = TRUE  AND blocked_at IS NOT NULL)
	  )
	);

-------------------------------------------------------------------------------

-- Table: meeting_table_2

CREATE TABLE IF NOT EXISTS meeting_table_2 (
  meeting_id BIGSERIAL PRIMARY KEY,

  -- creator of the meeting
  creator_user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id),

  title        VARCHAR(200) NOT NULL,
  description  TEXT, -- как это not null?

  max_people   INTEGER NOT NULL CHECK (max_people > 0),

  address      VARCHAR(255),-- как это not null?
  city         VARCHAR(120),-- как это not null?
  district     VARCHAR(120),-- как это not null?

  adults_only  BOOLEAN NOT NULL DEFAULT FALSE,

  status VARCHAR(20) NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'in_progress', 'finished', 'canceled')),

  start_at      TIMESTAMP WITHOUT TIME ZONE,
  end_at        TIMESTAMP WITHOUT TIME ZONE,
  actual_end_at TIMESTAMP WITHOUT TIME ZONE,

  created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

  rating_after_end NUMERIC(4,2) NOT NULL DEFAULT 0 
  	CHECK (rating_after_end >= 0),

  count_of_ratings INTEGER 
		NOT NULL DEFAULT 0 
	  	CHECK (count_of_ratings >= 0),

  -- Optional consistency checks
  CONSTRAINT chk_meeting_end_after_start CHECK (
    start_at IS NULL OR end_at IS NULL OR end_at >= start_at
  ),
  CONSTRAINT chk_meeting_actual_end_after_start CHECK (
    start_at IS NULL OR actual_end_at IS NULL OR actual_end_at >= start_at
  )
);

-- Helpful index for queries like "all meetings by creator"
CREATE INDEX IF NOT EXISTS idx_meeting_creator_user_id
  ON meeting_table_2 (creator_user_id);

-- Helpful index for filtering/sorting by time
CREATE INDEX IF NOT EXISTS idx_meeting_start_at
  ON meeting_table_2 (start_at);

-------------------------------------------------------------------------------

-- Table: user_extra_info_table_3

CREATE TABLE IF NOT EXISTS user_extra_info_table_3 (
  record_id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  meetings_visited_as_guest        	INTEGER NOT NULL DEFAULT 0 CHECK (meetings_visited_as_guest >= 0),
  count_period_meetings_guest			INTEGER NOT NULL DEFAULT 0 CHECK (count_period_meetings_guest >= 0),	
  count_all_rating_guest				INTEGER NOT NULL DEFAULT 0 CHECK (count_all_rating_guest >= 0),
  rating_as_guest                  	NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (rating_as_guest >= 0),
  count_period_rating_guest				INTEGER NOT NULL DEFAULT 0 CHECK (count_period_rating_guest >= 0),
  intermediate_rating_as_guest     	NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (intermediate_rating_as_guest >= 0),

  meetings_created_as_organizer    	INTEGER NOT NULL DEFAULT 0 CHECK (meetings_created_as_organizer >= 0),
  rating_as_organizer              	NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (rating_as_organizer >= 0),
  count_period_meetings_as_organizer  	INTEGER NOT NULL DEFAULT 0 CHECK (count_period_meetings_as_organizer >= 0),
  intermediate_rating_as_organizer 	NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (intermediate_rating_as_organizer >= 0),

  meetings_as_currency             	INTEGER NOT NULL DEFAULT 0 CHECK (meetings_as_currency >= 0),
  earned_currency 						NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (earned_currency >= 0),
  date_of_stats 						TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_extra_info_user_id
  ON user_extra_info_table_3 (user_id);

DROP INDEX IF EXISTS ux_user_extra_info_user_id;

-------------------------------------------------------------------------------

-- Table: notifications_table_4

CREATE TABLE IF NOT EXISTS notifications_table_4 (
  notification_id BIGSERIAL PRIMARY KEY,

  -- can be NULL (per your schema)
  meeting_id BIGINT
    REFERENCES meeting_table_2(meeting_id)
    ON DELETE SET NULL,

  notification_type VARCHAR(50) NOT NULL, --встреча, правила, новости, верификация
  notification_text TEXT NOT NULL,

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_meeting_id
  ON notifications_table_4 (meeting_id);

-------------------------------------------------------------------------------

-- Table: user_notifications_table_5

CREATE TABLE IF NOT EXISTS user_notifications_table_5 (
  record_id BIGSERIAL PRIMARY KEY,

  notification_id BIGINT NOT NULL
    REFERENCES notifications_table_4(notification_id)
    ON DELETE CASCADE,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  sent_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

  status VARCHAR(10) NOT NULL DEFAULT 'unread'
    CHECK (status IN ('read', 'unread')),

  -- обычно одна запись на (notification, user)
  CONSTRAINT ux_user_notification UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id
  ON user_notifications_table_5 (user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id
  ON user_notifications_table_5 (notification_id);

-------------------------------------------------------------------------------

-- Table: notification_photos_table_6

CREATE TABLE IF NOT EXISTS notification_photos_table_6 (
  record_id BIGSERIAL PRIMARY KEY,

  notification_id BIGINT NOT NULL
    REFERENCES notifications_table_4(notification_id)
    ON DELETE CASCADE,

  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_photos_notification_id
  ON notification_photos_table_6 (notification_id);

-------------------------------------------------------------------------------

-- Table: conflict_table_7

CREATE TABLE IF NOT EXISTS conflict_table_7 (
  conflict_id BIGSERIAL PRIMARY KEY,

  meeting_id BIGINT NOT NULL
    REFERENCES meeting_table_2(meeting_id)
    ON DELETE CASCADE,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  total_allowed_to_vote INTEGER NOT NULL DEFAULT 0 CHECK (total_allowed_to_vote >= 0),
  total_voted           INTEGER NOT NULL DEFAULT 0 CHECK (total_voted >= 0),
  voted_for_count       INTEGER NOT NULL DEFAULT 0 CHECK (voted_for_count >= 0),

  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('no', 'yes', 'in_progress')),

  created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP WITHOUT TIME ZONE,
  
  CONSTRAINT chk_votes_not_more_than_allowed CHECK (total_voted <= total_allowed_to_vote),
  CONSTRAINT chk_for_not_more_than_voted CHECK (voted_for_count <= total_voted)
);

CREATE INDEX IF NOT EXISTS idx_conflict_meeting_id
  ON conflict_table_7 (meeting_id);

CREATE INDEX IF NOT EXISTS idx_conflict_user_id
  ON conflict_table_7 (user_id);

-------------------------------------------------------------------------------

-- Table: meeting_rating_table_8

CREATE TABLE IF NOT EXISTS meeting_rating_table_8 (
  record_id BIGSERIAL PRIMARY KEY,

  meeting_id BIGINT NOT NULL
    REFERENCES meeting_table_2(meeting_id)
    ON DELETE CASCADE,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id) 
    ON DELETE CASCADE,

  user_action VARCHAR(20) NOT NULL
    CHECK (user_action IN ('registered', 'attended', 'missed')),

  registered_at TIMESTAMP WITHOUT TIME ZONE,

  CONSTRAINT ux_meeting_rating_meeting_user UNIQUE (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_rating_meeting_id
  ON meeting_rating_table_8 (meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_rating_user_id
  ON meeting_rating_table_8 (user_id);

-------------------------------------------------------------------------------

-- Table: conflict_photos_table_9

CREATE TABLE IF NOT EXISTS conflict_photos_table_9 (
  record_id BIGSERIAL PRIMARY KEY,

  conflict_id BIGINT NOT NULL
    REFERENCES conflict_table_7(conflict_id)
    ON DELETE CASCADE,

  proof_photo_url TEXT NOT NULL, -- "link to photo"
  uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflict_photos_conflict_id
  ON conflict_photos_table_9 (conflict_id);

-------------------------------------------------------------------------------

-- categories_table_10

CREATE TABLE IF NOT EXISTS categories_table_10 (
  category_id BIGSERIAL PRIMARY KEY,
  category_name VARCHAR(150) NOT NULL UNIQUE,
  photo_url TEXT NOT NULL DEFAULT 'http://127.0.0.1:9000/allphotos/no.jpg'
);

-------------------------------------------------------------------------------

-- meeting_categories_table_11

CREATE TABLE IF NOT EXISTS meeting_categories_table_11 (
  record_id BIGSERIAL PRIMARY KEY,

  meeting_id BIGINT NOT NULL
    REFERENCES meeting_table_2(meeting_id)
    ON DELETE CASCADE,

  category_id BIGINT NOT NULL
    REFERENCES categories_table_10(category_id)
    ON DELETE RESTRICT,

  category_value INTEGER NOT NULL DEFAULT 10
    CHECK (category_value = 10),

  -- usually: 1 row per (meeting, category)
  CONSTRAINT ux_meeting_category UNIQUE (meeting_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_categories_meeting_id
  ON meeting_categories_table_11 (meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_categories_category_id
  ON meeting_categories_table_11 (category_id);

-------------------------------------------------------------------------------

-- Table: user_categories_table_12

CREATE TABLE IF NOT EXISTS user_categories_table_12 (
  record_id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  category_id BIGINT NOT NULL
    REFERENCES categories_table_10(category_id)
    ON DELETE RESTRICT,

  category_value INTEGER NOT NULL DEFAULT 0,

  -- usually: 1 row per (user, category)
  CONSTRAINT ux_user_category UNIQUE (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_user_categories_user_id
  ON user_categories_table_12 (user_id);

CREATE INDEX IF NOT EXISTS idx_user_categories_category_id
  ON user_categories_table_12 (category_id);

-------------------------------------------------------------------------------

-- warnings_table_13

CREATE TABLE IF NOT EXISTS warnings_table_13 (
  warning_id BIGSERIAL PRIMARY KEY,
  warning_name VARCHAR(150) NOT NULL UNIQUE
);

-------------------------------------------------------------------------------

-- Table: user_photos_table_14

CREATE TABLE IF NOT EXISTS user_photos_table_14 (
  record_id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_photos_user_id
  ON user_photos_table_14 (user_id);

ALTER TABLE user_photos_table_14
ADD COLUMN photo_url TEXT NOT NULL;

-------------------------------------------------------------------------------

-- Table: user_ratings_table_15
-- one user rates another user (1..10)

CREATE TABLE IF NOT EXISTS user_ratings_table_15 (
  record_id BIGSERIAL PRIMARY KEY,

  rated_user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  rater_user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  rating_value INTEGER NOT NULL
    CHECK (rating_value BETWEEN 1 AND 10),

  meeting_id BIGINT NOT NULL	REFERENCES meeting_table_2(meeting_id)	ON DELETE CASCADE,

  rated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

  -- prevent rating yourself
  CONSTRAINT chk_no_self_rating CHECK (rated_user_id <> rater_user_id),

  -- usually: one rating per (rater -> rated). If you want multiple over time, remove this.
  CONSTRAINT ux_user_rating_meeting	UNIQUE (meeting_id, rated_user_id, rater_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_user_id
  ON user_ratings_table_15 (rated_user_id);

CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_user_id
  ON user_ratings_table_15 (rater_user_id);

-------------------------------------------------------------------------------

-- Table: verification_table_16

CREATE TABLE IF NOT EXISTS verification_table_16 (
  verification_id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  photo_1_url TEXT NOT NULL,
  photo_2_url TEXT NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'rejected', 'approved')),

  photos_uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  status_changed_at  TIMESTAMP WITHOUT TIME ZONE
);

-- Usually you want to quickly find current verification by user
CREATE INDEX IF NOT EXISTS idx_verification_user_id
  ON verification_table_16 (user_id);

-------------------------------------------------------------------------------

-- Table: support_table_17

CREATE TABLE IF NOT EXISTS support_table_17 (
  ticket_id BIGSERIAL PRIMARY KEY,

  -- who created the ticket
  requester_user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  -- admin who closed the ticket (can be NULL until closed)
  closed_by_admin_user_id BIGINT
    REFERENCES user_table_1(user_id)
    ON DELETE SET NULL,

  -- free text category (per your request)
  category TEXT NOT NULL,

  message_text TEXT NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'in_progress', 'resolved')),

  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at  TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_support_requester_user_id
  ON support_table_17 (requester_user_id);

CREATE INDEX IF NOT EXISTS idx_support_status
  ON support_table_17 (status);

-------------------------------------------------------------------------------

-- Table: faq_table_18

CREATE TABLE IF NOT EXISTS faq_table_18(
	question_id serial PRIMARY KEY,
	question_text TEXT,
	question_answer TEXT
);

-------------------------------------------------------------------------------

-- Table: services_table_19

CREATE TABLE IF NOT EXISTS services_table_19 (
  service_id BIGSERIAL PRIMARY KEY,

  service_name VARCHAR(150) NOT NULL UNIQUE,
  service_description TEXT,
  service_price NUMERIC(12,2) NOT NULL CHECK (service_price >= 0)
);

-------------------------------------------------------------------------------

-- Table: user_services_table_20

CREATE TABLE IF NOT EXISTS user_services_table_20 (
  record_id BIGSERIAL PRIMARY KEY,

  service_id BIGINT NOT NULL
    REFERENCES services_table_19(service_id)
    ON DELETE RESTRICT,

  user_id BIGINT NOT NULL
    REFERENCES user_table_1(user_id)
    ON DELETE CASCADE,

  count_services INTEGER NOT NULL DEFAULT 1 CHECK (count_services >= 1),

  bought_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_services_user_id ON user_services_table_20 (user_id);

CREATE INDEX IF NOT EXISTS idx_user_services_service_id ON user_services_table_20 (service_id);

-------------------------------------------------------------------------------

-- meeting_warnings_table_21

CREATE TABLE IF NOT EXISTS meeting_warnings_table_21 (
  record_id BIGSERIAL PRIMARY KEY,

  meeting_id BIGINT NOT NULL
    REFERENCES meeting_table_2(meeting_id)
    ON DELETE CASCADE,

  warning_id BIGINT NOT NULL
    REFERENCES warnings_table_13(warning_id)
    ON DELETE RESTRICT,

  -- usually: 1 row per (meeting, warning)
  CONSTRAINT ux_meeting_warning UNIQUE (meeting_id, warning_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_warnings_meeting_id
  ON meeting_warnings_table_21 (meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_warnings_warning_id
  ON meeting_warnings_table_21 (warning_id);

-------------------------------------------------------------------------------

-- Table: support_photos_table_22

CREATE TABLE IF NOT EXISTS support_photos_table_22 (
  photo_id BIGSERIAL PRIMARY KEY,

  ticket_id BIGINT NOT NULL
    REFERENCES support_table_17(ticket_id)
    ON DELETE CASCADE,

  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_photos_ticket_id
  ON support_photos_table_22 (ticket_id);

-------------------------------------------------------------------------------

-- Table: categories_to_support_table_23

CREATE TABLE IF NOT EXISTS categories_to_support_table_23(
	category_to_support_id BIGSERIAL PRIMARY KEY,
	text_category VARCHAR(255) NOT NULL
)

-------------------------------------------------------------------------------

-- Table: start_end_trial_period_table_25

CREATE TABLE IF NOT EXISTS start_end_trial_period_table_25(
    period_id BIGSERIAL PRIMARY KEY,  
    start_trial_period TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_trial_period TIMESTAMP WITHOUT TIME ZONE NOT NULL,
		CONSTRAINT chk_period_end_after_start CHECK (
	    start_trial_period IS NULL 
		OR end_trial_period IS NULL 
		OR end_trial_period > start_trial_period
	  )
);

-------------------------------------------------------------------------------

-- Table: meeting_rating_info_table_26

CREATE TABLE IF NOT EXISTS meeting_rating_info_table_26(
	record_id BIGSERIAL PRIMARY KEY,
	meeting_id BIGINT NOT NULL
	    REFERENCES meeting_table_2(meeting_id)
	    ON DELETE CASCADE,
	user_id BIGINT NOT NULL
	    REFERENCES user_table_1(user_id) 
	    ON DELETE CASCADE,
	meeting_rating INTEGER
    	CHECK (meeting_rating BETWEEN 1 AND 10),

  last_action_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT ux_meeting_rating_meeting_user_26 UNIQUE (meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_rating_meeting_id_26
  ON meeting_rating_info_table_26 (meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_rating_user_id_26
  ON meeting_rating_info_table_26 (user_id);

