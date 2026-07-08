import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'payout_attempts', schema: 'public' })
export class PayoutLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'response_id', type: 'uuid' })
  submissionId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId: string;  // M-PESA / AT transaction ID

  @Column({ name: 'originator_conversation_id', nullable: true })
  originatorConversationId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'raw_request', type: 'jsonb', nullable: true })
  rawRequest: Record<string, any>;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse: Record<string, any>;

  @Column({ name: 'result_payload', type: 'jsonb', nullable: true })
  resultPayload: Record<string, any>;
}
