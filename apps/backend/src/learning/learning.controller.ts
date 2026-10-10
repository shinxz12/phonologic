import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { Public } from '../common/public.decorator';
import { LearningService, type AudioUploadFile } from './learning.service';
import {
  ContentReportDto,
  CreateSessionDto,
  PreferencesDto,
  ReadingTargetDto,
  SpeakingStatusDto,
  SubmitAnswerDto,
} from './learning.dto';
import type {
  LearningDashboard,
  Preferences,
  ReadingView,
  RecordingView,
  SessionView,
  SourceRule,
} from '@phonologic/shared-types';

@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthUser): Promise<LearningDashboard> {
    return this.learningService.getDashboard(user.id);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: PreferencesDto,
  ): Promise<Preferences> {
    return this.learningService.updatePreferences(user.id, dto);
  }

  @Get('rules')
  getRules(@Query('search') search?: string): Promise<SourceRule[]> {
    return this.learningService.getRules(search);
  }

  @Post('sessions')
  createSession(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionView> {
    return this.learningService.createSession(user.id, dto.lessonId);
  }

  @Post('review')
  createReviewSession(@CurrentUser() user: AuthUser): Promise<SessionView> {
    return this.learningService.createReviewSession(user.id);
  }

  @Get('sessions/:id')
  getSession(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SessionView> {
    return this.learningService.getSession(user.id, id);
  }

  @Post('sessions/:id/answers')
  submitAnswer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
  ): Promise<SessionView> {
    return this.learningService.submitAnswer(
      user.id,
      id,
      dto.questionId,
      dto.selectedIds,
    );
  }

  @Post('sessions/:id/speaking')
  updateSpeakingStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SpeakingStatusDto,
  ): Promise<SessionView> {
    return this.learningService.updateSpeakingStatus(user.id, id, dto.status);
  }

  @Get('readings/:id')
  getReading(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ReadingView> {
    return this.learningService.getReading(user.id, id);
  }

  @Post('readings/:id/targets')
  markReadingTarget(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReadingTargetDto,
  ): Promise<ReadingView> {
    return this.learningService.markReadingTarget(user.id, id, dto.targetId);
  }

  @Post('readings/:id/complete')
  completeReading(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<ReadingView> {
    return this.learningService.completeReading(user.id, id);
  }

  @Get('recordings')
  listRecordings(@CurrentUser() user: AuthUser): Promise<RecordingView[]> {
    return this.learningService.listRecordings(user.id);
  }

  @Post('recordings')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  createRecording(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: AudioUploadFile,
    @Body('word') word: string,
    @Body('sessionId') sessionId?: string,
    @Body('readingId') readingId?: string,
  ): Promise<RecordingView> {
    return this.learningService.createRecording(
      user.id,
      file,
      word,
      sessionId,
      readingId,
    );
  }

  @Get('recordings/:id/audio')
  async streamRecordingAudio(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, mimeType } = await this.learningService.getRecordingAudio(
      user.id,
      id,
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.send(buffer);
  }

  @Delete('recordings/:id')
  deleteRecording(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.learningService.deleteRecording(user.id, id);
  }
  @Public()
  @Get('tts')
  async streamTts(
    @Query('text') text: string,
    @Query('accent') accent: string = 'US',
    @Res() res: Response,
  ): Promise<void> {
    if (!text || !text.trim()) {
      res.status(400).send('Missing text parameter');
      return;
    }
    const clean = text.trim();
    const tl = accent === 'UK' ? 'en-GB' : 'en-US';
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(clean)}`;

    try {
      const upstream = await fetch(googleUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!upstream.ok) {
        res.status(upstream.status).send('TTS upstream error');
        return;
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch {
      res.status(502).send('TTS fetch failed');
    }
  }

  @Post('reports')
  createReport(
    @CurrentUser() user: AuthUser,
    @Body() dto: ContentReportDto,
  ): Promise<{ success: boolean }> {
    return this.learningService.createReport(user.id, dto);
  }
}
