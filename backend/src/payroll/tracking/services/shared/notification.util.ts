import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../../../employee-subsystem/notification/notification.service';
import { CreateNotificationDto } from '../../../../employee-subsystem/notification/dto/create-notification.dto';
import { SystemRole } from '../../../../employee-subsystem/employee/enums/employee-profile.enums';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeSystemRoleDocument } from '../../../../employee-subsystem/employee/models/employee-system-role.schema';
import { EmployeeSystemRole } from '../../../../employee-subsystem/employee/models/employee-system-role.schema';

@Injectable()
export class NotificationUtil {
  constructor(
    private notificationService: NotificationService,
    @InjectModel(EmployeeSystemRole.name)
    private employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
  ) {}

  /**
   * Notify employee about status change
   */
  async notifyEmployeeAboutStatus(
    employeeId: string | Types.ObjectId,
    _entityType: 'dispute' | 'claim',
    _entityId: string,
    entityDisplayId: string,
    status: 'approved' | 'rejected' | 'under_review',
    relatedEntityId: string,
  ): Promise<void> {
    const messages = {
      dispute: {
        approved: `Your dispute ${entityDisplayId} has been approved and confirmed.`,
        rejected: `Your dispute ${entityDisplayId} has been rejected.`,
        under_review: `Your dispute ${entityDisplayId} is now under review by a Payroll Specialist.`,
      },
      claim: {
        approved: `Your expense claim ${entityDisplayId} has been approved and confirmed.`,
        rejected: `Your expense claim ${entityDisplayId} has been rejected.`,
        under_review: `Your expense claim ${entityDisplayId} is now under review by a Payroll Specialist.`,
      },
    };

    const notificationDto: CreateNotificationDto = {
      recipientId: [employeeId.toString()],
      type: status === 'rejected' ? 'Warning' : 'Info',
      deliveryType: 'UNICAST',
      title: `${_entityType === 'dispute' ? 'Dispute' : 'Expense Claim'} ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Under Review'}`,
      message: messages[_entityType][status],
      relatedEntityId,
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  /**
   * Notify payroll manager about entity awaiting approval
   */
  async notifyPayrollManager(
    _entityType: 'dispute' | 'claim',
    _entityId: string,
    entityDisplayId: string,
    relatedEntityId: string,
  ): Promise<void> {
    const payrollManagerRoles = await this.employeeSystemRoleModel.find({
      roles: { $in: [SystemRole.PAYROLL_MANAGER] },
      isActive: true,
    });

    if (payrollManagerRoles.length === 0) {
      return;
    }

    const payrollManagerIds = payrollManagerRoles.map((role) =>
      role.employeeProfileId.toString(),
    );

      const messages = {
      dispute: `Dispute ${entityDisplayId} has been approved by the Payroll Specialist and is now awaiting your confirmation.`,
      claim: `Expense claim ${entityDisplayId} has been approved by the Payroll Specialist and is now awaiting your confirmation.`,
    };

    const notificationDto: CreateNotificationDto = {
      recipientId: payrollManagerIds,
      type: 'Info',
      deliveryType: 'MULTICAST',
      title: `${_entityType === 'dispute' ? 'Dispute' : 'Expense Claim'} Pending Manager Approval`,
      message: messages[_entityType],
      relatedEntityId,
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }

  /**
   * Notify finance staff about approved entity requiring refund
   */
  async notifyFinanceStaff(
    _entityType: 'dispute' | 'claim',
    _entityId: string,
    entityDisplayId: string,
    amount: number,
    relatedEntityId: string,
  ): Promise<void> {
    const financeStaffRoles = await this.employeeSystemRoleModel.find({
      roles: { $in: [SystemRole.FINANCE_STAFF] },
      isActive: true,
    });

    if (financeStaffRoles.length === 0) {
      return;
    }

    const financeStaffIds = financeStaffRoles.map((role) =>
      role.employeeProfileId.toString(),
    );

      const messages = {
      dispute: `Dispute ${entityDisplayId} has been approved and confirmed. Approved refund amount: ${amount}. Please process the refund.`,
      claim: `Expense claim ${entityDisplayId} has been approved and confirmed. Approved amount: ${amount}. Please process the refund.`,
    };

    const notificationDto: CreateNotificationDto = {
      recipientId: financeStaffIds,
      type: 'Info',
      deliveryType: 'MULTICAST',
      title: `${_entityType === 'dispute' ? 'Dispute' : 'Expense Claim'} Approved - Refund Required`,
      message: messages[_entityType],
      relatedEntityId,
      relatedModule: 'Payroll',
      isRead: false,
    };

    await this.notificationService.create(notificationDto);
  }
}

