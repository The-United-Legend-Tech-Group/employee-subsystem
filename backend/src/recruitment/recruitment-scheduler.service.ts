import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecruitmentService } from './recruitment.service';

@Injectable()
export class RecruitmentSchedulerService {
    private readonly logger = new Logger(RecruitmentSchedulerService.name);

    constructor(private readonly recruitmentService: RecruitmentService) { }

    /**
     * Automatically sends onboarding reminders every day at midnight.
     * Logic:
     * - Daily countdown alerts for employees (1-7 days overdue)
     * - System Admin escalation (8+ days overdue)
     * - Upcoming deadline reminders (within threshold)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
        name: 'onboarding-daily-reminders',
        timeZone: 'Africa/Cairo', // Aligning with other schedulers in the system
    })
    async handleDailyReminders() {
        this.logger.log('🚀 Starting scheduled onboarding reminders check...');

        try {
            const result = await this.recruitmentService.sendAllOnboardingReminders(3); // 3 days threshold for upcoming tasks
            this.logger.log(`✅ Scheduled onboarding reminders completed. Total onboardings processed: ${result.totalProcessed}`);
        } catch (error) {
            this.logger.error('❌ Failed to run scheduled onboarding reminders:', error.stack);
        }
    }

    /**
     * Manual trigger for testing or ad-hoc runs
     */
    async triggerManualRun() {
        this.logger.log('🔄 Manual trigger for onboarding reminders started...');
        return this.handleDailyReminders();
    }
}
