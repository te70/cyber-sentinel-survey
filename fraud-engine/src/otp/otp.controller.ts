import { Body, Controller, Post, Req, BadRequestException, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('api/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @HttpCode(200)
  async send(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ip = req.ip ?? 'unknown';
    const result = await this.otpService.sendOtp(dto.phone, ip);
    if (!result.sent) throw new BadRequestException(result.error);
    return result;
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() dto: VerifyOtpDto) {
    const result = await this.otpService.verifyOtp(dto.phone, dto.code);
    if (!result.verified) throw new BadRequestException(result.error);
    return result;
  }
}
