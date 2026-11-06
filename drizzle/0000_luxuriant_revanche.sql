CREATE TABLE `enquiries` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`request_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`data_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_id_unique` ON `enquiries` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_request_key_unique` ON `enquiries` (`request_key`);--> statement-breakpoint
CREATE INDEX `enquiries_created` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiries_expiry` ON `enquiries` (`expires_at`);--> statement-breakpoint
CREATE INDEX `enquiries_fingerprint` ON `enquiries` (`payload_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `enquiry_rate_limits` (
	`rate_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`attempts` integer NOT NULL,
	PRIMARY KEY(`rate_key`, `window_start`)
);
