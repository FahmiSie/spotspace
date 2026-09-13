-- CreateTable
CREATE TABLE "maker" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "appKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maker_username_key" ON "maker"("username");

-- CreateIndex
CREATE UNIQUE INDEX "maker_email_key" ON "maker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "maker_appKey_key" ON "maker"("appKey");
