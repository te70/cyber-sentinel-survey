import { IsString, IsOptional, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class SubmitSurveyDto {
  @IsString()
  sessionToken: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  deviceHash?: string;

  @IsObject()
  @IsOptional()
  sectionA?: Record<string, any>;

  @IsObject()
  @IsOptional()
  sectionB?: Record<string, any>;

  @IsObject()
  @IsOptional()
  sectionC?: Record<string, any>;

  @IsObject()
  @IsOptional()
  sectionD?: Record<string, any>;
}
