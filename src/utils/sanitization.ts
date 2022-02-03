import { Request, Response, NextFunction } from "express";
import { isError } from "lodash";

export interface QuerySchemaExpression<T, K = keyof T> {
  /** type prototype name */
  type: string;
  /** current OR one of the provided parameters has to be not null */
  linked?: Exclude<Extract<keyof T, string>, K>[]; // all but the current string keys
  /** default: false */
  optional?: boolean;
}

export type QuerySchema<T> = {
  [K in keyof T]: QuerySchemaExpression<T, K>;
};

export function sanitizeParameterSchema<T>(
  req: Request,
  schema: QuerySchema<T>
): req is Request & { query: T } {
  if (!schema || Object.keys(schema).length === 0) {
    throw new Error(`No schema defined in ${req.hostname}`);
  }

  const evaluateParameterSchema = (
    key: string,
    ignoreLinks: boolean = false
  ) => {
    const param = req.body[key];
    const paramSchema = schema[key as keyof T];

    if (!paramSchema) {
      throw new Error(
        `Empty schema provided for "${key}" parameter, in ${req.hostname} endpoint`
      );
    }

    if (!param && !paramSchema.optional) {
      if (
        !ignoreLinks &&
        !!paramSchema.linked &&
        paramSchema.linked.length > 0
      ) {
        const linksEvaluations = paramSchema.linked.map((linkedParam) => {
          if (linkedParam === key) {
            throw new Error(
              `Self-targeting linked parameter ${linkedParam} detected`
            );
          }
          try {
            evaluateParameterSchema(linkedParam, true);
            return true;
          } catch (e) {
            if (e instanceof MissingMandatoryPropertyError) {
              return false;
            }
          }
        });

        if (linksEvaluations.every((success) => !success)) {
          throw new MissingLinkedPropertyError([key, ...paramSchema.linked]);
        }

        return true;
      }

      if (!param) {
        throw new MissingMandatoryPropertyError(key);
      }
    }

    if (typeof param !== paramSchema.type) {
      throw new WrongTypePropertyError(key, paramSchema.type, typeof param);
    }

    return true;
  };

  return Object.keys(schema)
    .map((key) => evaluateParameterSchema(key))
    .every((success) => !!success);
}

export class RequestError extends Error {
  message!: string;
  status!: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.message = message;
    this.status = status;
  }
}
export class MissingMandatoryPropertyError extends RequestError {
  constructor(propertyName: string) {
    super(
      `[MissingMandatoryPropertyError]: Missing "${propertyName}" property`,
      400
    );
  }
}

export class WrongTypePropertyError extends RequestError {
  constructor(
    propertyName: string,
    requiredType: string,
    providedType: string
  ) {
    super(
      `[WrongTypePropertyError]: Property "${propertyName}" has a type of "${requiredType}", but "${providedType}" was provided.`,
      400
    );
  }
}

export class MissingLinkedPropertyError extends RequestError {
  constructor(propertyNames: string[]) {
    super(
      `[MissingLinkedPropertyError]: Missing at least one of the linked properties: "${propertyNames.join(
        '", or "'
      )}"`,
      400
    );
  }
}
