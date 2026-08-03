-- CreateTable
CREATE TABLE "VisitCounter" (
    "month" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitCounter_pkey" PRIMARY KEY ("month")
);
