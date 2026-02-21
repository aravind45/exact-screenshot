export const mockAuthService = {
  register: vi.fn().mockResolvedValue({
    success: true,
    userId: 'test-user-id',
    email: 'test@example.com'
  }),
  login: vi.fn().mockResolvedValue({
    success: true,
    userId: 'test-user-id',
    token: 'test-token'
  }),
  logout: vi.fn().mockResolvedValue({
    success: true
  }),
  getCurrentUser: vi.fn().mockResolvedValue({
    success: true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }
  })
};