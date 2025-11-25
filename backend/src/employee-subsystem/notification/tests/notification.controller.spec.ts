import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ApiKeyGuard } from '../../guards/api-key.guard';

describe('NotificationController', () => {
    let controller: NotificationController;
    let service: NotificationService;

    const mockNotificationService = {
        create: jest.fn(),
    };

    const mockApiKeyGuard = {
        canActivate: jest.fn(() => true),
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
                recipientId: createNotificationDto.recipientId.map(id => ({ toString: () => id })), // Mocking ObjectId behavior slightly if needed, or just return plain obj
                createdAt: new Date(),
            };

            mockNotificationService.create.mockResolvedValue(expectedResult);

            const result = await controller.create(createNotificationDto);

            expect(result).toEqual(expectedResult);
            expect(service.create).toHaveBeenCalledWith(createNotificationDto);
        });
    });
});
