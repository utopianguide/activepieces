import { ChatConversation, ChatFeedback, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type ChatFeedbackWithRelations = ChatFeedback & {
    project: Project
    user: unknown
    conversation: ChatConversation
}

export const ChatFeedbackEntity = new EntitySchema<ChatFeedbackWithRelations>({
    name: 'chat_feedback',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        conversationId: {
            ...ApIdSchema,
            nullable: false,
        },
        traceId: {
            type: String,
            nullable: true,
        },
        value: {
            type: 'smallint',
            nullable: false,
        },
        comment: {
            type: 'text',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_feedback_conversation_created_id',
            columns: ['conversationId', 'created', 'id'],
        },
        {
            name: 'idx_chat_feedback_project_created_id',
            columns: ['projectId', 'created', 'id'],
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_chat_feedback_project_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_chat_feedback_user_id',
            },
        },
        conversation: {
            type: 'many-to-one',
            target: 'chat_conversation',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'conversationId',
                foreignKeyConstraintName: 'fk_chat_feedback_conversation_id',
            },
        },
    },
})
