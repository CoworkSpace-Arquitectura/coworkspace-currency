-- CreateTable
CREATE TABLE "countries" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "rate_snapshots" (
    "id" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "rates" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_snapshots_base_fetched_at_idx" ON "rate_snapshots"("base", "fetched_at");
