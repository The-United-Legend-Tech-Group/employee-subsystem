import { OrganizationStructureController } from '../organization-structure.controller';
import { StructureChangeRequest } from '../models/structure-change-request.schema';
import {
	StructureRequestStatus,
	StructureRequestType,
} from '../enums/organization-structure.enums';

describe('OrganizationStructureController (unit)', () => {
	let controller: OrganizationStructureController;

	const mockService = {
		listPendingChangeRequests: jest.fn(),
		getChangeRequestById: jest.fn(),
		approveChangeRequest: jest.fn(),
		rejectChangeRequest: jest.fn(),
		submitChangeRequest: jest.fn(),
		getOrganizationHierarchy: jest.fn(),
		getManagerTeamStructure: jest.fn(),
	};

	beforeEach(() => {
		controller = new OrganizationStructureController(mockService as any);
		jest.clearAllMocks();
	});

	it('getManagerTeam returns manager team structure from service', async () => {
		const sample = {
			manager: { _id: 'mgr-1', employeeNumber: 'EMP-001', firstName: 'Jane', lastName: 'Doe', primaryPositionId: 'pos-1' },
			team: {
				id: 'pos-1',
				title: 'Manager',
				children: [
					{ id: 'pos-2', title: 'Staff', children: [], employees: [{ employeeNumber: 'EMP-002', firstName: 'John' }] },
				],
				employees: [{ employeeNumber: 'EMP-001', firstName: 'Jane' }],
			},
		};

		mockService.getManagerTeamStructure.mockResolvedValue(sample);

		const result = await controller.getManagerTeam('mgr-1');

		expect(mockService.getManagerTeamStructure).toHaveBeenCalledWith('mgr-1');
		expect(result).toBe(sample);
	});

	it('returns pending change requests', async () => {
		const sample: Partial<StructureChangeRequest>[] = [
			{
				_id: '1' as any,
				requestNumber: 'REQ-001',
				requestType: StructureRequestType.NEW_POSITION,
				status: StructureRequestStatus.SUBMITTED,
				details: 'Add a new position',
			} as any,
		];

		mockService.listPendingChangeRequests.mockResolvedValue(sample);

		const result = await controller.listPendingRequests();

		expect(mockService.listPendingChangeRequests).toHaveBeenCalled();
		expect(result).toBe(sample);
	});

	it('approveRequest calls service with id and comment', async () => {
		const updated = { requestNumber: 'REQ-001', status: StructureRequestStatus.APPROVED } as any;
		mockService.approveChangeRequest.mockResolvedValue(updated);

		const result = await controller.approveRequest('abc123', { comment: 'Approved by admin' });

		expect(mockService.approveChangeRequest).toHaveBeenCalledWith('abc123', 'Approved by admin');
		expect(result).toBe(updated);
	});

	it('rejectRequest calls service with id and comment', async () => {
		const updated = { requestNumber: 'REQ-002', status: StructureRequestStatus.REJECTED } as any;
		mockService.rejectChangeRequest.mockResolvedValue(updated);

		const result = await controller.rejectRequest('def456', { comment: 'Missing details' });

		expect(mockService.rejectChangeRequest).toHaveBeenCalledWith('def456', 'Missing details');
		expect(result).toBe(updated);
	});

	it('getHierarchy returns the org tree from service', async () => {
		const tree = [
			{
				id: '1',
				title: 'CEO',
				children: [
					{ id: '2', title: 'Manager', children: [{ id: '3', title: 'Staff', children: [] }] },
				],
			},
		];

		mockService.getOrganizationHierarchy = jest.fn().mockResolvedValue(tree);

		const result = await controller.getHierarchy();

		expect(mockService.getOrganizationHierarchy).toHaveBeenCalled();
		expect(result).toBe(tree);
	});

	it('submitChangeRequest calls service with dto and returns saved request', async () => {
		const dto = {
			requestedByEmployeeId: 'emp-123',
			requestType: StructureRequestType.NEW_POSITION,
			targetPositionId: 'pos-456',
			details: 'Request to add a new position',
			reason: 'Project growth',
		} as any;

		const saved = {
			requestNumber: 'SCR-999',
			...dto,
			status: StructureRequestStatus.SUBMITTED,
		} as any;

		mockService.submitChangeRequest.mockResolvedValue(saved);

		const result = await controller.submitChangeRequest(dto);

		expect(mockService.submitChangeRequest).toHaveBeenCalledWith(dto);
		expect(result).toBe(saved);
	});
});
