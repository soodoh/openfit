PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`default_repetition_unit_id` text,
	`default_weight_unit_id` text,
	`theme` text DEFAULT 'system' NOT NULL,
	`default_gym_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`default_repetition_unit_id`) REFERENCES `repetition_units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_weight_unit_id`) REFERENCES `weight_units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`default_gym_id`) REFERENCES `gyms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles` (
	`id`,
	`user_id`,
	`role`,
	`default_repetition_unit_id`,
	`default_weight_unit_id`,
	`theme`,
	`default_gym_id`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`user_id`,
	`role`,
	`default_repetition_unit_id`,
	`default_weight_unit_id`,
	`theme`,
	CASE
		WHEN `default_gym_id` IS NULL THEN NULL
		WHEN EXISTS (
			SELECT 1
			FROM `gyms`
			WHERE `gyms`.`id` = `user_profiles`.`default_gym_id`
				AND `gyms`.`user_id` = `user_profiles`.`user_id`
		) THEN `default_gym_id`
		ELSE NULL
	END,
	`created_at`,
	`updated_at`
FROM `user_profiles`;
--> statement-breakpoint
DROP TABLE `user_profiles`;
--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
