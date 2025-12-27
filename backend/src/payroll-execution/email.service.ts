import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { paySlip } from './models/payslip.schema';

export interface PayslipEmailData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  payrollRunId: string;
  netPay: number;
  payPeriod: Date;
  payslipData: paySlip;
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
        from: 'Payroll <payroll@resend.dev>',
        to: ['wato.malsona@gmail.com'],
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
   * Send payslips to multiple employees in batch with rate limiting
   * Resend allows 2 requests per second, so we send emails with a 600ms delay
   */
  async sendBatchPayslipEmails(emailDataList: PayslipEmailData[]) {
    this.logger.log(
      `Starting batch email send for ${emailDataList.length} payslips (rate limited to 2/sec)`,
    );

    // Send emails sequentially with delay to respect rate limit (2 per second)
    for (let i = 0; i < emailDataList.length; i++) {
      const emailData = emailDataList[i];

      await this.sendPayslipEmail(emailData);

      // Add delay between emails (600ms = ~1.6 emails/sec to be safe)
      await this.delay(600);
    }
  }

  /**
   * Helper method to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate detailed HTML email template for payslip
   */
  private generatePayslipEmailTemplate(emailData: PayslipEmailData): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payslip = emailData.payslipData;
    const periodDate = new Date(emailData.payPeriod).toLocaleDateString();

    // Extract payslip values safely
    const grossSalary = payslip.totalGrossSalary || 0;
    const totalDeductions = payslip.totaDeductions || 0;
    const earnings = payslip.earningsDetails || {};
    const deductions = payslip.deductionsDetails || {};

    // Helper to format currency
    const fmt = (amount: number) => `$${Number(amount || 0).toFixed(2)}`;

    // Generate earnings breakdown HTML
    let earningsHtml = `
      <tr>
        <td style="padding-left: 20px;">Base Salary</td>
        <td style="text-align: right;">${fmt(earnings.baseSalary)}</td>
      </tr>`;

    // Allowances
    if (earnings.allowances.length > 0) {
      earningsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Allowances</td></tr>`;
      earnings.allowances.forEach((allowance) => {
        earningsHtml += `
          <tr>
            <td style="padding-left: 30px;">${allowance.name || 'Allowance'}</td>
            <td style="text-align: right; color: #4CAF50;">+${fmt(allowance.amount)}</td>
          </tr>`;
      });
    }

    // Bonuses
    if (earnings.bonuses && earnings.bonuses.length > 0) {
      earningsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Bonuses</td></tr>`;
      earnings.bonuses.forEach((bonus) => {
        earningsHtml += `
          <tr>
            <td style="padding-left: 30px;">${bonus.positionName || 'Bonus'}</td>
            <td style="text-align: right; color: #4CAF50;">+${fmt(bonus.amount)}</td>
          </tr>`;
      });
    }

    // Benefits
    if (earnings.benefits && earnings.benefits.length > 0) {
      earningsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Benefits</td></tr>`;
      earnings.benefits.forEach((benefit) => {
        earningsHtml += `
          <tr>
            <td style="padding-left: 30px;">${benefit.name || 'Benefit'}</td>
            <td style="text-align: right; color: #4CAF50;">+${fmt(benefit.amount)}</td>
          </tr>`;
      });
    }

    // Refunds
    if (earnings.refunds && earnings.refunds.length > 0) {
      earningsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Refunds</td></tr>`;
      earnings.refunds.forEach((refund) => {
        earningsHtml += `
          <tr>
            <td style="padding-left: 30px;">${refund.description}</td>
            <td style="text-align: right; color: #4CAF50;">+${fmt(refund.amount)}</td>
          </tr>`;
      });
    }

    // Generate deductions breakdown HTML
    let deductionsHtml = '';

    // Taxes
    if (deductions.taxes?.length > 0) {
      deductionsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Taxes</td></tr>`;
      deductions.taxes.forEach((tax) => {
        const taxAmount = (tax.rate * earnings.baseSalary) / 100;
        deductionsHtml += `
          <tr>
            <td style="padding-left: 30px;">${tax.name || 'Tax'} (${tax.rate}%)</td>
            <td style="text-align: right; color: #d32f2f;">-${fmt(taxAmount)}</td>
          </tr>`;
      });
    }

    // Insurance
    if (deductions.insurances && deductions.insurances.length > 0) {
      deductionsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Insurance</td></tr>`;
      deductions.insurances.forEach((insurance) => {
        const insuranceAmount =
          (insurance.employeeRate * earnings.baseSalary) / 100;
        deductionsHtml += `
          <tr>
            <td style="padding-left: 30px;">${insurance.name || 'Insurance'} (${insurance.employeeRate}%)</td>
            <td style="text-align: right; color: #d32f2f;">-${fmt(insuranceAmount)}</td>
          </tr>`;
      });
    }

    // Penalties
    if (
      deductions.penalties &&
      deductions.penalties.penalties &&
      deductions.penalties.penalties?.length > 0
    ) {
      deductionsHtml += `<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; color: #666;">Penalties</td></tr>`;
      deductions.penalties.penalties.forEach((penalty) => {
        deductionsHtml += `
          <tr>
            <td style="padding-left: 30px;">${penalty.reason || 'Penalty'}</td>
            <td style="text-align: right; color: #d32f2f;">-${fmt(penalty.amount)}</td>
          </tr>`;
      });
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .info-box { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .section-header { background-color: #f5f5f5; font-weight: bold; padding: 12px 10px !important; }
            .total-row { background-color: #e8f5e9; font-weight: bold; font-size: 16px; border-top: 2px solid #4CAF50; }
            .grand-total { background-color: #4CAF50; color: white; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Payslip</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${periodDate}</p>
            </div>
            <div class="content">
              <p>Dear <strong>${emailData.employeeName}</strong>,</p>
              <p>Your salary has been processed for the period ending <strong>${periodDate}</strong>.</p>
              
              <h3 style="color: #4CAF50; margin-top: 30px;">Earnings Breakdown</h3>
              <table>
                ${earningsHtml}
                <tr class="total-row">
                  <td><strong>Total Earnings</strong></td>
                  <td style="text-align: right;"><strong>${fmt(grossSalary)}</strong></td>
                </tr>
              </table>

              <h3 style="color: #d32f2f; margin-top: 30px;">Deductions Breakdown</h3>
              <table>
                ${deductionsHtml || '<tr><td colspan="2" style="text-align: center; color: #666;">No deductions</td></tr>'}
                <tr class="total-row">
                  <td><strong>Total Deductions</strong></td>
                  <td style="text-align: right;"><strong>-${fmt(totalDeductions)}</strong></td>
                </tr>
              </table>

              <table style="margin-top: 30px;">
                <tr class="grand-total">
                  <td><strong>NET PAY</strong></td>
                  <td style="text-align: right;"><strong>${fmt(emailData.netPay)}</strong></td>
                </tr>
              </table>
              
              <p style="margin-top: 30px;">If you have any questions about your payslip, please contact the Payroll department.</p>
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
