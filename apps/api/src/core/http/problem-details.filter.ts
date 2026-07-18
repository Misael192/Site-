import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ApiProblem, ErrorCode } from "@peopleflow/contracts";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

/** Mapeia status HTTP → código estável do catálogo (doc 12 §3). */
const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: "VALIDATION_FAILED",
  401: "UNAUTHENTICATED",
  402: "LIMIT_EXCEEDED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
};

/** Toda resposta de erro segue RFC 9457 (Problem Details). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const requestId =
      (request.headers["x-request-id"] as string) ?? randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = "Erro interno";
    let detail: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        title = body;
      } else if (typeof body === "object" && body !== null) {
        const b = body as { message?: string | string[]; error?: string };
        title = b.error ?? exception.message;
        detail = Array.isArray(b.message) ? b.message.join("; ") : b.message;
      }
    } else {
      // erro inesperado: loga com stack, responde sem vazar internals
      this.logger.error("Unhandled exception", exception as Error);
    }

    const problem: ApiProblem = {
      type: `https://docs.peopleflow.app/errors/${status}`,
      title,
      status,
      code: CODE_BY_STATUS[status] ?? "INTERNAL",
      detail,
      requestId,
    };
    response
      .status(status)
      .type("application/problem+json")
      .json(problem);
  }
}
