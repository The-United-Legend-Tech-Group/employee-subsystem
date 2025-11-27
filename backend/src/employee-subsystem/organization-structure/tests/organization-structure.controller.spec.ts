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
		deactivatePosition: jest.fn(),
		updatePosition: jest.fn(),
		removePosition: jest.fn(),
		updateDepartment: jest.fn(),
		createDepartment: jest.fn(),
		listDepartments: jest.fn(),
		getDepartmentById: jest.fn(),
		createPosition: jest.fn(),
		listPositions: jest.fn(),
		getPositionById: jest.fn(),
	};

	beforeEach(() => {
		controller = new OrganizationStructureController(mockService as any);
		jest.clearAllMocks();
	});

	it('deactivatePosition calls service and returns updated position', async () => {
		const updated = { _id: 'pos-123', code: 'P-1', title: 'Old Role', isActive: false } as any;
		mockService.deactivatePosition.mockResolvedValue(updated);

		const result = await controller.deactivatePosition('pos-123');

		expect(mockService.deactivatePosition).toHaveBeenCalledWith('pos-123');
		expect(result).toBe(updated);
	});

	it('removePosition calls service to delete a position', async () => {
		mockService.removePosition.mockResolvedValue(undefined);

		const result = await controller.removePosition('pos-999');

		expect(mockService.removePosition).toHaveBeenCalledWith('pos-999');
		expect(result).toBeUndefined();
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

	it('updatePosition calls service and returns updated position', async () => {
		const updated = { _id: 'pos-234', code: 'P-2', title: 'New Role', isActive: true } as any;
		mockService.updatePosition.mockResolvedValue(updated);

		const dto = { title: 'New Role', isActive: true } as any;
		const result = await controller.updatePosition('pos-234', dto);

		expect(mockService.updatePosition).toHaveBeenCalledWith('pos-234', dto);
		expect(result).toBe(updated);
	});

	it('updateDepartment calls service and returns updated department', async () => {
		const updated = { _id: 'dep-1', code: 'D-1', name: 'HR', isActive: true } as any;
		mockService.updateDepartment.mockResolvedValue(updated);

		const dto = { name: 'HR', isActive: true } as any;
		const result = await controller.updateDepartment('dep-1', dto);

		expect(mockService.updateDepartment).toHaveBeenCalledWith('dep-1', dto);
		expect(result).toBe(updated);
	});

	it('createDepartment calls service and returns created department', async () => {
		const dto = { code: 'D-2', name: 'Finance' } as any;
		const created = { _id: 'dep-2', ...dto } as any;
		mockService.createDepartment.mockResolvedValue(created);

		const result = await controller.createDepartment(dto);

		expect(mockService.createDepartment).toHaveBeenCalledWith(dto);
		expect(result).toBe(created);
	});

	it('listDepartments returns departments from service', async () => {
		const list = [ { _id: 'dep-1', code: 'D-1', name: 'HR' } ] as any[];
		mockService.listDepartments.mockResolvedValue(list);

		const result = await controller.listDepartments();

		expect(mockService.listDepartments).toHaveBeenCalled();
		expect(result).toBe(list);
	});

	it('getDepartment returns department by id', async () => {
		const dept = { _id: 'dep-1', code: 'D-1', name: 'HR' } as any;
		mockService.getDepartmentById.mockResolvedValue(dept);

		const result = await controller.getDepartment('dep-1');

		expect(mockService.getDepartmentById).toHaveBeenCalledWith('dep-1');
		expect(result).toBe(dept);
	});

	it('createPosition calls service and returns created position', async () => {
		const dto = { code: 'P-10', title: 'Developer', departmentId: 'dep-1' } as any;
		const created = { _id: 'pos-10', ...dto } as any;
		mockService.createPosition.mockResolvedValue(created);

		const result = await controller.createPosition(dto);

		expect(mockService.createPosition).toHaveBeenCalledWith(dto);
		expect(result).toBe(created);
	});

	it('listPositions returns positions from service', async () => {
		const list = [ { _id: 'pos-1', code: 'P-1', title: 'Dev' } ] as any[];
		mockService.listPositions.mockResolvedValue(list);

		const result = await controller.listPositions();

		expect(mockService.listPositions).toHaveBeenCalled();
		expect(result).toBe(list);
	});

	it('getPosition returns position by id', async () => {
		const pos = { _id: 'pos-1', code: 'P-1', title: 'Dev' } as any;
		mockService.getPositionById.mockResolvedValue(pos);

		const result = await controller.getPosition('pos-1');

		expect(mockService.getPositionById).toHaveBeenCalledWith('pos-1');
		expect(result).toBe(pos);
	});

});
