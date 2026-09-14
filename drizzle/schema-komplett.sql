-- Life Journal — komplettes Datenbankschema
-- Im Supabase SQL Editor einfügen und ausführen (New query → Run).
-- Danach NICHT mehr 'npm run db:migrate' nutzen, sonst kollidieren die Migrationen.

-- ==== 0000_glamorous_reaper.sql ====
CREATE TYPE "public"."block_status" AS ENUM('planned', 'active', 'done', 'skipped', 'moved');
CREATE TYPE "public"."category" AS ENUM('sleep', 'work', 'meal', 'fitness', 'routine', 'development', 'chores', 'tasks', 'leisure', 'social', 'relationship', 'health', 'other');
CREATE TYPE "public"."diet" AS ENUM('vegetarian', 'vegan', 'pescetarian', 'omnivore');
CREATE TYPE "public"."goal_status" AS ENUM('active', 'paused', 'done', 'archived');
CREATE TYPE "public"."meal_slot" AS ENUM('breakfast', 'lunch', 'snack', 'dinner', 'late');
CREATE TYPE "public"."recurrence" AS ENUM('none', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly');
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'done', 'postponed');
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"default_minutes" integer DEFAULT 30 NOT NULL,
	"is_fixed" boolean DEFAULT false NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"auto_plan" boolean DEFAULT true NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "activity_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"weekdays" integer[] DEFAULT '{1,2,3,4,5,6,7}' NOT NULL,
	"recurrence" "recurrence" DEFAULT 'daily' NOT NULL,
	"preferred_start" integer DEFAULT 540 NOT NULL,
	"earliest_start" integer DEFAULT 0 NOT NULL,
	"latest_start" integer DEFAULT 1380 NOT NULL,
	"duration_minutes" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL,
	"day" date NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"recurrence" "recurrence" DEFAULT 'none' NOT NULL,
	"recurrence_until" date,
	"is_fixed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "daily_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"generated_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text DEFAULT '' NOT NULL,
	"equipment_name" text DEFAULT 'Körpergewicht' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"default_sets" integer DEFAULT 3 NOT NULL,
	"default_reps" integer DEFAULT 10 NOT NULL,
	"default_weight" numeric(6, 2) DEFAULT '0' NOT NULL,
	"default_duration_seconds" integer DEFAULT 0 NOT NULL,
	"rest_seconds" integer DEFAULT 90 NOT NULL,
	"difficulty" integer DEFAULT 2 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Sonstiges' NOT NULL,
	"unit" text DEFAULT 'g' NOT NULL,
	"reference_amount" numeric(8, 2) DEFAULT '100' NOT NULL,
	"kcal" numeric(8, 2) DEFAULT '0' NOT NULL,
	"protein" numeric(8, 2) DEFAULT '0' NOT NULL,
	"carbs" numeric(8, 2) DEFAULT '0' NOT NULL,
	"fat" numeric(8, 2) DEFAULT '0' NOT NULL,
	"is_protein_source" boolean DEFAULT false NOT NULL,
	"vegetarian" boolean DEFAULT true NOT NULL,
	"vegan" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "goal_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"due_date" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" "category" DEFAULT 'development' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"deadline" date,
	"progress" integer DEFAULT 0 NOT NULL,
	"weekly_minutes" integer DEFAULT 300 NOT NULL,
	"auto_plan" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "meal_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"meal_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"amount" numeric(8, 2) DEFAULT '100' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"slot" "meal_slot" NOT NULL,
	"meal_id" uuid NOT NULL,
	"start_minute" integer DEFAULT 720 NOT NULL,
	"eaten" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slot" "meal_slot" DEFAULT 'lunch' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"prep_minutes" integer DEFAULT 15 NOT NULL,
	"training_day_only" boolean DEFAULT false NOT NULL,
	"rest_day_only" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "routine_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"day" date NOT NULL,
	"completed_steps" text[] DEFAULT '{}' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "routine_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"title" text NOT NULL,
	"duration_minutes" integer DEFAULT 5 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"start_minute" integer DEFAULT 420 NOT NULL,
	"weekdays" integer[] DEFAULT '{1,2,3,4,5,6,7}' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"auto_plan" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "schedule_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"activity_id" uuid,
	"task_id" uuid,
	"goal_id" uuid,
	"workout_plan_id" uuid,
	"meal_id" uuid,
	"event_id" uuid,
	"routine_id" uuid,
	"title" text NOT NULL,
	"category" "category" DEFAULT 'other' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"status" "block_status" DEFAULT 'planned' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"is_fixed" boolean DEFAULT false NOT NULL,
	"is_buffer" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "screen_time_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"app" text NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"locale" text DEFAULT 'de' NOT NULL,
	"timezone" text DEFAULT 'Europe/Berlin' NOT NULL,
	"week_start" integer DEFAULT 1 NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"wake_time" integer DEFAULT 420 NOT NULL,
	"sleep_time" integer DEFAULT 1380 NOT NULL,
	"sleep_duration_target" integer DEFAULT 480 NOT NULL,
	"wake_time_free_day" integer DEFAULT 480 NOT NULL,
	"sleep_time_free_day" integer DEFAULT 1410 NOT NULL,
	"work_days" integer[] DEFAULT '{1,2,3,4,5}' NOT NULL,
	"work_start" integer DEFAULT 540 NOT NULL,
	"work_end" integer DEFAULT 990 NOT NULL,
	"work_break_start" integer DEFAULT 720 NOT NULL,
	"work_break_minutes" integer DEFAULT 30 NOT NULL,
	"buffer_minutes" integer DEFAULT 15 NOT NULL,
	"min_free_minutes" integer DEFAULT 60 NOT NULL,
	"auto_plan_enabled" boolean DEFAULT true NOT NULL,
	"auto_plan_tasks" boolean DEFAULT true NOT NULL,
	"auto_plan_meals" boolean DEFAULT true NOT NULL,
	"auto_plan_goals" boolean DEFAULT true NOT NULL,
	"planning_granularity" integer DEFAULT 5 NOT NULL,
	"training_days" integer[] DEFAULT '{1,2,4,5}' NOT NULL,
	"training_minutes" integer DEFAULT 60 NOT NULL,
	"preferred_training_time" integer DEFAULT 1020 NOT NULL,
	"diet" "diet" DEFAULT 'vegetarian' NOT NULL,
	"meals_per_day" integer DEFAULT 4 NOT NULL,
	"calorie_target" integer DEFAULT 2400 NOT NULL,
	"protein_target" integer DEFAULT 130 NOT NULL,
	"excluded_foods" text[] DEFAULT '{}' NOT NULL,
	"preferred_proteins" text[] DEFAULT '{}' NOT NULL,
	"social_media_limit" integer DEFAULT 45 NOT NULL,
	"netflix_limit" integer DEFAULT 75 NOT NULL,
	"gaming_limit" integer DEFAULT 60 NOT NULL,
	"notify_upcoming" boolean DEFAULT false NOT NULL,
	"notify_meals" boolean DEFAULT false NOT NULL,
	"notify_workout" boolean DEFAULT false NOT NULL,
	"notify_goals" boolean DEFAULT false NOT NULL,
	"notify_lead_minutes" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "shopping_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"list_id" uuid NOT NULL,
	"food_id" uuid,
	"name" text NOT NULL,
	"category" text DEFAULT 'Sonstiges' NOT NULL,
	"amount" numeric(8, 2) DEFAULT '1' NOT NULL,
	"unit" text DEFAULT 'Stk' NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"manual" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "shopping_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT 'Einkaufsliste' NOT NULL,
	"from_day" date,
	"to_day" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sleep_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"quality" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"metric" text NOT NULL,
	"value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "task_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" "category" DEFAULT 'tasks' NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"due_date" date,
	"estimate_minutes" integer DEFAULT 30 NOT NULL,
	"recurrence" "recurrence" DEFAULT 'none' NOT NULL,
	"auto_schedule" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"goal_id" uuid,
	"completed_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"seeded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workout_plan_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps" integer DEFAULT 10 NOT NULL,
	"weight" numeric(6, 2) DEFAULT '0' NOT NULL,
	"rest_seconds" integer DEFAULT 90 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "workout_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"weekdays" integer[] DEFAULT '{}' NOT NULL,
	"estimated_minutes" integer DEFAULT 60 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"name" text NOT NULL,
	"day" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"perceived_effort" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer DEFAULT 1 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"weight" numeric(6, 2) DEFAULT '0' NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"done" boolean DEFAULT true NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "activity_rules" ADD CONSTRAINT "activity_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "activity_rules" ADD CONSTRAINT "activity_rules_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "routine_completions" ADD CONSTRAINT "routine_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "routine_completions" ADD CONSTRAINT "routine_completions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_plan_id_daily_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."daily_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "screen_time_logs" ADD CONSTRAINT "screen_time_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_list_id_shopping_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "statistics" ADD CONSTRAINT "statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_plan_id_workout_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_id_workout_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "activities_user_idx" ON "activities" USING btree ("user_id");
