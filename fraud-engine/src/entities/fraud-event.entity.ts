import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'fraud_events', schema: 'public' })
export class FraudEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'response_id', type: 'uuid' })
  submissionId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'int' })
  layer: number;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb', default: {} })
  detail: Record<string, any>;

  @Column({ name: 'score_impact', type: 'int', default: 0 })
  scoreImpact: number;
}
