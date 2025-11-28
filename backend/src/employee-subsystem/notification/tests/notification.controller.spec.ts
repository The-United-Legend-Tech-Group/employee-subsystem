import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ApiKeyGuard } from '../../guards/api-key.guard';
import { AuthGuard } from '../../guards/authentication.guard';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    create: jest.fn(),
    findByRecipientId: jest.fn(),
  };

  const mockApiKeyGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAuthGuard = {
    canActivate: jest.fn((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = { sub: 'user123' }; // Mock user
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue(mockApiKeyGuard)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createNotificationDto: CreateNotificationDto = {
        recipientId: ['507f1f77bcf86cd799439011'],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Test Notification',
        message: 'This is a test message',
      };

      const expectedResult = {
        _id: 'someId',
        ...createNotificationDto,
        recipientId: createNotificationDto.recipientId.map((id) => ({
          toString: () => id,
        })),
        createdAt: new Date(),
      };

      mockNotificationService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createNotificationDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createNotificationDto);
    });
  });

  describe('findMyNotifications', () => {
    it('should return notifications for the authenticated user', async () => {
      const req = { user: { sub: 'user123' } };
      const expectedResult = [{ title: 'Test', message: 'Message' }];
      mockNotificationService.findByRecipientId.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findMyNotifications(req);

      expect(result).toEqual(expectedResult);
      expect(service.findByRecipientId).toHaveBeenCalledWith('user123');
    });
  });
});
