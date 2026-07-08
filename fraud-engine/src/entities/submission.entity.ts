import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'responses', schema: 'public' })
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Identity
  @Column({ name: 'phone_hash' })
  phoneHash: string;

  @Column({ name: 'phone_encrypted', nullable: true })
  phoneEncrypted: string;

  @Column({ name: 'phone_e164', nullable: true })
  phoneE164: string;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'business_name', nullable: true })
  businessName: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl: string;

  // Device / session
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'device_hash', nullable: true })
  deviceHash: string;

  @Column({ name: 'session_id', nullable: true, type: 'uuid' })
  sessionId: string;

  @Column({ name: 'survey_started_at', nullable: true, type: 'timestamptz' })
  surveyStartedAt: Date;

  // Survey state
  @Column({ name: 'consented_at', nullable: true, type: 'timestamptz' })
  consentedAt: Date;

  @Column({ name: 'screened_in', default: false })
  screenedIn: boolean;

  @Column({ default: false })
  completed: boolean;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamptz' })
  completedAt: Date;

  // Survey answers
  @Column({ type: 'jsonb', nullable: true })
  screening: Record<string, any>;

  @Column({ name: 'section_a', type: 'jsonb', nullable: true })
  sectionA: Record<string, any>;

  @Column({ name: 'section_b', type: 'jsonb', nullable: true })
  sectionB: Record<string, any>;

  @Column({ name: 'section_c', type: 'jsonb', nullable: true })
  sectionC: Record<string, any>;

  @Column({ name: 'section_d', type: 'jsonb', nullable: true })
  sectionD: Record<string, any>;

  // Analysis scores
  @Column({ name: 'maturity_score', nullable: true, type: 'float' })
  maturityScore: number;

  @Column({ name: 'barrier_score', nullable: true, type: 'float' })
  barrierScore: number;

  @Column({ name: 'usability_score', nullable: true, type: 'float' })
  usabilityScore: number;

  @Column({ name: 'domain_scores', type: 'jsonb', nullable: true })
  domainScores: Record<string, any>;

  // Fraud engine
  @Column({ name: 'fraud_score', nullable: true, type: 'int' })
  fraudScore: number;

  @Column({ name: 'fraud_signals', type: 'jsonb', nullable: true })
  fraudSignals: Record<string, any>;

  @Column({ name: 'fraud_status', default: 'pending' })
  fraudStatus: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ name: 'review_note', nullable: true, type: 'text' })
  reviewNote: string;

  @Column({ name: 'reviewed_at', nullable: true, type: 'timestamptz' })
  reviewedAt: Date;

  // Payout
  @Column({ name: 'mpesa_payout_status', default: 'none' })
  mpesaPayoutStatus: string;

  @Column({ name: 'mpesa_transaction_id', nullable: true })
  mpesaTransactionId: string;

  @Column({ name: 'mpesa_last_error', nullable: true })
  mpesaLastError: string;

  @Column({ name: 'payout_queued_at', nullable: true, type: 'timestamptz' })
  payoutQueuedAt: Date;

  @Column({ name: 'payout_released_at', nullable: true, type: 'timestamptz' })
  payoutReleasedAt: Date;

  @Column({ name: 'payout_mpesa_ref', nullable: true })
  payoutMpesaRef: string;

  @Column({ name: 'payout_amount', default: 100 })
  payoutAmount: number;
}
