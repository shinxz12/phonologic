import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LearningController } from './learning.controller';
import { LearningAdminController } from './learning-admin.controller';
import { LearningService } from './learning.service';
import { LearningAdminService } from './learning-admin.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LearningController, LearningAdminController],
  providers: [LearningService, LearningAdminService],
  exports: [LearningService, LearningAdminService],
})
export class LearningModule {}
