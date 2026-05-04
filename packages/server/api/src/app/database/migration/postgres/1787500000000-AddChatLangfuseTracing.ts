import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddChatLangfuseTracing1786000000000 implements Migration {
    name = 'AddChatLangfuseTracing1786000000000'
    breaking = false
    release = '0.84.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            ADD COLUMN IF NOT EXISTS "lastAssistantTraceId" character varying
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_feedback" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "userId" character varying(21) NOT NULL,
                "conversationId" character varying(21) NOT NULL,
                "traceId" character varying,
                "value" smallint NOT NULL,
                "comment" text,
                CONSTRAINT "pk_chat_feedback" PRIMARY KEY ("id"),
                CONSTRAINT "fk_chat_feedback_project_id" FOREIGN KEY ("projectId")
                    REFERENCES "project" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_chat_feedback_user_id" FOREIGN KEY ("userId")
                    REFERENCES "user" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_chat_feedback_conversation_id" FOREIGN KEY ("conversationId")
                    REFERENCES "chat_conversation" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_chat_feedback_conversation_created_id"
            ON "chat_feedback" ("conversationId", "created" DESC, "id" DESC)
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_chat_feedback_project_created_id"
            ON "chat_feedback" ("projectId", "created" DESC, "id" DESC)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "chat_feedback"')
        await queryRunner.query(`
            ALTER TABLE "chat_conversation"
            DROP COLUMN IF EXISTS "lastAssistantTraceId"
        `)
    }
}
