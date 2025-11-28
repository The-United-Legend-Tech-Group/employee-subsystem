import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../repository/notification.repository';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Types } from 'mongoose';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: NotificationRepository;

  const mockNotificationRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: mockNotificationRepository,
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
    it('should create a notification with converted ObjectIds', async () => {
      const createNotificationDto: CreateNotificationDto = {
        recipientId: ['507f1f77bcf86cd799439011'],
        type: 'Info',
        deliveryType: 'UNICAST',
        title: 'Test Notification',
        message: 'This is a test message',
      };

      const expectedPayload = {
        ...createNotificationDto,
        recipientId: createNotificationDto.recipientId.map(
          (id) => new Types.ObjectId(id),
        ),
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
        }),
      );

      // Verify ObjectId conversion
      const calledArg = mockNotificationRepository.create.mock.calls[0][0];
      expect(calledArg.recipientId[0]).toBeInstanceOf(Types.ObjectId);
      expect(calledArg.recipientId[0].toString()).toBe(
        createNotificationDto.recipientId[0],
      );
    });
  });
});
