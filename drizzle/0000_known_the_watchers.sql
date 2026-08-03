CREATE TABLE "guestbook" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"password_hash" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "letters_token_author_unique" UNIQUE("token","author")
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"token" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone_last4" text NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"first_viewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_token_recipients_token_fk" FOREIGN KEY ("token") REFERENCES "public"."recipients"("token") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "letters_token_idx" ON "letters" USING btree ("token");