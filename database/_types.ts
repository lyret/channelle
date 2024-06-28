import type { Prisma } from '@prisma/client';
import type { Client } from './_client';
import type { Repository, RepositoryOperations } from './_repository';
import type { Repositories } from './_repositories';

/** A name of any available repository */
export type RepositoryName = keyof typeof Repositories;

/** Used for calculating database types from Prisma from only giving a model name */
type RepositoryDataType<
  Repo extends Repository<
    ModelName,
    ModelType,
    ModelProjectionType,
    ModelIdField,
    ModelIdType
  >,
  ModelName extends Prisma.ModelName = Prisma.ModelName,
  ModelType extends Client[Lowercase<ModelName>] = Client[Lowercase<ModelName>],
  ModelIdField extends keyof ModelProjectionType = any,
  ModelProjectionType = Prisma.Result<
    Client[Lowercase<ModelName>],
    {},
    'findFirstOrThrow'
  >,
  ModelIdType = ModelProjectionType[ModelIdField],
> = {
  ModelName: ModelName;
  ModelType: ModelType;
  ModelIdField: ModelIdField;
  ModelProjectionType: ModelProjectionType;
  ModelIdType: ModelIdType;
};

/**
 * A mapping between the available data repositories and their relevant database types from prisma
 * used for mapping repositories to socket and get type safety on the client side
 */
export type RepositoryTypes = {
  [Name in RepositoryName]: {
    ModelName: (typeof Repositories)[Name]['__ModelName'];
    ModelType: (typeof Repositories)[Name]['__ModelType'];
    ModelIdField: (typeof Repositories)[Name]['__ModelIdField'];
    ModelProjectionType: (typeof Repositories)[Name]['__ModelProjectionType'];
    ModelIdType: (typeof Repositories)[Name]['__ModelIdType'];
  };
};

/** Any possible database model data type */
export type DataTypes = {
  [Name in RepositoryName]: (typeof Repositories)[Name]['__ModelProjectionType'];
};

/** Any name of a possible operation */
export type OperationName = (typeof RepositoryOperations)[number];

export type RepositoryOperationTypes<
  Name extends RepositoryName,
  Operation extends OperationName,
  Types extends RepositoryTypes[Name] = RepositoryTypes[Name],
  Arguments extends Prisma.Args<Types['ModelType'], Operation> = Prisma.Args<
    Types['ModelType'],
    Operation
  >,
  Result extends Prisma.Result<
    Types['ModelType'],
    Arguments,
    Operation
  > = Prisma.Result<Types['ModelType'], Arguments, Operation>,
> = {
  Args: Arguments;
  Result: Result;
};
