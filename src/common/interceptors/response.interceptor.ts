// src/common/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode ?? HttpStatus.OK,
        message: this.resolveMessage(request.method, response.statusCode),
        data: data ?? null,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }

  private resolveMessage(method: string, statusCode: number): string {
    if (statusCode === HttpStatus.CREATED) return 'Resource created successfully';
    if (statusCode === HttpStatus.NO_CONTENT) return 'Operation completed successfully';

    const messages: Record<string, string> = {
      GET: 'Data fetched successfully',
      POST: 'Request processed successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };

    return messages[method] ?? 'Operation successful';
  }
}