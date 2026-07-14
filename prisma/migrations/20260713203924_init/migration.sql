-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "phone_encrypted" TEXT,
    "screened_in" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "consented_at" TIMESTAMP(3),
    "business_name" TEXT,
    "website_url" TEXT,
    "screening" JSONB,
    "section_a" JSONB,
    "section_b" JSONB,
    "section_c" JSONB,
    "section_d" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "mpesa_payout_status" TEXT NOT NULL DEFAULT 'pending',
    "mpesa_transaction_id" TEXT,
    "mpesa_last_error" TEXT,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_attempts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "conversation_id" TEXT,
    "originator_conversation_id" TEXT,
    "raw_request" JSONB,
    "raw_response" JSONB,
    "result_payload" JSONB,

    CONSTRAINT "payout_attempts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payout_attempts" ADD CONSTRAINT "payout_attempts_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
