CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_uq` ON `accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `admin_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`level` text DEFAULT 'info' NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`diff` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `admin_audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `admin_audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`translation_key` text NOT NULL,
	`locale` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`body_md` text NOT NULL,
	`body_hast` text,
	`toc_json` text,
	`cover_image_key` text,
	`cover_alt` text,
	`og_image_key` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reading_minutes` integer DEFAULT 1 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`author_id` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_path_uq` ON `blog_posts` (`locale`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_translation_uq` ON `blog_posts` (`translation_key`,`locale`);--> statement-breakpoint
CREATE INDEX `blog_posts_listing_idx` ON `blog_posts` (`locale`,`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `docs_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`translation_key` text NOT NULL,
	`locale` text NOT NULL,
	`category_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body_md` text NOT NULL,
	`body_hast` text,
	`toc_json` text,
	`search_text` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`app_version_min` text,
	`author_id` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `docs_categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `docs_articles_path_uq` ON `docs_articles` (`locale`,`category_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `docs_articles_translation_uq` ON `docs_articles` (`translation_key`,`locale`);--> statement-breakpoint
CREATE INDEX `docs_articles_listing_idx` ON `docs_articles` (`locale`,`status`,`category_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `docs_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`parent_id` text,
	`title_en` text NOT NULL,
	`title_si` text NOT NULL,
	`title_ta` text NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_si` text DEFAULT '' NOT NULL,
	`description_ta` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'BookOpen' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `docs_categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `docs_categories_slug_uq` ON `docs_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `docs_categories_sort_idx` ON `docs_categories` (`parent_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `donations` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_code` text NOT NULL,
	`method` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'LKR' NOT NULL,
	`display_name` text,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`public_message` text,
	`message_approved` integer DEFAULT false NOT NULL,
	`show_amount_publicly` integer DEFAULT false NOT NULL,
	`contact_private` text,
	`submit_secret_hash` text NOT NULL,
	`slip_key` text,
	`slip_mime` text,
	`slip_size` integer,
	`txn_reference` text,
	`merchant_id` text,
	`user_id` text,
	`status` text DEFAULT 'awaiting_payment' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "donations_amount_min" CHECK("donations"."amount_cents" >= 10000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `donations_reference_uq` ON `donations` (`reference_code`);--> statement-breakpoint
CREATE INDEX `donations_queue_idx` ON `donations` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `donations_merchant_idx` ON `donations` (`merchant_id`,`status`);--> statement-breakpoint
CREATE TABLE `feedback_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`public_number` integer NOT NULL,
	`draft_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body_md` text NOT NULL,
	`app_version` text,
	`windows_version` text,
	`severity` text,
	`status` text DEFAULT 'open' NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`vote_count` integer DEFAULT 0 NOT NULL,
	`crash_log_key` text,
	`screenshot_key` text,
	`contact_private` text,
	`screenshot_public_key` text,
	`reporter_user_id` text,
	`reported_merchant_id` text,
	`duplicate_of_id` text,
	`resolved_in_release_id` text,
	`admin_response_md` text,
	`admin_responded_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reported_merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`duplicate_of_id`) REFERENCES `feedback_tickets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resolved_in_release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "feedback_title_len" CHECK(length("feedback_tickets"."title") BETWEEN 8 AND 120)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_public_number_uq` ON `feedback_tickets` (`public_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `feedback_draft_uq` ON `feedback_tickets` (`draft_id`);--> statement-breakpoint
CREATE INDEX `feedback_board_idx` ON `feedback_tickets` (`is_public`,`type`,`status`,`vote_count`);--> statement-breakpoint
CREATE INDEX `feedback_reporter_idx` ON `feedback_tickets` (`reporter_user_id`);--> statement-breakpoint
CREATE TABLE `feedback_votes` (
	`ticket_id` text NOT NULL,
	`voter_key` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`ticket_id`, `voter_key`),
	FOREIGN KEY (`ticket_id`) REFERENCES `feedback_tickets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `merchant_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant_id` text,
	`release_id` text,
	`event` text NOT NULL,
	`meta` text,
	`ip_hash` text,
	`country` text,
	`ua_family` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `merchant_logs_merchant_idx` ON `merchant_logs` (`merchant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `merchant_logs_event_idx` ON `merchant_logs` (`event`,`created_at`);--> statement-breakpoint
CREATE TABLE `merchants` (
	`id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`owner_user_id` text,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp` text,
	`telegram` text,
	`shop_name` text NOT NULL,
	`category` text NOT NULL,
	`district` text NOT NULL,
	`city` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`location_source` text NOT NULL,
	`is_public_on_map` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'listed' NOT NULL,
	`is_supporter` integer DEFAULT false NOT NULL,
	`supporter_since` integer,
	`terms_version` text NOT NULL,
	`terms_accepted_at` integer NOT NULL,
	`claim_token_hash` text,
	`claim_redeemed_at` integer,
	`preferred_locale` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "merchants_lat_lk" CHECK("merchants"."lat" BETWEEN 5.8 AND 10.0),
	CONSTRAINT "merchants_lng_lk" CHECK("merchants"."lng" BETWEEN 79.5 AND 82.0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_public_id_uq` ON `merchants` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_phone_active_uq` ON `merchants` (`phone`) WHERE "merchants"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `merchants_owner_idx` ON `merchants` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `merchants_map_idx` ON `merchants` (`status`,`is_public_on_map`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `merchants_district_idx` ON `merchants` (`district`);--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`channel` text DEFAULT 'stable' NOT NULL,
	`title` text NOT NULL,
	`notes_md` text DEFAULT '' NOT NULL,
	`notes_hast` text,
	`min_os` text DEFAULT 'Windows 10 or later' NOT NULL,
	`release_date` text NOT NULL,
	`published_at` integer NOT NULL,
	`min_version` text,
	`changelog_raw` text,
	`exe_name` text NOT NULL,
	`exe_url` text NOT NULL,
	`exe_size` integer NOT NULL,
	`exe_sha256` text NOT NULL,
	`is_latest` integer DEFAULT false NOT NULL,
	`is_yanked` integer DEFAULT false NOT NULL,
	`source` text DEFAULT 'github_sync' NOT NULL,
	`github_release_id` integer,
	`synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "releases_exe_sha" CHECK(length("releases"."exe_sha256") = 64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `releases_version_channel_uq` ON `releases` (`version`,`channel`);--> statement-breakpoint
CREATE UNIQUE INDEX `releases_latest_per_channel_uq` ON `releases` (`channel`) WHERE "releases"."is_latest" = 1;--> statement-breakpoint
CREATE INDEX `releases_published_idx` ON `releases` (`published_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_uq` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'merchant' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uq` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);