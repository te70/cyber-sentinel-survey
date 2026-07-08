import { Body, Controller, Post, Req, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { SurveyService } from './survey.service';
import { SubmitSurveyDto } from './dto/submit-survey.dto';

@Controller('api')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post('submit')
  @HttpCode(200)
  submit(@Body() dto: SubmitSurveyDto, @Req() req: Request) {
    const ip = req.ip ?? 'unknown';
    const ua = req.headers['user-agent'] ?? '';
    return this.surveyService.submit(dto, ip, ua);
  }
}
