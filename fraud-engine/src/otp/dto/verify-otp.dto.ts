import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+2547[0-9]{8}$/)
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
