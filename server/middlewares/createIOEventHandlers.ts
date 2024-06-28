import {
  Repository,
  RepositoryOperations,
  RepositoryOperationsThatIntroducesChanges,
} from '../../database';
import * as IO from 'socket.io';
import {
  SubscriptionMessage,
  createSubscriptionPath,
} from '../../shared/subscriptions';

/** A map between online participants and connected sockets */
const onlineParticipants = new Map<string, number>();

/**
 * Create event handlers for a newly connection clients (ie. a socket)
 */
export const createIOEventHandlers = async (socket: IO.Socket) => {
  // Debug output
  console.log(`[IO] ${socket.id} connected!`);

  socket.on('registerParticipant', async (id) => {
    try {
      console.log(`[IO] ${socket.id} registered participant id ${id}`);

      const result = await Repository._allRepositories['participant'].operate(
        'update',
        {
          where: { id: Number(id) },
          data: { online: true },
        }
      );
      Repository._allRepositories['participant'].emitOne(Number(id));
      Repository._allRepositories['participant'].emitAll();

      onlineParticipants.set(socket.id, id);
      socket.emit('registerParticipant', { ok: true, data: result });
    } catch {
      socket.emit('registerParticipant', { ok: false });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[IO] ${socket.id} left...`);
    if (onlineParticipants.has(socket.id)) {
      try {
        const id = onlineParticipants.get(socket.id);
        Repository._allRepositories['participant'].operate('update', {
          where: { id: Number(id) },
          data: { online: false },
        });
        Repository._allRepositories['participant'].emitOne(Number(id));
        Repository._allRepositories['participant'].emitAll();
      } catch {}
    }
  });

  // When a subscription starts, it is added on a server side room for that subscription path
  // The current data is emitted to that single subscriber
  socket.on('subscribe', async (message: SubscriptionMessage) => {
    const path = createSubscriptionPath(message);
    const repository: Repository<any, any, any> =
      Repository._allRepositories[message.repository];
    try {
      if (!repository) {
        throw new Error(`No repository exists namned "${message.repository}"`);
      }
      // Join the path
      console.log(`[IO] ${socket.id} subscribed to ${path}`);
      socket.join(path);

      // Emit current data
      if (message.id) {
        repository.emitOne(message.id, socket);
      } else {
        repository.emitAll(socket);
      }
    } catch (error) {
      console.error(`[IO] Subscribe Error: ${error}`);
      return;
    }
  });

  // When a client want to stop a subscription, it is removed from the corresponding room
  socket.on('unsubscribe', async (message: SubscriptionMessage) => {
    const path = createSubscriptionPath(message);
    console.log(`[IO] ${socket.id} unsubscribed to ${path}`);
    socket.leave(path);
  });

  for (const operation of RepositoryOperations)
    socket.on(operation, async (message: SubscriptionMessage) => {
      const path = createSubscriptionPath(message);
      const repository: Repository<any, any, any> =
        Repository._allRepositories[message.repository];
      try {
        if (!repository) {
          throw new Error(
            `No repository exists namned "${message.repository}"`
          );
        }

        console.log(
          `[IO] ${socket.id} :: ${operation} :: ${path} :: ${JSON.stringify(message.args)}`
        );

        const result = await repository.operate(operation, message.args);

        // Emit the result back to the caller
        socket.emit(message.messageId, { data: result, ok: true });

        // Update all subscribers when data is modified
        if (RepositoryOperationsThatIntroducesChanges.includes(operation)) {
          if (message.id) {
            repository.emitOne(message.id);
            repository.emitAll();
          } else {
            repository.emitAll();
          }
        }
      } catch (error) {
        console.error(`[IO] ${operation} Error: ${error}`);
        socket.emit(message.messageId, { ok: false, error: `${error}` });
        return;
      }
    });
};
