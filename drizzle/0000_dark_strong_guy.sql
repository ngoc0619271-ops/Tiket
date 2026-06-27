CREATE TABLE "auth_nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_public_key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"venue" text NOT NULL,
	"city" text DEFAULT 'Jakarta' NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"ticket_price" integer NOT NULL,
	"total_capacity" integer NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"asset_code" text NOT NULL,
	"asset_issuer_public_key" text NOT NULL,
	"asset_issuer_secret" text,
	"clawback_enabled" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"buyer_public_key" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text,
	"asset_code" text NOT NULL,
	"asset_issuer" text NOT NULL,
	"status" text DEFAULT 'issued' NOT NULL,
	"purchase_tx_hash" text,
	"clawback_tx_hash" text,
	"checkin_at" timestamp with time zone,
	"sep7_uri" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;