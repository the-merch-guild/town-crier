import { TemporalModule } from 'nestjs-temporal-core';
import { socialIntegrationList } from '@gitroom/nestjs-libraries/integrations/integration.manager';

export const getTemporalModule = (
  isWorkers: boolean,
  path?: string,
  activityClasses?: any[]
) => {
  const task_queue_filter = (process.env.TEMPORAL_TASK_QUEUES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const worker_list = [
    { identifier: 'main', maxConcurrentJob: undefined },
    ...socialIntegrationList,
  ].filter((f) => f.identifier.indexOf('-') === -1);

  const filtered_worker_list = task_queue_filter.length
    ? worker_list.filter((w) => task_queue_filter.includes(w.identifier))
    : worker_list;

  return TemporalModule.register({
    isGlobal: true,
    connection: {
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    },
    taskQueue: 'main',
    logLevel: 'error',
    ...(isWorkers
      ? {
          workers: filtered_worker_list.map((integration) => ({
              taskQueue: integration.identifier.split('-')[0],
              workflowsPath: path!,
              activityClasses: activityClasses!,
              autoStart: true,
              ...(integration.maxConcurrentJob
                ? {
                    workerOptions: {
                      maxConcurrentActivityTaskExecutions:
                        integration.maxConcurrentJob,
                    },
                  }
                : {}),
            })),
        }
      : {}),
  });
};
