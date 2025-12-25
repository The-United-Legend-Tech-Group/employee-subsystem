import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface PayslipEmailData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  payrollRunId: string;
  netPay: number;
  payPeriod: Date;
  payslipData: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    // Initialize Resend email service
    // Get API key from: https://resend.com/api-keys
    this.resend = new Resend(process.env.RESEND_API_KEY || '');
  }

  /**
   * Send payslip email to a single employee using Resend
   */
  async sendPayslipEmail(emailData: PayslipEmailData): Promise<boolean> {
    try {
      this.logger.log(
        `Sending payslip email to ${emailData.employeeName} (${emailData.employeeEmail})`,
      );

      const htmlTemplate = this.generatePayslipEmailTemplate(emailData);
      const periodDate = new Date(emailData.payPeriod).toLocaleDateString();

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM || 'Payroll <payroll@yourdomain.com>',
        to: [emailData.employeeEmail],
        subject: `Your Payslip - ${periodDate}`,
        html: htmlTemplate,
      });

      if (error) {
        this.logger.error(
          `Failed to send payslip to ${emailData.employeeEmail}: ${error.message}`,
        );
        return false;
      }

      this.logger.log(
        `Payslip email sent successfully to ${emailData.employeeEmail} - Email ID: ${data?.id} - Net Pay: $${emailData.netPay}`,
      );

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send payslip email to ${emailData.employeeEmail}: ${errorMessage}`,
      );
      return false;
    }
  }

  /**
   * Send payslips to multiple employees in batch
   */
  async sendBatchPayslipEmails(
    emailDataList: PayslipEmailData[],
  ): Promise<{ successful: number; failed: number; results: any[] }> {
    const results = await Promise.allSettled(
      emailDataList.map((data) => this.sendPayslipEmail(data)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Batch payslip email sent: ${successful} successful, ${failed} failed`,
    );

    return {
      successful,
      failed,
      results: results.map((result, index) => ({
        employeeEmail: emailDataList[index].employeeEmail,
        status: result.status,
        error: result.status === 'rejected' ? String(result.reason) : null,
      })),
    };
  }

  /**
   * Generate simple HTML email template for payslip
   */
  private generatePayslipEmailTemplate(emailData: PayslipEmailData): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payslip = emailData.payslipData;
    const periodDate = new Date(emailData.payPeriod).toLocaleDateString();

    // Extract payslip values safely
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const grossSalary = payslip.totalGrossSalary || 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const totalDeductions = payslip.totaDeductions || 0;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { background-color: #e8f5e9; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Payslip - ${periodDate}</h2>
            </div>
            <div class="content">
              <p>Dear ${emailData.employeeName},</p>
              <p>Your salary has been processed for the period ending <strong>${periodDate}</strong>.</p>
              
              <table>
                <tr>
                  <td>Payroll Run ID:</td>
                  <td><strong>${emailData.payrollRunId}</strong></td>
                </tr>
                <tr>
                  <td>Employee ID:</td>
                  <td><strong>${emailData.employeeId}</strong></td>
                </tr>
                <tr>
                  <td>Gross Salary:</td>
                  <td>$${Number(grossSalary).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Deductions:</td>
                  <td>-$${Number(totalDeductions).toFixed(2)}</td>
                </tr>
                <tr class="total">
                  <td>Net Pay:</td>
                  <td>$${emailData.netPay.toFixed(2)}</td>
                </tr>
              </table>
              
              <p>If you have any questions, please contact the Payroll department.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Company Name. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
