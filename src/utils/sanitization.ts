import { Request, Response } from "express";
import { FileArray } from "express-fileupload";

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

export function sanitizeQuerySchema<T>(
  req: Request,
  schema: QuerySchema<T>
): req is Exclude<Request, "query"> & { query: T } {
  return sanitizeInputSchema(req, schema, "query");
}
export function sanitizeBodySchema<T>(
  req: Request,
  schema: QuerySchema<T>
): req is Exclude<Request, "body"> & { body: T } {
  return sanitizeInputSchema(req, schema, "body");
}

function sanitizeInputSchema<T>(
  req: Request,
  schema: QuerySchema<T>,
  querySource: "body" | "query"
): boolean {
  if (!schema || Object.keys(schema).length === 0) {
    throw new Error(`No schema defined in ${req.hostname}`);
  }

  const evaluateParameterSchema = (
    key: string,
    ignoreLinks: boolean = false
  ) => {
    const paramSchema = schema[key as keyof T];
    const param = req[querySource][key];

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

export function sanitizeFiles<T>(
  req: Request,
  res: Response
): req is Request & { files: FileArray & T } {
  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send("No files were uploaded.");
    return false;
  }

  if (Array.isArray(req.files)) {
    res.status(400).send("Please only upload one file at the time.");
    return false;
  }

  return true;
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