CREATE INDEX "activity_rules_user_idx" ON "activity_rules" USING btree ("user_id");
CREATE INDEX "activity_rules_activity_idx" ON "activity_rules" USING btree ("activity_id");
CREATE INDEX "calendar_events_user_day_idx" ON "calendar_events" USING btree ("user_id","day");
CREATE UNIQUE INDEX "daily_plans_user_day_unique" ON "daily_plans" USING btree ("user_id","day");
CREATE INDEX "equipment_user_idx" ON "equipment" USING btree ("user_id");
CREATE INDEX "exercises_user_idx" ON "exercises" USING btree ("user_id");
CREATE INDEX "foods_user_idx" ON "foods" USING btree ("user_id");
CREATE INDEX "goal_milestones_goal_idx" ON "goal_milestones" USING btree ("goal_id");
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");
CREATE INDEX "meal_ingredients_meal_idx" ON "meal_ingredients" USING btree ("meal_id");
CREATE UNIQUE INDEX "meal_plans_unique" ON "meal_plans" USING btree ("user_id","day","slot");
CREATE INDEX "meal_plans_user_day_idx" ON "meal_plans" USING btree ("user_id","day");
CREATE INDEX "meals_user_idx" ON "meals" USING btree ("user_id");
CREATE UNIQUE INDEX "prt_token_unique" ON "password_reset_tokens" USING btree ("token_hash");
CREATE UNIQUE INDEX "routine_completion_unique" ON "routine_completions" USING btree ("routine_id","day");
CREATE INDEX "routine_steps_routine_idx" ON "routine_steps" USING btree ("routine_id");
CREATE INDEX "routines_user_idx" ON "routines" USING btree ("user_id");
CREATE INDEX "schedule_blocks_plan_idx" ON "schedule_blocks" USING btree ("plan_id");
CREATE INDEX "schedule_blocks_user_idx" ON "schedule_blocks" USING btree ("user_id");
CREATE UNIQUE INDEX "screen_time_unique" ON "screen_time_logs" USING btree ("user_id","day","app");
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token_hash");
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
CREATE UNIQUE INDEX "settings_user_unique" ON "settings" USING btree ("user_id");
CREATE INDEX "shopping_list_items_list_idx" ON "shopping_list_items" USING btree ("list_id");
CREATE INDEX "shopping_lists_user_idx" ON "shopping_lists" USING btree ("user_id");
CREATE UNIQUE INDEX "sleep_logs_unique" ON "sleep_logs" USING btree ("user_id","day");
CREATE UNIQUE INDEX "statistics_unique" ON "statistics" USING btree ("user_id","day","metric");
CREATE INDEX "statistics_user_day_idx" ON "statistics" USING btree ("user_id","day");
CREATE INDEX "task_subtasks_task_idx" ON "task_subtasks" USING btree ("task_id");
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("user_id","status");
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");
CREATE INDEX "wpe_plan_idx" ON "workout_plan_exercises" USING btree ("plan_id");
CREATE INDEX "workout_plans_user_idx" ON "workout_plans" USING btree ("user_id");
CREATE INDEX "workout_sessions_user_day_idx" ON "workout_sessions" USING btree ("user_id","day");
CREATE INDEX "workout_sets_session_idx" ON "workout_sets" USING btree ("session_id");
CREATE INDEX "workout_sets_exercise_idx" ON "workout_sets" USING btree ("user_id","exercise_id");
-- ==== 0001_add_activity_meal_slot.sql ====
ALTER TABLE "activities" ADD COLUMN "meal_slot" "meal_slot";