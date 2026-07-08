import { IsString, IsOptional } from 'class-validator';

export class ReviewActionDto {
  @IsString()
  @IsOptional()
  note?: string;
}
