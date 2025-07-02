module.exports = class Data1740703737752 {
    name = 'Data1740703737752'

    async up(db) {
        await db.query(`CREATE TABLE "pump_kek_buy" ("id" character varying NOT NULL, "buyer" text NOT NULL, "room_amount" numeric NOT NULL, "token_amount" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "project_id" character varying, CONSTRAINT "PK_4163fa3afbb7ef82fc2d91555a5" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_9d9fdbd61c783508b14f3f1982" ON "pump_kek_buy" ("project_id") `)
        await db.query(`CREATE TABLE "pump_kek_sell" ("id" character varying NOT NULL, "seller" text NOT NULL, "token_amount" numeric NOT NULL, "room_amount" numeric NOT NULL, "net_amount" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "project_id" character varying, CONSTRAINT "PK_b79ad5a837e5ac83e8aa8f9ca16" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_14f8e8414c36af4d39cea5ee6e" ON "pump_kek_sell" ("project_id") `)
        await db.query(`CREATE TABLE "pump_kek_graduation" ("id" character varying NOT NULL, "liquidity" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "project_id" character varying, CONSTRAINT "PK_3a78323bdaca77cff8c244ddeba" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_2cc7fc0201ebc48e9aa3980cd3" ON "pump_kek_graduation" ("project_id") `)
        await db.query(`CREATE TABLE "project_transfer" ("id" character varying NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "value" numeric NOT NULL, "tx_hash" text NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "project_id" character varying, CONSTRAINT "PK_9f81826e6a6827ca85f8ff645ee" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_e198d3ed9559f98bc511c310c3" ON "project_transfer" ("project_id") `)
        await db.query(`CREATE TABLE "pump_kek_project" ("id" character varying NOT NULL, "creator" text NOT NULL, "name" text NOT NULL, "symbol" text NOT NULL, "total_deposited" numeric NOT NULL, "tokens_sold" numeric NOT NULL, "is_graduated" boolean NOT NULL, "creation_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, CONSTRAINT "PK_1a315e8e4f6951ed8c2993aa1a2" PRIMARY KEY ("id"))`)
        await db.query(`ALTER TABLE "pump_kek_buy" ADD CONSTRAINT "FK_9d9fdbd61c783508b14f3f19824" FOREIGN KEY ("project_id") REFERENCES "pump_kek_project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "pump_kek_sell" ADD CONSTRAINT "FK_14f8e8414c36af4d39cea5ee6ef" FOREIGN KEY ("project_id") REFERENCES "pump_kek_project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "pump_kek_graduation" ADD CONSTRAINT "FK_2cc7fc0201ebc48e9aa3980cd3f" FOREIGN KEY ("project_id") REFERENCES "pump_kek_project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "project_transfer" ADD CONSTRAINT "FK_e198d3ed9559f98bc511c310c31" FOREIGN KEY ("project_id") REFERENCES "pump_kek_project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "pump_kek_buy"`)
        await db.query(`DROP INDEX "public"."IDX_9d9fdbd61c783508b14f3f1982"`)
        await db.query(`DROP TABLE "pump_kek_sell"`)
        await db.query(`DROP INDEX "public"."IDX_14f8e8414c36af4d39cea5ee6e"`)
        await db.query(`DROP TABLE "pump_kek_graduation"`)
        await db.query(`DROP INDEX "public"."IDX_2cc7fc0201ebc48e9aa3980cd3"`)
        await db.query(`DROP TABLE "project_transfer"`)
        await db.query(`DROP INDEX "public"."IDX_e198d3ed9559f98bc511c310c3"`)
        await db.query(`DROP TABLE "pump_kek_project"`)
        await db.query(`ALTER TABLE "pump_kek_buy" DROP CONSTRAINT "FK_9d9fdbd61c783508b14f3f19824"`)
        await db.query(`ALTER TABLE "pump_kek_sell" DROP CONSTRAINT "FK_14f8e8414c36af4d39cea5ee6ef"`)
        await db.query(`ALTER TABLE "pump_kek_graduation" DROP CONSTRAINT "FK_2cc7fc0201ebc48e9aa3980cd3f"`)
        await db.query(`ALTER TABLE "project_transfer" DROP CONSTRAINT "FK_e198d3ed9559f98bc511c310c31"`)
    }
}
