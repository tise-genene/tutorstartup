import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QueueFactoryService } from '../queue/queue.factory';
import { SearchIndexerService } from './search-indexer.service';
import { SearchIndexQueueService } from './search-queue.service';
import { SearchService } from './search.service';
import type { SearchIndexJob } from './search.types';

describe('SearchIndexQueueService', () => {
  const queueAdd = jest.fn<Promise<void>, [string, SearchIndexJob]>();
  const queueClose = jest.fn<Promise<void>, []>();
  const queueMock = {
    add: queueAdd,
    close: queueClose,
  } as unknown as Queue<SearchIndexJob>;

  const createQueueMock = jest.fn().mockReturnValue(queueMock);
  const queueFactory = {
    createQueue: createQueueMock,
  } as unknown as QueueFactoryService;

  const syncTutorProfileMock = jest.fn().mockResolvedValue(undefined);
  const removeTutorProfileMock = jest.fn().mockResolvedValue(undefined);
  const searchIndexer = {
    syncTutorProfile: syncTutorProfileMock,
    removeTutorProfile: removeTutorProfileMock,
  } as unknown as SearchIndexerService;

  const makeConfigService = (queueDriver: string, syncEnabled: boolean) =>
    ({
      get: (key: string) => {
        if (key === 'queue') {
          return { driver: queueDriver };
        }
        if (key === 'search') {
          return { syncEnabled };
        }
        return undefined;
      },
    }) as unknown as ConfigService;

  const makeSearchService = (enabled: boolean) =>
    ({
      isEnabled: jest.fn().mockReturnValue(enabled),
    }) as unknown as SearchService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enqueues jobs when queue driver is redis and search is enabled', async () => {
    const service = new SearchIndexQueueService(
      queueFactory,
      makeConfigService('redis', true),
      searchIndexer,
      makeSearchService(true),
    );

    await service.enqueueUpsert('user-1');
    await service.enqueueDelete('user-2');

    expect(createQueueMock).toHaveBeenCalled();
    expect(queueAdd).toHaveBeenCalledWith('sync-tutor', {
      action: 'UPSERT',
      userId: 'user-1',
    });
    expect(queueAdd).toHaveBeenCalledWith('delete-tutor', {
      action: 'DELETE',
      userId: 'user-2',
    });
    await service.onModuleDestroy();
    expect(queueClose).toHaveBeenCalled();
  });

  it('falls back to inline processing when queue driver is memory', async () => {
    const service = new SearchIndexQueueService(
      queueFactory,
      makeConfigService('memory', true),
      searchIndexer,
      makeSearchService(true),
    );

    await service.enqueueUpsert('inline-user');

    expect(createQueueMock).not.toHaveBeenCalled();
    expect(syncTutorProfileMock).toHaveBeenCalledWith('inline-user');
  });

  it('skips work when search is disabled', async () => {
    const service = new SearchIndexQueueService(
      queueFactory,
      makeConfigService('redis', false),
      searchIndexer,
      makeSearchService(true),
    );

    await service.enqueueUpsert('skipped-user');
    await service.enqueueDelete('skipped-user');

    expect(queueAdd).not.toHaveBeenCalled();
    expect(syncTutorProfileMock).not.toHaveBeenCalled();
    expect(removeTutorProfileMock).not.toHaveBeenCalled();
  });

  it('skips work when search driver is disabled at runtime', async () => {
    const disabledSearchService = makeSearchService(false);
    const service = new SearchIndexQueueService(
      queueFactory,
      makeConfigService('redis', true),
      searchIndexer,
      disabledSearchService,
    );

    await service.enqueueUpsert('disabled-runtime');

    expect(queueAdd).not.toHaveBeenCalled();
    expect(syncTutorProfileMock).not.toHaveBeenCalled();
  });
});
