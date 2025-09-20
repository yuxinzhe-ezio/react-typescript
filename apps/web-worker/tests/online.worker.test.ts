// 测试 JavaScript 版本的 online worker
const { handleOnlineRequest, handleBatchRequests } = require('../src/online.worker.js');

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Online Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOnlineRequest', () => {
    it('should handle successful request', async () => {
      const mockData = { message: 'success' };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await handleOnlineRequest('https://api.example.com/data');

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', {});
      expect(result).toEqual({
        data: mockData,
        status: 200,
        url: 'https://api.example.com/data',
      });
    });

    it('should handle HTTP errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });

      await expect(handleOnlineRequest('https://api.example.com/notfound')).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(handleOnlineRequest('https://api.example.com/error')).rejects.toThrow(
        'Network request failed: Network error'
      );
    });

    it('should pass request options', async () => {
      const mockData = { result: 'ok' };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      await handleOnlineRequest('https://api.example.com/post', options);

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/post', options);
    });
  });

  describe('handleBatchRequests', () => {
    it('should handle multiple requests', async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockData1),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockData2),
        });

      const urls = ['https://api.example.com/1', 'https://api.example.com/2'];
      const results = await handleBatchRequests(urls);

      expect(results).toHaveLength(2);
      expect(results[0].data).toEqual(mockData1);
      expect(results[1].data).toEqual(mockData2);
    });
  });
});
