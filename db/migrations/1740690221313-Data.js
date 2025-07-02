module.exports = class Data1740690221313 {
    name = 'Data1740690221313'

    async up(db) {
        await db.query(`ALTER TABLE "transfer" ADD "contract_address" text`)
        await db.query(`ALTER TABLE "transfer" ADD "token_id" text`)
    }

    async down(db) {
        await db.query(`ALTER TABLE "transfer" DROP COLUMN "contract_address"`)
        await db.query(`ALTER TABLE "transfer" DROP COLUMN "token_id"`)
    }
}
