import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { TutorsService } from './tutors.service';
import { TutorsController } from './tutors.controller';

@Module({
  imports: [SearchModule],
  controllers: [TutorsController],
  providers: [TutorsService],
})
export class TutorsModule {}
