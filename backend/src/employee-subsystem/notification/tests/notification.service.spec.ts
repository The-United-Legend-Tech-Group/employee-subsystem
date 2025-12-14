import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../repository/notification.repository';
import { EmployeeProfileRepository } from '../../employee/repository/employee-profile.repository';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Types } from 'mongoose';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: NotificationRepository;

  const mockNotificationRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findLatest: jest.fn(),
    updateById: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockEmployeeProfileRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: mockNotificationRepository,
        },
        {
          provide: EmployeeProfileRepository,
          useValue: mockEmployeeProfileRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification with converted ObjectIds and empty readBy', async () => {
      const createNotificationDto: CreateNotificationDto = {
        recipientId: ['507f1f77bcf86cd799439011'],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Test Notification',
        message: 'This is a test message',
      };

      const expectedPayload = {
        ...createNotificationDto,
        recipientId: (createNotificationDto.recipientId || []).map(
          (id) => new Types.ObjectId(id),
        ),
        readBy: [],
      };

      const expectedResult = {
        _id: 'someId',
        ...expectedPayload,
      };

      mockNotificationRepository.create.mockResolvedValue(expectedResult);

      const result = await service.create(createNotificationDto);

      expect(result).toEqual(expectedResult);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createNotificationDto,
          recipientId: expect.arrayContaining([expect.any(Types.ObjectId)]),
          readBy: [],
        }),
      );
    });
  });

  describe('findByRecipientId', () => {
    it('should return notifications with calculated isRead property', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const notifications = [
        {
          _id: '1',
          title: 'Not Read',
          readBy: [],
          toObject: function () { return this; }
        },
        {
          _id: '2',
          title: 'Read',
          readBy: [new Types.ObjectId(userId)],
          toObject: function () { return this; }
        }
      ];


      mockNotificationRepository.findLatest.mockResolvedValue(notifications);

      const result = await service.findByRecipientId(userId);

      expect(result).toHaveLength(2);
      expect(result[0].isRead).toBe(false);
      expect(result[1].isRead).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should update notification adding user to readBy', async () => {
      const notificationId = 'notifId';
      const userId = '507f1f77bcf86cd799439011';

      await service.markAsRead(notificationId, userId);

      expect(repository.updateById).toHaveBeenCalledWith(
        notificationId,
        { $addToSet: { readBy: new Types.ObjectId(userId) } }
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should update many notifications adding user to readBy', async () => {
      const userId = '507f1f77bcf86cd799439011';

      await service.markAllAsRead(userId);

      expect(repository.updateMany).toHaveBeenCalledWith(
        { $or: [{ recipientId: userId }, { deliveryType: 'BROADCAST' }] },
        { $addToSet: { readBy: new Types.ObjectId(userId) } }
      );
    });
  });
});
