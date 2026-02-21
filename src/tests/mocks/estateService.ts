export const mockEstateService = {
  createEstate: vi.fn().mockResolvedValue({
    success: true,
    estateId: 'test-estate-id',
    name: 'Test Estate'
  }),
  updateEstate: vi.fn().mockResolvedValue({
    success: true,
    estateId: 'test-estate-id'
  }),
  getEstate: vi.fn().mockResolvedValue({
    success: true,
    estate: {
      id: 'test-estate-id',
      name: 'Test Estate',
      deceasedName: 'Test Deceased',
      deceasedDateOfDeath: '2023-01-01'
    }
  })
};
