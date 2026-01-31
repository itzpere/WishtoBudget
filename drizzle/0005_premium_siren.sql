ALTER TABLE `history` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `items` ADD `price_mode` text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `min_price` real;--> statement-breakpoint
ALTER TABLE `items` ADD `max_price` real;--> statement-breakpoint
ALTER TABLE `items` ADD `additional_costs` text;--> statement-breakpoint
ALTER TABLE `items` ADD `purchased_amount` real;