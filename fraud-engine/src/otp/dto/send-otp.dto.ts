import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+2547[0-9]{8}$/, { message: 'Phone must be a Kenyan mobile number (+2547XXXXXXXX)' })
  phone: string;
}
