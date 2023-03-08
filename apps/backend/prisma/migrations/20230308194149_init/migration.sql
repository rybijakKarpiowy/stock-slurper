-- CreateTable
CREATE TABLE "Items" (
    "id" SMALLSERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "code" VARCHAR NOT NULL,
    "link" VARCHAR NOT NULL,
    "company" VARCHAR NOT NULL,

    CONSTRAINT "Items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "created_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" SMALLINT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" REAL NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("created_at","itemId")
);

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
